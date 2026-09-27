import { decodeEventLog, erc20Abi, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';

export function normalizePayment(input, sender) {
  if (!input || typeof input !== 'object') throw new Error('Payment details are required.');
  const reference = typeof input.reference === 'string' ? input.reference.trim() : '';
  if (!reference || reference.length > 60 || /[\x00-\x1f]/.test(reference)) throw new Error('Use an invoice reference of 1–60 characters.');
  if (!['arc', 'base'].includes(input.source)) throw new Error('Choose Arc testnet or Base Sepolia.');
  if (typeof input.amount !== 'string' || !/^\d{1,3}(\.\d{1,6})?$/.test(input.amount)) throw new Error('Use up to six decimal places.');
  const amount = parseUnits(input.amount, 6);
  if (amount <= 0n || amount > 100_000_000n) throw new Error('Test payments must be greater than zero and at most 100 USDC.');
  if (typeof input.recipient !== 'string' || !isAddress(input.recipient)) throw new Error('Enter a valid recipient address.');
  const recipient = getAddress(input.recipient);
  if ([sender.toLowerCase(), zeroAddress].includes(recipient.toLowerCase())) throw new Error('Choose a recipient other than the sender or zero address.');
  return { reference, recipient, amount: amount.toString(), source: input.source };
}

const allowed = {
  bridge: ['created'], quote: ['funded', 'quoted'], swap: ['quoted'], pay: ['converted'],
  recover: ['bridging', 'swapping', 'paying'], retry: ['bridging'], reconcile: ['paid'],
};
export function bridgeSteps(payment) {
  const attempt = payment.bridgeAttempt ?? 1, mintAttempt = payment.mintAttempt ?? 1;
  return { approval: attempt === 1 ? 'bridge_approve' : `bridge_approve:${attempt}`, burn: attempt === 1 ? 'burn' : `burn:${attempt}`, mint: mintAttempt === 1 ? 'mint' : `mint:${mintAttempt}` };
}
export function currentBridgeTransaction(payment) {
  const steps = bridgeSteps(payment);
  return [steps.mint, steps.burn, steps.approval].map(step => (payment.transactions ?? []).find(t => t.step === step)).find(Boolean);
}
export function assertAction(payment, action, now = Date.now()) {
  if (!allowed[action]?.includes(payment.status)) throw new Error(`Cannot ${action} a payment in ${payment.status} state.`);
  if (action === 'swap' && (!payment.quote || now >= payment.quote.expiresAt)) throw new Error('Quote expired. Request a fresh quote.');
  if (action === 'retry' && currentBridgeTransaction(payment)?.status !== 'reverted') throw new Error('Only a confirmed reverted bridge stage can be retried. Recover pending transactions first.');
}

export function transfers(logs, token) {
  return logs.flatMap(log => {
    if (log.address.toLowerCase() !== token.toLowerCase()) return [];
    try {
      const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
      return decoded.eventName === 'Transfer' ? [decoded.args] : [];
    } catch { return []; }
  });
}
export function receivedAmount(logs, token, recipient) {
  return transfers(logs, token).reduce((sum, transfer) => sum
    + (transfer.to.toLowerCase() === recipient.toLowerCase() ? transfer.value : 0n)
    - (transfer.from.toLowerCase() === recipient.toLowerCase() ? transfer.value : 0n), 0n);
}
export function verifyPaymentReceipt(payment, receipt, token, hash) {
  if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== hash.toLowerCase()) throw new Error('Payment receipt is not a successful expected transaction.');
  const matches = transfers(receipt.logs, token).filter(t => t.from.toLowerCase() === payment.sender.toLowerCase() && t.to.toLowerCase() === payment.recipient.toLowerCase());
  if (matches.length !== 1 || matches[0].value !== BigInt(payment.outputAmount)) throw new Error('Receipt does not prove the exact EURC payment to this recipient.');
  return true;
}
export function publicPayment(p) {
  const fields = ['id','reference','recipient','sender','amount','source','status','createdAt','updatedAt','quote','outputAmount','fundedAmount','error','events','attempt','reconciledAt'];
  return { ...Object.fromEntries(fields.filter(k => p[k] !== undefined).map(k => [k, p[k]])),
    canRetryBridge: p.status === 'bridging' && currentBridgeTransaction(p)?.status === 'reverted',
    transactions: (p.transactions ?? []).map(({ hash, step, chain, status, blockNumber, createdAt }) => ({ hash, step, chain, status, blockNumber, createdAt })),
  };
}
