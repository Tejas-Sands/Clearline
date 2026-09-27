// Shared store factory for action handlers.
// Provides a store-compatible object backed by Turso instead of disk JSON.
import { savePayment } from '../../../server/db.mjs';
import { getAccount, defaultRecipient } from '../../_auth.mjs';

export function makeDbStore(payment) {
  const account = getAccount();
  const recipient = defaultRecipient();

  // The store object mirrors the interface expected by chain.mjs and journal.mjs.
  // save() is called synchronously by journal.mjs after signing but before broadcast.
  // We schedule the async DB write and return immediately — the signed bytes are
  // already in payment.transactions so recovery is possible even before flush.
  const store = {
    account,
    privateKey: process.env.WALLET_PRIVATE_KEY,
    recipient,
    state: { payments: payment ? [payment] : [] },
    _pendingSave: null,
    save() {
      const p = this.state.payments[0];
      if (!p) return;
      p.updatedAt = Date.now();
      this._pendingSave = savePayment(p);
    },
    async flush() {
      if (this._pendingSave) {
        await this._pendingSave;
        this._pendingSave = null;
      }
    },
  };
  return store;
}

export const cleanError = err =>
  (err?.shortMessage ?? err?.message ?? 'Operation failed.')
    .replace(/0x[0-9a-f]{128,}/gi, '[transaction data]')
    .slice(0, 500);
