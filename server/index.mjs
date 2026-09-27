import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { resolve, join } from 'node:path';
import { mkdirSync, openSync, writeFileSync, readFileSync, unlinkSync, closeSync, existsSync } from 'node:fs';
import { openStore } from './store.mjs';
import { makeChain } from './chain.mjs';
import { makeService, cleanError } from './service.mjs';
import { authorizeRequest } from './security.mjs';
import { assertAction, publicPayment } from './model.mjs';

const dir = resolve('.clearline-testnet');
mkdirSync(dir, { recursive: true, mode: 0o700 });
const lock = join(dir, 'server.lock');
if (existsSync(lock)) {
  const pid = Number(readFileSync(lock, 'utf8'));
  try { process.kill(pid, 0); throw new Error('Another Clearline testnet server is running.'); }
  catch (error) { if (error.code !== 'ESRCH') throw error; unlinkSync(lock); }
}
const fd = openSync(lock, 'wx', 0o600); writeFileSync(fd, String(process.pid)); closeSync(fd);
process.on('exit', () => { try { unlinkSync(lock); } catch {} });
const store = openStore(dir);
const chain = makeChain(store);
const service = makeService(store, chain);
const token = randomBytes(32).toString('hex');
let balances = null, balanceCheckedAt = null, refreshing = null;
function refreshBalances() {
  if (!refreshing) refreshing = chain.balances().then(result => { balances = result; balanceCheckedAt = Date.now(); }).finally(() => { refreshing = null; });
  return refreshing;
}
function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}
async function body(req) {
  let text = '';
  for await (const chunk of req) { text += chunk; if (text.length > 8192) throw new Error('Request too large.'); }
  return JSON.parse(text);
}
const server = createServer(async (req, res) => {
  try {
    authorizeRequest(req.method, req.headers, token);
    const path = new URL(req.url, 'http://127.0.0.1:8787').pathname;
    if (req.method === 'GET' && path === '/api/testnet') {
      if (!balanceCheckedAt || Date.now() - balanceCheckedAt > 15000) void refreshBalances().catch(() => {});
      return send(res, 200, { environment: 'testnet', token, sender: store.account.address, defaultRecipient: store.recipient, balances, balanceCheckedAt, busy: service.busy, payments: service.list() });
    }
    if (req.method === 'POST' && path === '/api/testnet/payments') return send(res, 201, publicPayment(service.create(await body(req))));
    if (req.method === 'POST' && path === '/api/testnet/refresh') { await refreshBalances(); return send(res, 200, { balances, balanceCheckedAt }); }
    const match = path.match(/^\/api\/testnet\/payments\/([a-f0-9-]+)\/([a-z]+)$/);
    if (req.method === 'POST' && match) {
      await body(req);
      if (service.busy) throw new Error('An operation is in progress.');
      const p = store.state.payments.find(p => p.id === match[1]);
      if (!p) throw new Error('Payment not found.');
      assertAction(p, match[2]);
      const unresolved = store.state.payments.find(other => other.id !== p.id && other.transactions.some(t => ['signed', 'submitted'].includes(t.status)));
      if (unresolved) throw new Error(`Recover ${unresolved.reference} first.`);
      void service.act(p.id, match[2]).then(() => refreshBalances()).catch(error => console.error(cleanError(error)));
      return send(res, 202, { accepted: true });
    }
    send(res, 404, { error: 'Not found.' });
  } catch (error) { send(res, 400, { error: cleanError(error) }); }
});
server.requestTimeout = 30000;
server.on('error', error => { console.error(error.message); process.exit(1); });
server.listen(8787, '127.0.0.1', () => {
  console.log('Clearline testnet API: http://127.0.0.1:8787');
  console.log(`Test-only funding address: ${store.account.address}`);
  console.log('Private keys stay in .clearline-testnet/. Never send real assets to this wallet.');
  void refreshBalances().catch(() => {});
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
