// Shared store factory for action handlers.
// Provides a store-compatible object backed by Turso instead of disk JSON.
import { savePayment } from '../../../server/db.mjs';
import { getAccount, defaultRecipient } from '../../_auth.mjs';

export function makeDbStore(payment) {
  const account = getAccount();
  const recipient = defaultRecipient();

  // Journal callbacks are passed unbound. Use a closure, and return the durable
  // checkpoint promise so the journal can wait before broadcasting signed bytes.
  let pendingSave = Promise.resolve();
  const store = {
    account,
    privateKey: process.env.WALLET_PRIVATE_KEY,
    recipient,
    state: { payments: payment ? [payment] : [] },
    save() {
      const p = store.state.payments[0];
      if (!p) return pendingSave;
      p.updatedAt = Date.now();
      const snapshot = JSON.parse(JSON.stringify(p, (_, value) => typeof value === 'bigint' ? value.toString() : value));
      // Serialize immutable checkpoints. A later recovery save may proceed after
      // a failed write, but the caller of that failed checkpoint still rejects.
      pendingSave = pendingSave.catch(() => {}).then(() => savePayment(snapshot));
      return pendingSave;
    },
    flush: () => pendingSave,
  };
  return store;
}

export const cleanError = err =>
  (err?.shortMessage ?? err?.message ?? 'Operation failed.')
    .replace(/0x[0-9a-f]{128,}/gi, '[transaction data]')
    .slice(0, 500);
