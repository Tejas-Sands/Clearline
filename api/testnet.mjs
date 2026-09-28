// Vercel serverless API route: GET /api/testnet
// Returns the public snapshot: wallet info, balances (cached), payment list.
// POST /api/testnet/refresh — forces balance refresh
//
// IMPORTANT: chain.mjs is dynamically imported (lazy) to prevent Vercel's bundler
// from statically including all of viem + Circle SDKs (63MB+) into this function's
// bundle — which would exceed Vercel's 50MB function size limit.
import { ensureSchema, loadAllPayments, kvGet, kvSet } from '../server/db.mjs';
import { publicPayment } from '../server/model.mjs';
import { authorizeVercelRequest, getAccount, defaultRecipient, getSessionId } from './_auth.mjs';

// getAccount is imported from _auth.mjs (validates key format with regex)

async function fetchBalances(account, recipient) {
  const { makeChain } = await import('../server/chain.mjs');
  const store = { account, privateKey: process.env.WALLET_PRIVATE_KEY, recipient, state: { payments: [] }, save: async () => {} };
  const chain = makeChain(store);
  return chain.balances();
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
      const balances = await fetchBalances(account, recipient);
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
        balances = await fetchBalances(account, recipient);
        balanceCheckedAt = Date.now();
        await kvSet('balances', { balances, balanceCheckedAt });
      } catch {
        // RPC fallback or timeout — serve stale cache
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
      busy: null,
      payments: payments.map(publicPayment),
    });
  } catch (error) {
    const msg = (error?.shortMessage ?? error?.message ?? 'Request failed.').slice(0, 400);
    return res.status(400).json({ error: msg });
  }
}
