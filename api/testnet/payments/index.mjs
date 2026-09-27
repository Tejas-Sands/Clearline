// POST /api/testnet/payments — create a new testnet payment record.
// No tokens are moved. Just validates and saves the obligation to Turso.
import { ensureSchema, savePayment, countPayments } from '../../../server/db.mjs';
import { normalizePayment, publicPayment } from '../../../server/model.mjs';
import { loadAllPayments } from '../../../server/db.mjs';
import { authorizeVercelRequest, getAccount, defaultRecipient, getSessionId } from '../../_auth.mjs';
import { cleanError } from './_shared.mjs';
import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    authorizeVercelRequest(req);
    const sessionId = getSessionId(req);
    await ensureSchema();
    const account = getAccount();
    const sender = account.address;
    const input = req.body;

    const normalized = normalizePayment(input, sender);
    const existing = await loadAllPayments(sessionId);
    if (existing.some(p => p.reference.toLowerCase() === normalized.reference.toLowerCase()))
      throw new Error('Invoice reference already exists.');
    const count = await countPayments(sessionId);
    if (count >= 10) throw new Error('This public demo supports up to 10 test payments per session.');

    const now = Date.now();
    const payment = {
      ...normalized,
      id: randomUUID(),
      sessionId,
      sender,
      status: normalized.source === 'arc' ? 'funded' : 'created',
      createdAt: now,
      updatedAt: now,
      transactions: [],
      events: [{ at: now, message: 'Testnet payment created. No tokens moved.' }],
      attempt: 0,
    };
    await savePayment(payment);
    return res.status(201).json(publicPayment(payment));
  } catch (error) {
    return res.status(400).json({ error: cleanError(error) });
  }
}
