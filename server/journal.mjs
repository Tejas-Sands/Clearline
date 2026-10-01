import { parseTransaction } from 'viem';

const intent = request => `${request.to?.toLowerCase()}:${(request.data ?? '0x').toLowerCase()}:${BigInt(request.value ?? 0)}`;

export async function sendJournaled(payment, step, chain, request, io, save) {
  let entry = payment.transactions.find(tx => tx.step === step);
  if (entry && entry.chain !== chain) throw new Error('Transaction network mismatch.');
  if (entry && request.to && intent(request) !== (entry.intent ?? intent(parseTransaction(entry.raw)))) {
    throw new Error('Journal step belongs to a different transaction. Recover the original operation.');
  }
  if (entry?.status === 'success') return entry.hash;
  if (entry?.status === 'reverted') throw new Error('This transaction reverted; use a fresh approved attempt.');
  if (!entry) {
    const signed = await io.sign(request);
    entry = { step, chain, ...signed, intent: intent(request), status: 'signed', createdAt: Date.now() };
    payment.transactions.push(entry);
  }
  // Keep the original signed bytes even if a checkpoint fails: an asynchronous
  // database error can have an ambiguous commit outcome. Recovery must never
  // replace this signature, and must re-checkpoint it before any broadcast.
  await save();
  // The exact signed bytes are durable BEFORE any network broadcast.
  // Replaying these bytes has the same nonce/hash and cannot create a second payment.
  await io.broadcast(entry.raw);
  entry.status = 'submitted'; await save();
  return entry.hash;
}
