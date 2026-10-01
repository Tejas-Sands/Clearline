import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePrivateKey } from 'viem/accounts';
import { getDb } from '../server/db.mjs';
import { makeDbStore } from '../api/testnet/payments/_shared.mjs';
import { sendJournaled } from '../server/journal.mjs';
import { keccak256, encodeEventTopics, encodeAbiParameters, erc20Abi } from 'viem';
import handler from '../api/testnet/payments/action.mjs';

function fixture() {
  const keys = ['WALLET_PRIVATE_KEY', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
  const original = keys.map(key => process.env[key]);
  try {
    process.env.WALLET_PRIVATE_KEY = generatePrivateKey();
    process.env.TURSO_DATABASE_URL = 'https://database.invalid';
    process.env.TURSO_AUTH_TOKEN = 'test-only';
    const payment = { id: 'test', reference: 'DB-TEST', sender: '0x1111', status: 'swapping', createdAt: 1, updatedAt: 1, transactions: [] };
    return { payment, store: makeDbStore(payment), db: getDb() };
  } finally {
    keys.forEach((key, index) => {
      if (original[index] === undefined) delete process.env[key];
      else process.env[key] = original[index];
    });
  }
}

test('hosted conversion can checkpoint through the unbound journal callback', async t => {
  const { payment, store, db } = fixture();
  let durable;
  t.mock.method(db, 'execute', async statement => { durable = JSON.parse(statement.args[5]); });
  const hash = await sendJournaled(payment, 'swap_approve:1', 'arc', { to: '0x1111' }, {
    sign: async () => ({ raw: '0x12', hash: '0xab' }),
    broadcast: async () => {
      assert.equal(durable.transactions[0].raw, '0x12');
      assert.equal(durable.transactions[0].status, 'signed');
    },
  }, store.save);
  await store.flush();
  assert.equal(hash, '0xab');
  assert.equal(durable.transactions[0].status, 'submitted');
});

test('hosted checkpoints serialize immutable snapshots so older writes cannot overwrite newer state', async t => {
  const { payment, store, db } = fixture();
  let release;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started;
  const saving = new Promise<void>(resolve => { started = resolve; });
  const completed = [];
  let writes = 0;
  t.mock.method(db, 'execute', async statement => {
    const snapshot = JSON.parse(statement.args[5]);
    if (++writes === 1) { started(); await gate; }
    completed.push(snapshot.status);
  });
  const first = store.save();
  await saving;
  payment.status = 'converted';
  const second = store.save();
  payment.status = 'paying'; // Mutating live state must not change the queued snapshot.
  try { assert.equal(writes, 1, 'newer writes must not race the older checkpoint'); }
  finally { release(); await Promise.all([first, second]); await store.flush(); }
  assert.deepEqual(completed, ['swapping', 'converted']);
});

test('hosted checkpoint failures are surfaced and a recovery checkpoint can persist the retained signature', async t => {
  const { payment, store, db } = fixture();
  let durable;
  let writes = 0;
  t.mock.method(db, 'execute', async statement => {
    if (++writes === 1) throw new Error('database unavailable');
    durable = JSON.parse(statement.args[5]);
  });
  const first = store.save();
  const flush = store.flush();
  flush.catch(() => {});
  await assert.rejects(async () => await first, /database unavailable/);
  await assert.rejects(flush, /database unavailable/);
  payment.transactions.push({ step: 'swap_approve:1', chain: 'arc', raw: '0x12', hash: '0xab', status: 'signed' });
  await store.save();
  await store.flush();
  assert.equal(durable.transactions[0].raw, '0x12');
});

test('hosted conversion recovery checkpoints the original bytes and returns only verified public output', async t => {
  const { payment, store, db } = fixture();
  const previousKey = process.env.WALLET_PRIVATE_KEY;
  const previousToken = process.env.API_SESSION_TOKEN;
  process.env.WALLET_PRIVATE_KEY = store.privateKey;
  process.env.API_SESSION_TOKEN = 'test-session-token';
  t.after(() => {
    if (previousKey === undefined) delete process.env.WALLET_PRIVATE_KEY;
    else process.env.WALLET_PRIVATE_KEY = previousKey;
    if (previousToken === undefined) delete process.env.API_SESSION_TOKEN;
    else process.env.API_SESSION_TOKEN = previousToken;
  });
  const hash = keccak256('0x12');
  const router = '0x2222222222222222222222222222222222222222';
  Object.assign(payment, { id: 'abc-123', sender: store.account.address, attempt: 1,
    quote: { minimum: '890000' }, events: [],
    transactions: [{ step: 'swap:1', chain: 'arc', raw: '0x12', hash, status: 'signed' }],
  });
  let durable = structuredClone(payment);
  let completedWrites = 0;
  t.mock.method(db, 'batch', async () => []);
  t.mock.method(db, 'execute', async statement => {
    if (statement.sql.startsWith('SELECT')) return { rows: [{ data: JSON.stringify(durable) }] };
    durable = JSON.parse(statement.args[5]);
    completedWrites++;
    return { rows: [] };
  });
  let broadcasts = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(String(url)).hostname, 'rpc.testnet.arc.network');
    const req = JSON.parse(options.body);
    let result;
    if (req.method === 'eth_chainId') result = '0x4cef52';
    else if (req.method === 'eth_sendRawTransaction') {
      assert.equal(req.params[0], '0x12');
      assert.equal(durable.transactions[0].raw, '0x12');
      assert.equal(durable.transactions[0].status, 'signed');
      assert.equal(completedWrites, 1, 'recovery must finish a fresh checkpoint before broadcasting');
      broadcasts++;
      result = hash;
    } else if (req.method === 'eth_getTransactionReceipt') {
      result = { transactionHash: hash, status: '0x1', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', gasUsed: '0x1', cumulativeGasUsed: '0x1', effectiveGasPrice: '0x1', logs: [{
        address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
        topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from: router, to: payment.sender } }),
        data: encodeAbiParameters([{ type: 'uint256' }], [900000n]),
        blockHash: hash, blockNumber: '0x1', transactionHash: hash, transactionIndex: '0x0', logIndex: '0x0', removed: false,
      }] };
    } else if (req.method === 'eth_getTransactionByHash') {
      result = { hash, to: router, from: payment.sender, input: '0x12345678', value: '0x0', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', nonce: '0x0', gas: '0xffff', gasPrice: '0x1', type: '0x0', v: '0x1b', r: hash, s: hash };
    } else throw new Error(`Unexpected RPC ${req.method}`);
    return Response.json({ jsonrpc: '2.0', id: req.id, result });
  });
  let status;
  let response;
  const res = { setHeader() {}, status(code) { status = code; return this; }, json(body) { response = body; } };
  await handler({ method: 'POST', url: '/api/testnet/payments/abc-123/recover', headers: {
    host: 'localhost', 'content-type': 'application/json', 'x-clearline-token': 'test-session-token', 'x-session-id': 'test-session-123',
  } }, res);
  assert.equal(status, 202);
  assert.equal(response.status, 'converted', response.error);
  assert.equal(response.outputAmount, '900000');
  assert.equal(durable.status, 'converted');
  assert.equal(durable.transactions[0].status, 'success');
  assert.equal(durable.transactions[0].raw, '0x12');
  assert.equal(response.transactions[0].raw, undefined);
  assert.equal(broadcasts, 1);
});
