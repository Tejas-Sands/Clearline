// Vercel serverless API route: GET /api/testnet
// Returns the public snapshot: wallet info, balances (cached), payment list.
// POST /api/testnet/refresh — forces balance refresh
import { privateKeyToAccount } from 'viem/accounts';
import { ensureSchema, loadAllPayments, kvGet, kvSet } from '../server/db.mjs';
import { makeChain } from '../server/chain.mjs';
import { publicPayment } from '../server/model.mjs';
import { authorizeVercelRequest, defaultRecipient, getSessionId } from './_auth.mjs';

function getAccount() {
  const pk = process.env.WALLET_PRIVATE_KEY;
  if (!pk) throw new Error('WALLET_PRIVATE_KEY is not configured.');
  return privateKeyToAccount(pk);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    authorizeVercelRequest(req);
    const sessionId = getSessionId(req);
    await ensureSchema();
    const account = getAccount();
    const sender = account.address;
    const recipient = defaultRecipient();

    if (req.method === 'POST') {
      // Refresh balances
      const store = { account, privateKey: process.env.WALLET_PRIVATE_KEY, recipient, state: { payments: [] }, save: async () => {} };
      const chain = makeChain(store);
      const balances = await chain.balances();
      const balanceCheckedAt = Date.now();
      await kvSet('balances', { balances, balanceCheckedAt });
      return res.status(200).json({ balances, balanceCheckedAt });
    }

    // GET: return snapshot
    const payments = await loadAllPayments(sessionId);
    const cached = await kvGet('balances');
    const balancesStale = !cached || Date.now() - cached.balanceCheckedAt > 15000;

    let balances = cached?.balances ?? null;
    let balanceCheckedAt = cached?.balanceCheckedAt ?? null;

    if (balancesStale) {
      try {
        const store = { account, privateKey: process.env.WALLET_PRIVATE_KEY, recipient, state: { payments: [] }, save: async () => {} };
        const chain = makeChain(store);
        balances = await chain.balances();
        balanceCheckedAt = Date.now();
        await kvSet('balances', { balances, balanceCheckedAt });
      } catch {
        // RPC fallback or timeout
      }
    }

    const apiToken = process.env.API_SESSION_TOKEN ?? 'demo';
    return res.status(200).json({
      environment: 'testnet',
      token: apiToken,
      sender,
      defaultRecipient: recipient,
      balances,
      balanceCheckedAt,
      busy: null, // Vercel is stateless; busy is now tracked per-payment via status
      payments: payments.map(publicPayment),
    });
  } catch (error) {
    const msg = (error?.shortMessage ?? error?.message ?? 'Request failed.').slice(0, 400);
    return res.status(400).json({ error: msg });
  }
}
