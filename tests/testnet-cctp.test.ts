import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { encodeEventTopics, encodeAbiParameters, encodeFunctionData, erc20Abi, parseAbi } from 'viem';
import { makeChain, USDC } from '../server/chain.mjs';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/cctp-base-burn.json', import.meta.url), 'utf8'));
const transmitter = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';
const abi = parseAbi(['event MessageSent(bytes message)', 'function receiveMessage(bytes message,bytes attestation) returns (bool)']);
const nonce = `0x${'12'.repeat(32)}`;
const mintHash = `0x${'cd'.repeat(32)}`;
const replace = (message, offset, bytes, value) => message.slice(0, 2 + offset * 2) + BigInt(value).toString(16).padStart(bytes * 2, '0') + message.slice(2 + (offset + bytes) * 2);

function setup(t) {
  const privateKey = generatePrivateKey(), account = privateKeyToAccount(privateKey);
  const store = { privateKey, account, save() {} };
  const original = fixture.message.replaceAll('4a10873399f19f43fc7fa02c8ddc83fbfbfaeb34', account.address.slice(2).toLowerCase());
  // Circle fills these V2 fields offchain (technical-guide message format).
  let attested = replace(original, 12, 32, nonce);
  attested = replace(attested, 144, 4, 2000);
  attested = replace(attested, 312, 32, 100);
  attested = replace(attested, 344, 32, 65000000);
  const attestation = `0x${'ab'.repeat(65)}`;
  const data = encodeFunctionData({ abi, functionName: 'receiveMessage', args: [attested, attestation] });
  const payment = { sender: account.address, amount: '1000000', transactions: [
    { step: 'burn', chain: 'base', hash: fixture.sourceTxHash, status: 'success' },
    { step: 'mint', chain: 'arc', hash: mintHash, status: 'success', intent: `${transmitter.toLowerCase()}:${data}:0` },
  ] };
  const response = { status: 200, body: { sourceTxHash: fixture.sourceTxHash, messages: [{ cctpVersion: 2, status: 'complete', eventNonce: nonce, message: attested, attestation }] } };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (String(url).startsWith('https://iris-api-sandbox.circle.com')) return Response.json(response.body, { status: response.status });
    const req = JSON.parse(options.body);
    let result;
    if (req.method === 'eth_chainId') result = String(url).includes('base') ? '0x14a34' : '0x4cef52';
    else if (req.method === 'eth_getTransactionReceipt') {
      const burn = req.params[0] === fixture.sourceTxHash;
      const log = burn
        ? { address: transmitter, topics: encodeEventTopics({ abi, eventName: 'MessageSent' }), data: encodeAbiParameters([{ type: 'bytes' }], [original]) }
        : { address: USDC, topics: encodeEventTopics({ abi: erc20Abi, eventName: 'Transfer', args: { from: '0x0000000000000000000000000000000000000000', to: account.address } }), data: encodeAbiParameters([{ type: 'uint256' }], [999900n]) };
      result = { transactionHash: req.params[0], status: '0x1', blockNumber: '0x1', blockHash: mintHash, transactionIndex: '0x0', gasUsed: '0x1', cumulativeGasUsed: '0x1', effectiveGasPrice: '0x1', logs: [{ ...log, blockNumber: '0x1', blockHash: mintHash, transactionHash: req.params[0], transactionIndex: '0x0', logIndex: '0x0', removed: false }] };
    } else throw Error(`Unexpected signing or broadcast RPC: ${req.method}`);
    return Response.json({ jsonrpc: '2.0', id: req.id, result });
  });
  return { chain: makeChain(store), payment, response, attested };
}

test('CCTP recovery accepts attester-populated V2 fields and verifies the original mint receipt', async t => {
  const { chain, payment } = setup(t);
  assert.equal(await chain.recoverBridge(payment), true);
  assert.equal(payment.fundedAmount, '999900');
  assert.equal(payment.transactions.length, 2);
  assert.equal(payment.transactions[0].hash, fixture.sourceTxHash);
});

test('CCTP recovery rejects attested changes to immutable burn fields', async t => {
  const { chain, payment, response, attested } = setup(t);
  for (const [offset, bytes, value] of [[8, 4, 27], [108, 32, 1], [184, 32, 1], [216, 32, 999999], [280, 32, 20000]]) {
    response.body.messages[0].message = replace(attested, offset, bytes, value);
    await assert.rejects(chain.recoverBridge(payment), /match.*burn/i);
    assert.equal(payment.fundedAmount, undefined);
  }
});

test('CCTP recovery rejects another burn with identical amount and recipient', async t => {
  const { chain, payment, response } = setup(t);
  response.body.sourceTxHash = `0x${'ef'.repeat(32)}`;
  await assert.rejects(chain.recoverBridge(payment), /match.*burn/i);
  assert.equal(payment.fundedAmount, undefined);
});

test('CCTP recovery rejects invalid finality, nonce or fees before minting', async t => {
  const { chain, payment, response, attested } = setup(t);
  for (const [offset, bytes, value] of [[144, 4, 1000], [12, 32, 0], [312, 32, 10001]]) {
    response.body.messages[0].message = replace(attested, offset, bytes, value);
    await assert.rejects(chain.recoverBridge(payment), /match.*burn/i);
    assert.equal(payment.fundedAmount, undefined);
  }
});

test('CCTP indexing 404 and pending confirmations leave the original burn recoverable', async t => {
  const { chain, payment, response } = setup(t);
  response.status = 404; response.body = { error: 'not found' };
  assert.equal(await chain.recoverBridge(payment), false);
  response.status = 200; response.body = { messages: [{ status: 'pending_confirmations', message: null, attestation: 'PENDING' }] };
  assert.equal(await chain.recoverBridge(payment), false);
  assert.equal(payment.fundedAmount, undefined);
  assert.equal(payment.transactions.length, 2);
});
