import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePayment, assertAction, receivedAmount, verifyPaymentReceipt, publicPayment } from '../server/model.mjs';
import { encodeEventTopics, encodeAbiParameters, erc20Abi } from 'viem';

const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const token = '0x3333333333333333333333333333333333333333';
const tx = `0x${'ab'.repeat(32)}`;
function log(from = sender, to = recipient, value = 822102n, address = token) {
  return { address, topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from, to } }), data: encodeAbiParameters([{ type: 'uint256' }], [value]) };
}
const input = { reference: ' INV-1 ', recipient, amount: '1.000001', source: 'arc' };
test('testnet payment rejects mainnet, self-payment and non-exact or oversized amounts', () => {
  assert.equal(normalizePayment(input, sender).amount, '1000001');
  assert.equal(normalizePayment(input, sender).reference, 'INV-1');
  for (const amount of ['0', '-1', '1e2', '1.0000001', '100.000001']) assert.throws(() => normalizePayment({ ...input, amount }, sender));
  for (const address of [sender, '0x0000000000000000000000000000000000000000', 'bad']) assert.throws(() => normalizePayment({ ...input, recipient: address }, sender));
  assert.throws(() => normalizePayment({ ...input, source: 'mainnet' }, sender));
});
test('stage guards prohibit duplicate swap/pay, stale approvals and premature reconciliation', () => {
  assert.doesNotThrow(() => assertAction({ status: 'quoted', quote: { expiresAt: 101 } }, 'swap', 100));
  assert.throws(() => assertAction({ status: 'quoted', quote: { expiresAt: 100 } }, 'swap', 100));
  for (const status of ['swapping', 'converted', 'paying', 'paid', 'reconciled']) assert.throws(() => assertAction({ status }, 'swap', 100));
  assert.throws(() => assertAction({ status: 'paying' }, 'pay'));
  assert.throws(() => assertAction({ status: 'converted' }, 'reconcile'));
  assert.doesNotThrow(() => assertAction({ status: 'converted' }, 'pay'));
});
test('receipt verification requires successful exact-token transfer to the actual recipient', () => {
  const p = { recipient, sender, outputAmount: '822102' };
  const receipt = { status: 'success', transactionHash: tx, logs: [log()] };
  assert.equal(verifyPaymentReceipt(p, receipt, token, tx), true);
  for (const changed of [ { ...receipt, status: 'reverted' }, { ...receipt, transactionHash: `0x${'cc'.repeat(32)}` }, { ...receipt, logs: [log(sender, sender)] }, { ...receipt, logs: [log(sender, recipient, 822101n)] }, { ...receipt, logs: [log(sender, recipient, 822102n, sender)] } ]) assert.throws(() => verifyPaymentReceipt(p, changed, token, tx));
});
test('swap output uses net receipt token transfers, not unrelated wallet balance changes', () => {
  assert.equal(receivedAmount([log(sender, recipient, 900000n), log(recipient, sender, 100000n)], token, recipient), 800000n);
  assert.equal(receivedAmount([log(sender, recipient, 900000n, sender)], token, recipient), 0n);
});
test('public records never expose signed transaction bytes or private SDK results', () => {
  const output = publicPayment({ id: 'p', transactions: [{ hash: tx, raw: 'SECRET', step: 'pay', chain: 'arc' }], sdkResult: { secret: 'SECRET' }, privateKey: 'SECRET' });
  assert.equal(JSON.stringify(output).includes('SECRET'), false);
  assert.equal(output.transactions[0].hash, tx);
});

test('bridge retry is allowed only for the current receipt-proven reverted stage', () => {
  const p = { status: 'bridging', transactions: [{ step: 'burn', status: 'success' }, { step: 'mint', status: 'reverted' }] };
  assert.doesNotThrow(() => assertAction(p, 'retry'));
  assert.equal(publicPayment(p).canRetryBridge, true);
  p.mintAttempt = 2;
  p.transactions.push({ step: 'mint:2', status: 'submitted' });
  assert.throws(() => assertAction(p, 'retry'), /reverted/);
  assert.equal(publicPayment(p).canRetryBridge, false);
  assert.throws(() => assertAction({ status: 'funded', transactions: [] }, 'retry'));
});
