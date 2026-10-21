import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeEventTopics, encodeAbiParameters, erc20Abi } from 'viem';
import { normalizePayment, assertAction, publicPayment, verifyPaymentReceipt } from '../server/model.mjs';
import { makeService } from '../server/service.mjs';

const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const token = '0x3333333333333333333333333333333333333333';
const hash = `0x${'ab'.repeat(32)}`;
const input = { reference: 'EXACT-001', recipient, source: 'arc', amount: '1', targetAmount: '0.8' };
const goodQuote = () => ({ expected: '822102', minimum: '813881', expiresAt: Date.now() + 60000, fees: [] });
function fixture(overrides = {}) {
  const store = { state: { payments: [] }, account: { address: sender }, save() {} };
  const chain = {
    quote: async () => goodQuote(),
    swap: async p => {
      p.outputAmount = '822102';
      p.transactions.push({ step: `swap:${p.attempt}`, status: 'success', chain: 'arc', hash });
      return 822102n;
    },
    pay: async () => {},
    ...overrides,
  };
  return { store, service: makeService(store, chain) };
}

test('invoice target is normalized exactly and legacy inputs retain their original meaning', () => {
  const normalized = normalizePayment(input, sender);
  assert.equal(normalized.targetAmount, '800000');
  assert.equal(normalized.amount, '1000000');
  const { targetAmount, ...legacy } = input;
  assert.deepEqual(normalizePayment(legacy, sender), { reference: 'EXACT-001', recipient, source: 'arc', amount: '1000000' });
  for (const targetAmount of ['0', '-1', '1e2', '0.0000001', '', null, 0.8, '100.000001']) {
    assert.throws(() => normalizePayment({ ...input, targetAmount }, sender), /EURC|invoice|target/i);
  }
  assert.equal(normalizePayment({ ...input, targetAmount: '0.000001' }, sender).targetAmount, '1');
});

test('invoice receipt proves the target, not all conversion output or a short payment', () => {
  const payment = { recipient, sender, targetAmount: '800000', outputAmount: '822102' };
  const receipt = amount => ({ status: 'success', transactionHash: hash, logs: [{ address: token,
    topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from: sender, to: recipient } }),
    data: encodeAbiParameters([{ type: 'uint256' }], [amount]),
  }] });
  assert.equal(verifyPaymentReceipt(payment, receipt(800000n), token, hash), true);
  assert.throws(() => verifyPaymentReceipt(payment, receipt(822102n), token, hash));
  assert.throws(() => verifyPaymentReceipt(payment, receipt(799999n), token, hash));
  assert.throws(() => verifyPaymentReceipt({ ...payment, outputAmount: '799999' }, receipt(800000n), token, hash));
});

test('an invoice quote that cannot cover its target never enables conversion', async () => {
  const { service } = fixture({ quote: async () => ({ ...goodQuote(), minimum: '799999' }) });
  const p = service.create(input);
  await service.act(p.id, 'quote');
  assert.equal(p.status, 'funded');
  assert.equal(p.quote, undefined);
  assert.match(p.error, /invoice|target/i);
  assert.throws(() => assertAction({ status: 'quoted', targetAmount: '800000', amount: '1000000', quote: { ...goodQuote(), minimum: '799999' } }, 'swap'));
});

test('refreshing a quote invalidates the old approval even when the new estimate fails', async () => {
  let quotes = 0;
  const { service } = fixture({ quote: async () => { if (++quotes === 2) throw new Error('No route available'); return goodQuote(); } });
  const p = service.create(input);
  await service.act(p.id, 'quote');
  assert.equal(p.status, 'quoted');
  await service.act(p.id, 'quote');
  assert.equal(p.status, 'funded');
  assert.equal(p.quote, undefined);
  await assert.rejects(service.act(p.id, 'swap'));
});

test('public invoice records distinguish conversion output, recipient target and retained surplus', async () => {
  const { service } = fixture();
  const p = service.create(input);
  await service.act(p.id, 'quote');
  await service.act(p.id, 'swap');
  assert.equal(p.status, 'converted');
  const converted = publicPayment(p);
  assert.equal(converted.targetAmount, '800000');
  assert.equal(converted.outputAmount, '822102');
  assert.equal(converted.paymentAmount, '800000');
  assert.equal(converted.surplusAmount, '22102');
  await service.act(p.id, 'pay');
  await service.act(p.id, 'reconcile');
  assert.equal(p.status, 'reconciled');
  assert.equal(publicPayment(p).paymentAmount, '800000');
  assert.throws(() => assertAction({ ...p, status: 'converted', outputAmount: '799999' }, 'pay'));
});

test('uncertain invoice payout recovers its original transaction without a second payout', async () => {
  let sends = 0;
  const { service } = fixture({
    pay: async p => { sends++; p.transactions.push({ step: 'pay:1', chain: 'arc', hash: 'original-payment', status: 'submitted' }); throw new Error('Response lost'); },
    recoverPay: async p => { p.transactions.find(t => t.step === 'pay:1').status = 'success'; },
  });
  const p = service.create(input);
  await service.act(p.id, 'quote'); await service.act(p.id, 'swap'); await service.act(p.id, 'pay');
  assert.equal(p.status, 'paying');
  await assert.rejects(service.act(p.id, 'pay'));
  await service.act(p.id, 'recover');
  assert.equal(p.status, 'paid'); assert.equal(sends, 1);
  assert.equal(p.transactions.find(t => t.step === 'pay:1').hash, 'original-payment');
  assert.equal(publicPayment(p).paymentAmount, '800000');
});

test('historical variable-output records still pay their original converted amount', () => {
  const p = { recipient, sender, outputAmount: '822102', transactions: [] };
  assert.equal(publicPayment(p).paymentAmount, '822102');
  assert.equal(publicPayment(p).targetAmount, undefined);
  assert.equal(publicPayment(p).surplusAmount, '0');
});

test('independent proof report separates recipient payment from converted output for exact and legacy records', async () => {
  const eurc = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
  const fixtures = [800000n, undefined, 1n].map((target, i) => {
    const swapHash = `0x${String(i + 1).repeat(64)}`;
    const payHash = `0x${String(i + 4).repeat(64)}`;
    const log = (from, to, value) => ({ address: eurc,
      topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from, to } }),
      data: encodeAbiParameters([{ type: 'uint256' }], [value]),
    });
    return {
      payment: { reference: `PROOF-${i}`, status: 'reconciled', source: 'arc', sender, recipient, amount: '1000000', outputAmount: '822102', ...(target === undefined ? {} : { targetAmount: target.toString() }), attempt: 1, quote: { minimum: '813881' }, transactions: [{ step: 'swap:1', chain: 'arc', hash: swapHash, status: 'success' }, { step: 'pay:1', chain: 'arc', hash: payHash, status: 'success' }] },
      receipts: {
        [swapHash]: { transactionHash: swapHash, status: '0x1', blockNumber: '0x1', gasUsed: '0x1', effectiveGasPrice: '0x1', logs: [log(recipient, sender, 822102n)] },
        [payHash]: { transactionHash: payHash, status: '0x1', blockNumber: '0x2', gasUsed: '0x1', effectiveGasPrice: '0x1', logs: [log(sender, recipient, target ?? 822102n)] },
      },
    };
  });
  // Execute the actual script with synthetic API/RPC boundaries; no network or wallet access.
  const receipts = Object.assign({}, ...fixtures.map(f => f.receipts));
  const originalFetch = globalThis.fetch, originalLog = console.log;
  let report;
  try {
    globalThis.fetch = async (url, options = {}) => {
      if (String(url) === 'http://127.0.0.1:8787/api/testnet') return Response.json({ environment: 'testnet', busy: null, sender, payments: fixtures.map(f => f.payment) });
      const rpc = JSON.parse(options.body);
      const result = rpc.method === 'eth_chainId' ? (String(url).includes('sepolia.base.org') ? '0x14a34' : '0x4cef52') : rpc.method === 'eth_getTransactionReceipt' ? receipts[rpc.params[0]] : rpc.method === 'eth_call' ? `0x${'0'.repeat(64)}` : rpc.method === 'eth_getBalance' ? '0x0' : undefined;
      if (result === undefined) throw new Error('Unexpected proof RPC request: ' + rpc.method);
      return Response.json({ jsonrpc: '2.0', id: rpc.id, result });
    };
    console.log = value => { report = JSON.parse(value); };
    await import('../scripts/verify-testnet.mjs');
  } finally {
    globalThis.fetch = originalFetch; console.log = originalLog;
  }
  assert.deepEqual(report.payments.map(p => p.paidEURC), ['0.8', '0.822102', '0.000001']);
  assert.deepEqual(report.payments.map(p => p.outputEURC), ['0.822102', '0.822102', '0.822102']);
  assert.deepEqual(report.payments.map(p => p.surplusEURC), ['0.022102', '0', '0.822101']);
});
