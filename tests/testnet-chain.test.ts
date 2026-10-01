import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encodeEventTopics, encodeAbiParameters, erc20Abi } from 'viem';
import { SwapKit } from '@circle-fin/swap-kit';
import { makeChain } from '../server/chain.mjs';
import * as chainModule from '../server/chain.mjs';

const arc = { chain: 'Arc_Testnet', chainId: 5042002, name: 'Arc Testnet' };
const ethereum = { chain: 'Ethereum', chainId: 1, name: 'Ethereum' };
function fixture(t, chainId = '0x4cef52') {
  const privateKey = generatePrivateKey();
  const store = { privateKey, account: privateKeyToAccount(privateKey), save() {} };
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.method, 'eth_chainId', 'Unexpected network request during adapter test');
    return Response.json({ jsonrpc: '2.0', id: request.id, result: chainId });
  });
  return { store, chain: makeChain(store), payment: { sender: store.account.address, recipient: '0x2222222222222222222222222222222222222222', amount: '1000000', attempt: 0, transactions: [] } };
}
const estimate = { estimatedOutput: { token: 'EURC', amount: '0.9' }, stopLimit: { token: 'EURC', amount: '0.89' }, fees: [] };

test('installed Swap Kit adapter resolves Arc viem factories and rejects mainnet factories', async t => {
  const { store, chain, payment } = fixture(t);
  t.mock.method(SwapKit.prototype, 'estimate', async ({ from }) => {
    assert.equal(await from.adapter.getAddress(arc), store.account.address);
    assert.equal((await from.adapter.getPublicClient(arc)).chain.id, 5042002);
    await assert.rejects(from.adapter.getAddress(ethereum), /Only Arc Testnet/);
    await assert.rejects(from.adapter.getPublicClient(ethereum), /Only Arc Testnet/);
    return estimate;
  });
  assert.equal((await chain.quote(payment)).minimum, '890000');
});

test('quote adapter cannot submit transactions', async t => {
  const { chain, payment } = fixture(t);
  t.mock.method(SwapKit.prototype, 'estimate', async ({ from }) => {
    const wallet = await from.adapter.initializeWalletClient(arc);
    await assert.rejects(wallet.sendTransaction({ to: wallet.account.address, value: 0n }), /quote cannot submit/i);
    return estimate;
  });
  await chain.quote(payment);
  assert.equal(payment.transactions.length, 0);
});

test('swap passes the approved minimum as an integer base-unit stop limit', async t => {
  const { chain, payment } = fixture(t);
  payment.attempt = 1;
  payment.quote = { minimum: '890000' };
  let submitted;
  t.mock.method(SwapKit.prototype, 'swap', async params => {
    submitted = params;
    return {};
  });
  await chain.swap(payment);
  assert.equal(submitted.config.stopLimit, '890000');
});

test('unexpected RPC chain is rejected before calling the swap provider', async t => {
  const { chain, payment } = fixture(t, '0x1');
  const provider = t.mock.method(SwapKit.prototype, 'estimate', async () => estimate);
  await assert.rejects(chain.quote(payment), /unexpected chain/);
  assert.equal(provider.mock.callCount(), 0);
});

test('USDC approve and increaseAllowance are journaled as approvals, never swaps', () => {
  for (const data of ['0x095ea7b3', '0x39509351']) {
    assert.equal(chainModule.isSwapApproval({ to: chainModule.USDC, data }), true);
  }
  assert.equal(chainModule.isSwapApproval({ to: chainModule.EURC, data: '0x095ea7b3' }), false);
  assert.equal(chainModule.isSwapApproval({ to: chainModule.USDC, data: '0xa9059cbb' }), false);
});

test('legacy misclassified approval is recovered only after checking transaction and receipt', async t => {
  const { chain, payment } = fixture(t);
  const hash = `0x${'ab'.repeat(32)}`;
  payment.attempt = 1;
  payment.quote = { minimum: '890000' };
  payment.transactions.push({ step: 'swap:1', chain: 'arc', hash, status: 'success' });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const req = JSON.parse(options.body);
    const result = req.method === 'eth_chainId' ? '0x4cef52' : req.method === 'eth_getTransactionByHash'
      ? { hash, to: chainModule.USDC, from: payment.sender, input: '0x39509351', value: '0x0', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', nonce: '0x0', gas: '0xffff', gasPrice: '0x1', type: '0x0', v: '0x1b', r: hash, s: hash }
      : req.method === 'eth_getTransactionReceipt'
        ? { transactionHash: hash, status: '0x1', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', gasUsed: '0x1', cumulativeGasUsed: '0x1', effectiveGasPrice: '0x1', logs: [] }
        : (() => { throw Error(`Unexpected RPC ${req.method}`); })();
    return Response.json({ jsonrpc: '2.0', id: req.id, result });
  });
  assert.equal(await chain.recoverSwap(payment), null);
  assert.equal(payment.transactions[0].step, 'swap_approve:1');
  assert.equal(payment.transactions[0].hash, hash);
});

test('successful swap also resolves the SDK approval journal receipt', async t => {
  const { chain, payment } = fixture(t);
  const hash = `0x${'ab'.repeat(32)}`;
  const approvalHash = `0x${'cd'.repeat(32)}`;
  const router = '0x2222222222222222222222222222222222222222';
  payment.attempt = 1; payment.quote = { minimum: '890000' };
  payment.transactions.push({ step: 'swap_approve:1', chain: 'arc', hash: approvalHash, status: 'submitted' }, { step: 'swap:1', chain: 'arc', hash, status: 'success' });
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const req = JSON.parse(options.body);
    const logs = req.params?.[0] === hash ? [{ address: chainModule.EURC, topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from: router, to: payment.sender } }), data: encodeAbiParameters([{ type: 'uint256' }], [900000n]), blockHash: hash, blockNumber: '0x1', transactionHash: hash, transactionIndex: '0x0', logIndex: '0x0', removed: false }] : [];
    const result = req.method === 'eth_chainId' ? '0x4cef52' : req.method === 'eth_getTransactionByHash'
      ? { hash, to: router, from: payment.sender, input: '0x12345678', value: '0x0', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', nonce: '0x0', gas: '0xffff', gasPrice: '0x1', type: '0x0', v: '0x1b', r: hash, s: hash }
      : req.method === 'eth_getTransactionReceipt'
        ? { transactionHash: req.params[0], status: '0x1', blockNumber: '0x1', blockHash: hash, transactionIndex: '0x0', gasUsed: '0x1', cumulativeGasUsed: '0x1', effectiveGasPrice: '0x1', logs }
        : (() => { throw Error(`Unexpected RPC ${req.method}`); })();
    return Response.json({ jsonrpc: '2.0', id: req.id, result });
  });
  assert.equal(await chain.recoverSwap(payment), 900000n);
  assert.equal(payment.transactions[0].status, 'success');
});

test('payout requires a verified conversion, not just a stored output amount', async t => {
  const { chain, payment } = fixture(t);
  payment.outputAmount = '900000'; payment.quote = { minimum: '890000' };
  await assert.rejects(chain.pay(payment), /verified swap/i);
  assert.equal(payment.transactions.length, 0);
});

test('retrying a reverted CCTP mint preserves the source burn and verifies reversion again', async t => {
  const { chain, payment } = fixture(t);
  const burnHash = `0x${'ab'.repeat(32)}`, mintHash = `0x${'cd'.repeat(32)}`;
  payment.transactions.push({ step: 'burn', chain: 'base', hash: burnHash, status: 'success' }, { step: 'mint', chain: 'arc', hash: mintHash, status: 'reverted' });
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const req = JSON.parse(options.body); requests.push(req);
    const result = req.method === 'eth_chainId' ? (String(url).includes('base') ? '0x14a34' : '0x4cef52')
      : req.method === 'eth_getTransactionReceipt'
        ? { transactionHash: req.params[0], status: req.params[0] === mintHash ? '0x0' : '0x1', blockNumber: '0x1', blockHash: burnHash, transactionIndex: '0x0', gasUsed: '0x1', cumulativeGasUsed: '0x1', effectiveGasPrice: '0x1', logs: [] }
        : (() => { throw Error(`Unexpected signing RPC ${req.method}`); })();
    return Response.json({ jsonrpc: '2.0', id: req.id, result });
  });
  // Stop at the original burn's empty mock receipt, before any destination signing.
  await assert.rejects(chain.retryBridge(payment), /Expected one CCTP burn message/);
  assert.equal(payment.mintAttempt, 2);
  assert.equal(payment.bridgeAttempt, undefined);
  assert.equal(payment.transactions[0].hash, burnHash);
  assert.equal(requests.filter(r => r.method === 'eth_getTransactionReceipt' && r.params[0] === mintHash).length, 1);
  assert.equal(requests.some(r => r.method === 'eth_sendRawTransaction'), false);
});
