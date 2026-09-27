// Turso/LibSQL database layer for Clearline testnet payments.
// Replaces server/store.mjs (file-based JSON) with a durable cloud DB.
// All payment state and the transaction journal live here.
// The wallet private key is NEVER stored in the DB — it comes from env secrets.
import { createClient } from '@libsql/client';

let _client = null;

export function getDb() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.');
    _client = createClient({ url, authToken });
  }
  return _client;
}

// ─── Schema bootstrap ────────────────────────────────────────────────────────
// Run once on cold start. Safe to call repeatedly (CREATE TABLE IF NOT EXISTS).
export async function ensureSchema() {
  const db = getDb();
  await db.batch([
    // Each payment row is the full mutable JSON blob.
    // We store payments as a single JSON column for compatibility with the
    // existing in-memory structure. This keeps all existing logic intact.
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL,
      sender TEXT NOT NULL,
      session_id TEXT NOT NULL DEFAULT 'demo-session',
      status TEXT NOT NULL,
      data TEXT NOT NULL,  -- full JSON of the payment object
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    // The journal stores raw signed bytes BEFORE broadcast.
    // Payment_id + step form a unique key; re-signing is blocked by checking this.
    `CREATE TABLE IF NOT EXISTS journal (
      payment_id TEXT NOT NULL,
      step TEXT NOT NULL,
      raw TEXT NOT NULL,
      hash TEXT NOT NULL,
      intent TEXT,
      status TEXT NOT NULL DEFAULT 'signed',
      block_number TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (payment_id, step)
    )`,
    // KV store for singleton state (balances cache, schema version, etc.)
    `CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ], 'write');
}

// ─── Payment CRUD ─────────────────────────────────────────────────────────────
export async function loadAllPayments(sessionId) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT data FROM payments WHERE session_id = ? ORDER BY created_at DESC',
    args: [sessionId],
  });
  return result.rows.map(row => JSON.parse(row.data));
}

export async function loadPayment(id) {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT data FROM payments WHERE id = ?', args: [id] });
  if (!result.rows.length) return null;
  return JSON.parse(result.rows[0].data);
}

export async function savePayment(payment) {
  const db = getDb();
  // Upsert: insert or replace the full payment JSON.
  // Transactions/journal entries embedded in payment.transactions are
  // authoritative — the journal table provides the raw bytes for recovery.
  await db.execute({
    sql: `INSERT INTO payments (id, reference, sender, session_id, status, data, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            data = excluded.data,
            updated_at = excluded.updated_at`,
    args: [
      payment.id,
      payment.reference,
      payment.sender,
      payment.sessionId ?? 'demo-session',
      payment.status,
      JSON.stringify(payment, (_, v) => typeof v === 'bigint' ? v.toString() : v),
      payment.createdAt,
      payment.updatedAt,
    ],
  });
}

export async function countPayments(sessionId) {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT COUNT(*) as n FROM payments WHERE session_id = ?', args: [sessionId] });
  return Number(result.rows[0].n);
}

// ─── Journal (raw signed bytes) ───────────────────────────────────────────────
export async function journalLoad(paymentId, step) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM journal WHERE payment_id = ? AND step = ?',
    args: [paymentId, step],
  });
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return { raw: row.raw, hash: row.hash, intent: row.intent, status: row.status, blockNumber: row.block_number, createdAt: row.created_at };
}

export async function journalSave(paymentId, step, entry) {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO journal (payment_id, step, raw, hash, intent, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(payment_id, step) DO UPDATE SET
            status = excluded.status`,
    args: [paymentId, step, entry.raw, entry.hash, entry.intent ?? null, entry.status, entry.createdAt ?? Date.now()],
  });
}

export async function journalUpdateStatus(paymentId, step, status, blockNumber = null) {
  const db = getDb();
  await db.execute({
    sql: 'UPDATE journal SET status = ?, block_number = ? WHERE payment_id = ? AND step = ?',
    args: [status, blockNumber, paymentId, step],
  });
}

// ─── KV helpers ──────────────────────────────────────────────────────────────
export async function kvGet(key) {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT value FROM kv WHERE key = ?', args: [key] });
  if (!result.rows.length) return null;
  try { return JSON.parse(result.rows[0].value); } catch { return result.rows[0].value; }
}

export async function kvSet(key, value) {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [key, JSON.stringify(value), Date.now()],
  });
}
