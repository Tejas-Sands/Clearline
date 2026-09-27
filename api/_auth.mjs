// Shared auth + wallet helpers for Vercel API routes.
// Replaces server/security.mjs — adapted for Vercel's request shape.
import { privateKeyToAccount } from 'viem/accounts';

// In Vercel, the session token is a static secret set as an env var.
// It guards all mutation endpoints, replacing the per-process random token.
export function authorizeVercelRequest(req) {
  const method = req.method ?? 'GET';
  if (method !== 'GET') {
    const ct = req.headers['content-type'] ?? '';
    if (!ct.startsWith('application/json')) throw new Error('JSON request required.');
    const token = req.headers['x-clearline-token'];
    const expected = process.env.API_SESSION_TOKEN;
    if (!expected) throw new Error('API_SESSION_TOKEN is not configured.');
    if (token !== expected) throw new Error('Invalid session token.');
  }
}

export function getAccount() {
  const pk = process.env.WALLET_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-f]{64}$/i.test(pk)) throw new Error('WALLET_PRIVATE_KEY is not set or invalid.');
  return privateKeyToAccount(pk);
}

export function defaultRecipient() {
  const pk = process.env.RECIPIENT_PRIVATE_KEY;
  if (!pk) return process.env.DEFAULT_RECIPIENT ?? '0xcD407427098Cc241708cF348456FCE0997d8de20';
  return privateKeyToAccount(pk).address;
}

export function getSessionId(req) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !/^[a-zA-Z0-9-]{10,60}$/.test(sessionId)) throw new Error('Invalid or missing X-Session-ID header.');
  return sessionId;
}
