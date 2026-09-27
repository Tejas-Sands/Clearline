import { randomUUID } from 'node:crypto';
import { normalizePayment, assertAction, publicPayment } from './model.mjs';

export const cleanError = error => (error?.shortMessage ?? error?.message ?? 'Operation failed.').replace(/0x[0-9a-f]{128,}/gi, '[transaction data]').slice(0, 500);
export function makeService(store, chain) {
  let busy = null;
  const event = (p, message) => { p.updatedAt = Date.now(); p.events.unshift({ at: p.updatedAt, message }); store.save(); };
  function verifyConversion(p, output) {
    const tx = p.transactions.find(t => t.step === `swap:${p.attempt}`);
    if (!output || !p.outputAmount || tx?.chain !== 'arc' || tx.status !== 'success'
      || BigInt(output) <= 0n || BigInt(p.outputAmount) !== BigInt(output)
      || BigInt(output) < BigInt(p.quote.minimum)) throw new Error('No verified swap with the approved EURC output. Recover the original transaction.');
  }
  const service = {
    get busy() { return busy; },
    list: () => store.state.payments.map(publicPayment),
    create(input) {
      if (busy) throw new Error('An operation is in progress.');
      const normalized = normalizePayment(input, store.account.address);
      if (store.state.payments.some(p => p.reference.toLowerCase() === normalized.reference.toLowerCase())) throw new Error('Invoice reference already exists.');
      if (store.state.payments.length >= 500) throw new Error('This local prototype supports 500 test payments.');
      const p = { ...normalized, id: randomUUID(), sender: store.account.address, status: normalized.source === 'arc' ? 'funded' : 'created', createdAt: Date.now(), updatedAt: Date.now(), transactions: [], events: [], attempt: 0 };
      store.state.payments.unshift(p); event(p, 'Testnet payment created. No tokens moved.');
      return p;
    },
    async act(id, action) {
      if (busy) throw new Error('An operation is in progress.');
      const p = store.state.payments.find(p => p.id === id);
      if (!p) throw new Error('Payment not found.');
      assertAction(p, action);
      const unresolved = store.state.payments.find(other => other.id !== id && other.transactions.some(tx => ['signed', 'submitted'].includes(tx.status)));
      if (unresolved && action !== 'reconcile') throw new Error(`Recover ${unresolved.reference} first; it has an unresolved signed transaction.`);
      busy = { id, action }; p.error = undefined;
      try {
        if (action === 'quote') {
          p.quote = await chain.quote(p); p.status = 'quoted'; event(p, 'Live testnet estimate received. Approval expires in 60 seconds.');
        } else if (action === 'bridge') {
          p.status = 'bridging'; event(p, 'CCTP funding started.');
          if (await chain.bridge(p)) { p.status = 'funded'; event(p, 'USDC mint on Arc verified.'); }
          else event(p, 'Burn confirmed. Waiting for Circle attestation; check bridge status to continue.');
        } else if (action === 'retry') {
          event(p, 'Approved retry of the confirmed reverted bridge stage. Successful source burns are preserved.');
          if (await chain.retryBridge(p)) { p.status = 'funded'; event(p, 'Bridge retry completed; USDC mint on Arc verified.'); }
          else event(p, 'Source burn confirmed. Waiting for Circle attestation.');
        } else if (action === 'swap') {
          p.status = 'swapping'; p.attempt++; event(p, 'Approved minimum recorded; submitting conversion.');
          verifyConversion(p, await chain.swap(p)); p.status = 'converted'; event(p, 'EURC conversion verified from transaction logs. Recipient is not paid yet.');
        } else if (action === 'pay') {
          p.status = 'paying'; p.payAttempt ??= 1; event(p, 'Submitting exact EURC recipient payment.');
          await chain.pay(p); p.status = 'paid'; event(p, 'Exact EURC transfer to the recipient verified on Arc.');
        } else if (action === 'recover') {
          if (p.status === 'bridging') {
            if (await chain.recoverBridge(p)) { p.status = 'funded'; event(p, 'Original bridge completed; no second burn.'); }
            else event(p, 'Attestation is still pending. Source burn remains recorded.');
          } else if (p.status === 'swapping') {
            const output = await chain.recoverSwap(p);
            if (output) { verifyConversion(p, output); p.status = 'converted'; event(p, 'Original swap receipt verified.'); }
            else { p.status = 'funded'; delete p.quote; event(p, 'Approval resolved; no swap executed. Request a fresh quote.'); }
          } else {
            await chain.recoverPay(p); p.status = 'paid'; event(p, 'Original recipient transfer verified; no second payment.');
          }
        } else {
          p.status = 'reconciled'; p.reconciledAt = Date.now(); event(p, 'Verified recipient payment matched to this invoice. No funds moved.');
        }
      } catch (error) {
        // Only a proved absence of a signed value-moving transaction allows a new attempt.
        if (p.status === 'swapping') {
          const tx = p.transactions.find(t => t.step === `swap:${p.attempt}`);
          const unresolvedApproval = p.transactions.some(t => t.step === `swap_approve:${p.attempt}` && ['signed', 'submitted'].includes(t.status));
          if ((!tx && !unresolvedApproval) || tx?.status === 'reverted') { p.status = 'funded'; delete p.quote; }
        }
        if (p.status === 'paying') {
          const tx = p.transactions.find(t => t.step === `pay:${p.payAttempt}`);
          if (!tx || tx.status === 'reverted') { p.status = 'converted'; if (tx) p.payAttempt++; }
        }
        if (p.status === 'bridging' && !p.transactions.length) p.status = 'created';
        p.error = cleanError(error); event(p, p.error);
      } finally { busy = null; store.save(); }
      return publicPayment(p);
    },
  };
  return service;
}
