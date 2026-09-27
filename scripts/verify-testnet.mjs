// Read-only proof: query the local public snapshot and independently verify RPC receipts.
// No wallet files, signatures, private keys, POST requests, or broadcasts.
import assert from 'node:assert/strict';
import { createPublicClient, erc20Abi, http, formatUnits } from 'viem';
import { networks, EURC, USDC, BASE_USDC } from '../server/chain.mjs';
import { receivedAmount, verifyPaymentReceipt } from '../server/model.mjs';

const response = await fetch('http://127.0.0.1:8787/api/testnet');
assert.equal(response.ok, true, 'Start the local API with npm run dev first.');
const snapshot = await response.json();
assert.equal(snapshot.environment, 'testnet');
assert.equal(snapshot.busy, null, 'Wait for the active operation to finish.');
const clients = Object.fromEntries(Object.entries(networks).map(([name, chain]) => [name, createPublicClient({ chain, transport: http() })]));
for (const [name, client] of Object.entries(clients)) assert.equal(await client.getChainId(), networks[name].id);
const payments = [];
for (const p of snapshot.payments.filter(p => ['paid', 'reconciled'].includes(p.status))) {
  const receipts = new Map(), transactions = [];
  for (const tx of p.transactions) {
    assert.ok(clients[tx.chain], 'Unknown transaction network.');
    const r = await clients[tx.chain].getTransactionReceipt({ hash: tx.hash });
    assert.equal(r.transactionHash.toLowerCase(), tx.hash.toLowerCase());
    assert.equal(r.status, tx.status, 'Journal does not match chain receipt.');
    receipts.set(tx.step, r);
    transactions.push({ step: tx.step, chain: tx.chain, hash: tx.hash, status: r.status, blockNumber: r.blockNumber.toString(), gasNativeUnits: (r.gasUsed * r.effectiveGasPrice).toString() });
  }
  const swap = receipts.get(`swap:${p.attempt}`);
  assert.equal(swap?.status, 'success');
  assert.equal(receivedAmount(swap.logs, EURC, p.sender), BigInt(p.outputAmount));
  assert.ok(BigInt(p.outputAmount) >= BigInt(p.quote.minimum));
  const payout = p.transactions.filter(t => t.step.startsWith('pay:') && t.status === 'success');
  assert.equal(payout.length, 1, 'Expected exactly one successful recipient payment.');
  verifyPaymentReceipt(p, receipts.get(payout[0].step), EURC, payout[0].hash);
  if (p.source === 'base') {
    const mintSteps = p.transactions.filter(t => /^mint(?::\d+)?$/.test(t.step) && t.status === 'success');
    const burns = p.transactions.filter(t => /^burn(?::\d+)?$/.test(t.step) && t.status === 'success');
    assert.equal(burns.length, 1); assert.equal(mintSteps.length, 1);
    assert.equal(receivedAmount(receipts.get(mintSteps[0].step).logs, USDC, p.sender), BigInt(p.fundedAmount));
    assert.equal(receivedAmount(receipts.get(burns[0].step).logs, BASE_USDC, p.sender), -BigInt(p.amount));
  }
  payments.push({ reference: p.reference, status: p.status, source: p.source, sender: p.sender, recipient: p.recipient, sourceUSDC: formatUnits(BigInt(p.amount), 6), fundedUSDC: p.fundedAmount ? formatUnits(BigInt(p.fundedAmount), 6) : undefined, minimumEURC: formatUnits(BigInt(p.quote.minimum), 6), paidEURC: formatUnits(BigInt(p.outputAmount), 6), transactions });
}
assert.ok(payments.length, 'No completed payments to verify.');
const balances = {
  arcUSDC: formatUnits(await clients.arc.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [snapshot.sender] }), 6),
  arcEURC: formatUnits(await clients.arc.readContract({ address: EURC, abi: erc20Abi, functionName: 'balanceOf', args: [snapshot.sender] }), 6),
  baseUSDC: formatUnits(await clients.base.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: 'balanceOf', args: [snapshot.sender] }), 6),
  baseETH: formatUnits(await clients.base.getBalance({ address: snapshot.sender }), 18),
};
console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), environment: 'testnet', payments, balances }, null, 2));
