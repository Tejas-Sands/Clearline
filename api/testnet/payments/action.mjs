// POST /api/testnet/payments/[id]/[action]
// Checkpoint-based action executor backed by Turso.
//
// KEY DESIGN: Instead of a long-running process, each call does ONE step and
// returns. The UI's 2.5s polling loop drives the state machine forward.
// CCTP 24-min wait: each poll calls this with action=recover, which checks
// Circle's attestation API and advances when ready — no function timeout issue.
import { ensureSchema, loadPayment, savePayment } from '../../../server/db.mjs';
import { assertAction, publicPayment } from '../../../server/model.mjs';
import { authorizeVercelRequest, getSessionId } from '../../../_auth.mjs';
import { makeDbStore, cleanError } from '../_shared.mjs';

// Helper: check if another payment for this sender has an unresolved transaction.
function checkUnresolved(payments, currentId) {
  return payments.find(p =>
    p.id !== currentId &&
    p.transactions?.some(t => ['signed', 'submitted'].includes(t.status))
  );
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  // Extract [id] and [action] from URL: /api/testnet/payments/:id/:action
  const url = new URL(req.url, `https://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  // parts: ['api','testnet','payments', id, action]
  const id = parts[3];
  const action = parts[4];

  if (!id || !action || !/^[a-f0-9-]+$/.test(id) || !/^[a-z]+$/.test(action))
    return res.status(404).json({ error: 'Not found.' });

  try {
    authorizeVercelRequest(req);
    const sessionId = getSessionId(req);
    await ensureSchema();

    const payment = await loadPayment(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });
    if (payment.sessionId && payment.sessionId !== sessionId) return res.status(403).json({ error: 'Forbidden.' });

    assertAction(payment, action);

    const store = makeDbStore(payment);
    const { makeChain } = await import('../../../server/chain.mjs');
    const chain = makeChain(store);

    // Event helper — mirrors service.mjs
    const event = (message) => {
      payment.updatedAt = Date.now();
      payment.events = payment.events ?? [];
      payment.events.unshift({ at: payment.updatedAt, message });
    };

    function verifyConversion(output) {
      const tx = payment.transactions.find(t => t.step === `swap:${payment.attempt}`);
      if (!output || !payment.outputAmount || tx?.chain !== 'arc' || tx.status !== 'success'
        || BigInt(output) <= 0n || BigInt(payment.outputAmount) !== BigInt(output)
        || BigInt(output) < BigInt(payment.quote.minimum))
        throw new Error('No verified swap with the approved EURC output. Recover the original transaction.');
    }

    payment.error = undefined;
    try {
      if (action === 'quote') {
        payment.quote = await chain.quote(payment);
        payment.status = 'quoted';
        event('Live testnet estimate received. Approval expires in 60 seconds.');

      } else if (action === 'bridge') {
        payment.status = 'bridging';
        event('CCTP funding started.');
        if (await chain.bridge(payment)) {
          payment.status = 'funded';
          event('USDC mint on Arc verified.');
        } else {
          event('Burn confirmed. Waiting for Circle attestation; check bridge status to continue.');
        }

      } else if (action === 'retry') {
        event('Approved retry of the confirmed reverted bridge stage. Successful source burns are preserved.');
        if (await chain.retryBridge(payment)) {
          payment.status = 'funded';
          event('Bridge retry completed; USDC mint on Arc verified.');
        } else {
          event('Source burn confirmed. Waiting for Circle attestation.');
        }

      } else if (action === 'swap') {
        payment.status = 'swapping';
        payment.attempt = (payment.attempt ?? 0) + 1;
        event('Approved minimum recorded; submitting conversion.');
        const output = await chain.swap(payment);
        verifyConversion(output);
        payment.status = 'converted';
        event('EURC conversion verified from transaction logs. Recipient is not paid yet.');

      } else if (action === 'pay') {
        payment.status = 'paying';
        payment.payAttempt = (payment.payAttempt ?? 0) + 1;
        event('Submitting exact EURC recipient payment.');
        await chain.pay(payment);
        payment.status = 'paid';
        event('Exact EURC transfer to the recipient verified on Arc.');

      } else if (action === 'recover') {
        if (payment.status === 'bridging') {
          if (await chain.recoverBridge(payment)) {
            payment.status = 'funded';
            event('Original bridge completed; no second burn.');
          } else {
            event('Attestation is still pending. Source burn remains recorded.');
          }
        } else if (payment.status === 'swapping') {
          const output = await chain.recoverSwap(payment);
          if (output) {
            verifyConversion(output);
            payment.status = 'converted';
            event('Original swap receipt verified.');
          } else {
            payment.status = 'funded';
            delete payment.quote;
            event('Approval resolved; no swap executed. Request a fresh quote.');
          }
        } else {
          await chain.recoverPay(payment);
          payment.status = 'paid';
          event('Original recipient transfer verified; no second payment.');
        }

      } else if (action === 'reconcile') {
        payment.status = 'reconciled';
        payment.reconciledAt = Date.now();
        event('Verified recipient payment matched to this invoice. No funds moved.');
      }

    } catch (error) {
      // Error recovery — mirrors service.mjs exactly
      if (payment.status === 'swapping') {
        const tx = payment.transactions.find(t => t.step === `swap:${payment.attempt}`);
        const unresolvedApproval = payment.transactions.some(t =>
          t.step === `swap_approve:${payment.attempt}` && ['signed', 'submitted'].includes(t.status)
        );
        if ((!tx && !unresolvedApproval) || tx?.status === 'reverted') {
          payment.status = 'funded';
          delete payment.quote;
        }
      }
      if (payment.status === 'paying') {
        const tx = payment.transactions.find(t => t.step === `pay:${payment.payAttempt}`);
        if (!tx || tx.status === 'reverted') {
          payment.status = 'converted';
          if (tx) payment.payAttempt++;
        }
      }
      if (payment.status === 'bridging' && !payment.transactions?.length) payment.status = 'created';
      payment.error = cleanError(error);
      event(payment.error);
    }

    // Flush: persist final payment state to Turso
    await savePayment(payment);
    await store.flush();

    return res.status(202).json(publicPayment(payment));

  } catch (error) {
    return res.status(400).json({ error: cleanError(error) });
  }
}
