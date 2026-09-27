// One-time schema bootstrap for the Turso database.
// Run with: node --env-file=.env scripts/setup-db.mjs
import { ensureSchema, kvSet } from '../server/db.mjs';

console.log('Bootstrapping Clearline Turso schema...');
console.log('DB URL:', process.env.TURSO_DATABASE_URL);

await ensureSchema();
await kvSet('schema_version', 1);

console.log('✓ Tables created: payments, journal, kv');
console.log('✓ Schema version set to 1');
console.log('\nNext steps:');
console.log('  1. Set WALLET_PRIVATE_KEY in .env (from .clearline-testnet/wallet.json)');
console.log('  2. Set API_SESSION_TOKEN in .env (random 32-char hex)');
console.log('  3. Deploy to Vercel and set all env vars as Vercel secrets');
console.log('  4. Remove WALLET_PRIVATE_KEY from .env after verifying Vercel deployment');
