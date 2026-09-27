import { createPublicClient, createWalletClient, defineChain, http, erc20Abi, encodeFunctionData, parseAbi, parseUnits, formatUnits, keccak256, pad, decodeEventLog } from 'viem';
import { createViemAdapterFromPrivateKey } from '@circle-fin/adapter-viem-v2';
import { SwapKit } from '@circle-fin/swap-kit';
import { sendJournaled } from './journal.mjs';
import { receivedAmount, verifyPaymentReceipt, bridgeSteps, currentBridgeTransaction } from './model.mjs';

export const USDC = '0x3600000000000000000000000000000000000000';
export const EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
export const BASE_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export function isSwapApproval({ to, data }) {
  return to?.toLowerCase() === USDC.toLowerCase() && ['0x095ea7b3', '0x39509351'].includes(data?.slice(0, 10).toLowerCase());
}
const MESSENGER = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const TRANSMITTER = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';
const IRIS = 'https://iris-api-sandbox.circle.com';
const cctpAbi = parseAbi([
  'function depositForBurn(uint256 amount,uint32 destinationDomain,bytes32 mintRecipient,address burnToken,bytes32 destinationCaller,uint256 maxFee,uint32 minFinalityThreshold)',
  'function receiveMessage(bytes message,bytes attestation) returns (bool)',
  'event MessageSent(bytes message)',
]);
function matchesCctpBurn(original, attested, eventNonce) {
  const valid = value => typeof value === 'string' && /^0x(?:[0-9a-f]{2}){376,}$/i.test(value);
  if (!valid(original) || !valid(attested) || original.length !== attested.length) return false;
  const field = (message, start, end) => message.slice(2 + start * 2, 2 + end * 2).toLowerCase();
  const uint = (message, start, end) => BigInt(`0x${field(message, start, end)}`);
  // V2 fills nonce [12,44), finality [144,148), fee [312,344), and
  // expiration [344,376) offchain. All other bytes, including hooks, must match.
  // https://developers.circle.com/cctp/references/technical-guide
  if (![[0, 12], [44, 144], [148, 312], [376, (original.length - 2) / 2]]
    .every(([start, end]) => field(original, start, end) === field(attested, start, end))) return false;
  return uint(original, 0, 4) === 1n && uint(original, 148, 152) === 1n
    && uint(attested, 12, 44) !== 0n && `0x${field(attested, 12, 44)}` === eventNonce?.toLowerCase()
    && uint(attested, 144, 148) >= uint(original, 140, 144)
    && uint(attested, 312, 344) <= uint(original, 280, 312)
    && uint(attested, 312, 344) < uint(original, 216, 248);
}
export const networks = {
  arc: defineChain({ id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } }, testnet: true }),
  base: defineChain({ id: 84532, name: 'Base Sepolia', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://sepolia.base.org'] } }, testnet: true }),
};

export function makeChain(store) {
  const kit = new SwapKit({ disableErrorReporting: true, disableAnalytics: true });
  const clients = Object.fromEntries(Object.entries(networks).map(([key, chain]) => [key, createPublicClient({ chain, transport: http(undefined, { timeout: 15000, retryCount: 1 }) })]));
  const wallets = Object.fromEntries(Object.entries(networks).map(([key, chain]) => [key, createWalletClient({ account: store.account, chain, transport: http(undefined, { timeout: 15000, retryCount: 0 }) })]));
  async function checkNetwork(key) {
    if (!networks[key] || await clients[key].getChainId() !== networks[key].id) throw new Error('RPC returned an unexpected chain. Signing is disabled.');
  }
  async function send(p, step, key, request) {
    await checkNetwork(key);
    return sendJournaled(p, step, key, request, {
      sign: async ({ to, data, value = 0n, gas }) => {
        const prepared = await wallets[key].prepareTransactionRequest({ account: store.account, chain: networks[key], to, data, value, ...(gas ? { gas } : {}) });
        const raw = await wallets[key].signTransaction(prepared);
        return { raw, hash: keccak256(raw) };
      },
      broadcast: async raw => {
        try { await clients[key].sendRawTransaction({ serializedTransaction: raw }); }
        catch (error) {
          // A prior broadcast may have succeeded before its response was lost.
          try { await clients[key].getTransaction({ hash: keccak256(raw) }); }
          catch { throw error; }
        }
      },
    }, store.save);
  }
  async function receipt(p, entry) {
    await checkNetwork(entry.chain);
    const r = await clients[entry.chain].waitForTransactionReceipt({ hash: entry.hash, timeout: 45000, pollingInterval: 1500 });
    entry.status = r.status; entry.blockNumber = r.blockNumber.toString(); store.save();
    if (r.status !== 'success') throw new Error(`Transaction reverted: ${entry.hash}`);
    return r;
  }
  async function sendAndWait(p, step, key, request) {
    await send(p, step, key, request);
    return receipt(p, p.transactions.find(t => t.step === step));
  }
  function adapter(p) {
    return createViemAdapterFromPrivateKey({
      privateKey: store.privateKey,
      getPublicClient: ({ chain }) => {
        if (chain.id !== 5042002) throw new Error('Only Arc Testnet swaps are allowed.');
        return clients.arc;
      },
      getWalletClient: ({ chain }) => {
        if (chain.id !== 5042002) throw new Error('Only Arc Testnet swaps are allowed.');
        return {
          ...wallets.arc,
          signTypedData: async () => { throw new Error('Relayed permits are disabled. Use onchain approval.'); },
          sendTransaction: async request => {
            if (!p) throw new Error('A quote cannot submit a transaction.');
            const isApproval = isSwapApproval(request);
            return send(p, `${isApproval ? 'swap_approve' : 'swap'}:${p.attempt}`, 'arc', request);
          },
        };
      },
    });
  }
  function params(p, canSubmit = false) {
    return { from: { adapter: adapter(canSubmit ? p : undefined), chain: 'Arc_Testnet' }, tokenIn: 'USDC', tokenOut: 'EURC', amountIn: formatUnits(BigInt(p.fundedAmount ?? p.amount), 6), config: { allowanceStrategy: 'approve', slippageBps: 100 } };
  }
  async function finishSwap(p) {
    const tx = p.transactions.find(t => t.step === `swap:${p.attempt}`);
    if (!tx) {
      const approval = p.transactions.find(t => t.step === `swap_approve:${p.attempt}`);
      if (approval) { await send(p, approval.step, 'arc', {}); await receipt(p, approval); }
      return null;
    }
    const approval = p.transactions.find(t => t.step === `swap_approve:${p.attempt}`);
    if (approval) await receipt(p, approval);
    await send(p, tx.step, 'arc', {});
    const r = await receipt(p, tx);
    const original = await clients.arc.getTransaction({ hash: tx.hash });
    if (original.from.toLowerCase() === store.account.address.toLowerCase() && original.value === 0n
      && isSwapApproval({ to: original.to, data: original.input })) {
      // Older journals classified increaseAllowance as a swap. Preserve the hash
      // and receipt, correct the label only after proving what executed onchain.
      if (p.transactions.some(t => t.step === `swap_approve:${p.attempt}`)) throw new Error('Conflicting approval journal; manual review required.');
      tx.legacyStep = tx.step; tx.step = `swap_approve:${p.attempt}`; store.save();
      return null;
    }
    const amount = receivedAmount(r.logs, EURC, store.account.address);
    if (amount <= 0n || amount < BigInt(p.quote.minimum)) throw new Error('Swap receipt does not prove the approved minimum EURC output.');
    p.outputAmount = amount.toString();
    return amount;
  }
  async function finishPay(p) {
    const tx = p.transactions.find(t => t.step === `pay:${p.payAttempt ?? 1}`);
    if (!tx) throw new Error('No payment transaction was signed.');
    await send(p, tx.step, 'arc', {});
    const r = await receipt(p, tx);
    verifyPaymentReceipt(p, r, EURC, tx.hash);
  }
  async function bridge(p) {
    // A repeated invocation replays only the original signed transaction bytes.
    await checkNetwork('base'); await checkNetwork('arc');
    const amount = BigInt(p.amount);
    const steps = bridgeSteps(p);
    if (amount <= 10000n) throw new Error('Bridge at least 0.010001 USDC to cover the maximum 0.01 USDC CCTP fee.');
    if (!p.transactions.some(t => t.step === steps.burn)) {
      const allowance = await clients.base.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: 'allowance', args: [store.account.address, MESSENGER] });
      if (allowance < amount) await sendAndWait(p, steps.approval, 'base', { to: BASE_USDC, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [MESSENGER, amount] }) });
    }
    await sendAndWait(p, steps.burn, 'base', { to: MESSENGER, data: encodeFunctionData({ abi: cctpAbi, functionName: 'depositForBurn', args: [amount, 26, pad(store.account.address), BASE_USDC, pad(store.account.address), 10000n, 2000] }) });
    return recoverBridge(p);
  }
  async function recoverBridge(p) {
    const steps = bridgeSteps(p);
    const burn = p.transactions.find(t => t.step === steps.burn);
    if (!burn) return bridge(p);
    await send(p, steps.burn, 'base', {});
    const burned = await receipt(p, burn);
    const event = burned.logs.flatMap(log => {
      if (log.address.toLowerCase() !== TRANSMITTER.toLowerCase()) return [];
      try { const e = decodeEventLog({ abi: cctpAbi, data: log.data, topics: log.topics }); return e.eventName === 'MessageSent' ? [e.args.message] : []; } catch { return []; }
    });
    if (event.length !== 1) throw new Error('Expected one CCTP burn message.');
    const response = await fetch(`${IRIS}/v2/messages/6?transactionHash=${burn.hash}`, { signal: AbortSignal.timeout(15000) });
    if (response.status === 404) return false; // Burn is not indexed yet.
    if (!response.ok) throw new Error(`CCTP attestation service returned ${response.status}. Check bridge status later.`);
    const body = await response.json();
    const complete = body.messages?.filter(m => m.status === 'complete') ?? [];
    if (!complete.length) return false;
    if (body.sourceTxHash?.toLowerCase() !== burn.hash.toLowerCase()) throw new Error('Attestation response does not match the recorded CCTP burn transaction.');
    const matches = complete.filter(m => m.cctpVersion === 2 && matchesCctpBurn(event[0], m.message, m.eventNonce)
      && /^0x(?:[0-9a-f]{2})+$/i.test(m.attestation));
    if (matches.length !== 1) throw new Error('Attestation does not uniquely match the recorded CCTP burn.');
    const message = matches[0];
    const minted = await sendAndWait(p, steps.mint, 'arc', { to: TRANSMITTER, data: encodeFunctionData({ abi: cctpAbi, functionName: 'receiveMessage', args: [message.message, message.attestation] }) });
    const funded = receivedAmount(minted.logs, USDC, store.account.address);
    if (funded <= 0n || funded > BigInt(p.amount)) throw new Error('Mint receipt does not prove the expected USDC funding.');
    p.fundedAmount = funded.toString();
    return true;
  }
  async function retryBridge(p) {
    const failed = currentBridgeTransaction(p);
    if (!failed || failed.status !== 'reverted') throw new Error('No confirmed reverted bridge transaction to retry.');
    await checkNetwork(failed.chain);
    const r = await clients[failed.chain].getTransactionReceipt({ hash: failed.hash });
    if (r.status !== 'reverted') throw new Error('Receipt does not prove reversion; recover the original transaction.');
    const retryMint = failed.step === bridgeSteps(p).mint;
    if (retryMint) p.mintAttempt = (p.mintAttempt ?? 1) + 1;
    else p.bridgeAttempt = (p.bridgeAttempt ?? 1) + 1;
    store.save();
    // A reverted destination mint never authorizes another source burn.
    return retryMint ? recoverBridge(p) : bridge(p);
  }
  return {
    async balances() {
      const results = await Promise.allSettled([
        (async () => { await checkNetwork('arc'); return clients.arc.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [store.account.address] }); })(),
        clients.arc.readContract({ address: EURC, abi: erc20Abi, functionName: 'balanceOf', args: [store.account.address] }),
        (async () => { await checkNetwork('base'); return clients.base.readContract({ address: BASE_USDC, abi: erc20Abi, functionName: 'balanceOf', args: [store.account.address] }); })(),
        clients.base.getBalance({ address: store.account.address }),
      ]);
      const names = ['arcUSDC', 'arcEURC', 'baseUSDC', 'baseETH'];
      return Object.fromEntries(results.map((r, i) => [names[i], r.status === 'fulfilled' ? r.value.toString() : null]));
    },
    async quote(p) {
      await checkNetwork('arc');
      const result = await kit.estimate(params(p));
      if (result.estimatedOutput.token !== 'EURC' || result.stopLimit.token !== 'EURC') throw new Error('Unexpected quote currency.');
      const expected = parseUnits(result.estimatedOutput.amount, 6);
      const minimum = parseUnits(result.stopLimit.amount, 6);
      if (expected <= 0n || minimum <= 0n || minimum > expected) throw new Error('Invalid swap estimate.');
      return { expected: expected.toString(), minimum: minimum.toString(), expiresAt: Date.now() + 60000, fees: result.fees ?? [] };
    },
    async swap(p) {
      await checkNetwork('arc');
      const options = params(p, true);
      options.config.stopLimit = formatUnits(BigInt(p.quote.minimum), 6);
      await kit.swap(options);
      return finishSwap(p);
    },
    recoverSwap: finishSwap,
    async pay(p) {
      if (!await finishSwap(p)) throw new Error('A verified swap is required before recipient payment.');
      await send(p, `pay:${p.payAttempt ?? 1}`, 'arc', { to: EURC, data: encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [p.recipient, BigInt(p.outputAmount)] }) });
      return finishPay(p);
    },
    recoverPay: finishPay, bridge, recoverBridge, retryBridge,
  };
}
