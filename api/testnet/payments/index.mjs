// POST /api/testnet/payments — create a new testnet payment record.
// No tokens are moved. Just validates and saves the obligation to Turso.
import { ensureSchema, savePayment, countPayments, countRecentPaymentsGlobal, kvGet, kvSet, loadAllPayments } from '../../../server/db.mjs';
import { normalizePayment, publicPayment } from '../../../server/model.mjs';
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

    // 1. Session limit (max 10 lifetime)
    const count = await countPayments(sessionId);
    if (count >= 10) throw new Error('This public demo supports up to 10 test payments per session.');

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // 2. Global rate limit (max 50 payments globally per 24h)
    const globalCount = await countRecentPaymentsGlobal(dayAgo);
    if (globalCount >= 50) throw new Error('The global daily limit for testnet payments has been reached. Please try again tomorrow.');

    // 3. IP rate limit (max 5 payments per IP per 24h)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
    if (ip !== 'unknown') {
      const ipKey = `rate_limit:ip:${ip}`;
      const ipData = await kvGet(ipKey) || { count: 0, windowStart: now };
      // Reset window if it's older than 24h
      if (ipData.windowStart < dayAgo) {
        ipData.count = 0;
        ipData.windowStart = now;
      }
      if (ipData.count >= 5) throw new Error('You have reached the daily limit of 5 testnet payments per IP address.');
      
      // We'll increment and save after we successfully create the payment
      ipData.count += 1;
      await kvSet(ipKey, ipData);
    }


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
      ip, // Store IP for auditing
    };
    await savePayment(payment);
    return res.status(201).json(publicPayment(payment));
  } catch (error) {
    return res.status(400).json({ error: cleanError(error) });
  }
}
