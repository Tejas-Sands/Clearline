// Verify already reconciled testnet records; never approve new transfers.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const session = `clearline-testnet-check-${process.pid}`;
const artifacts = resolve('artifacts');
mkdirSync(artifacts, { recursive: true });
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], {
  encoding: 'utf8', timeout: 20000, env: { ...process.env, AGENT_BROWSER_DOWNLOAD_PATH: artifacts },
});
const evaluate = code => {
  const result = JSON.parse(browser('eval', code, '--json'));
  assert.equal(result.success, true); return result.data.result;
};
try {
  browser('open', 'http://127.0.0.1:5173/#testnet');
  browser('wait', '--text', 'Testnet wallet');
  const evidence = evaluate(`(async () => {
    const s = await fetch('/api/testnet').then(r => r.json());
    const p = s.payments.find(p => p.status === 'reconciled');
    if (!p || s.busy) throw Error('Need an idle service and a reconciled testnet record.');
    const duplicate = await fetch('/api/testnet/payments/' + p.id + '/pay', { method:'POST', headers:{'Content-Type':'application/json','X-Clearline-Token':s.token}, body:'{}' });
    const missingToken = await fetch('/api/testnet/payments', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    const after = await fetch('/api/testnet').then(r=>r.json());
    return { reference:p.reference, recipient:p.recipient, beforeCount:p.transactions.length, afterCount:after.payments.find(x=>x.id===p.id).transactions.length, duplicate:duplicate.status, missingToken:missingToken.status, environment:s.environment };
  })()`);
  assert.equal(evidence.environment, 'testnet');
  assert.equal(evidence.duplicate, 400); assert.equal(evidence.missingToken, 400);
  assert.equal(evidence.beforeCount, evidence.afterCount);
  browser('wait', '--text', evidence.reference);
  evaluate(`Array.from(document.querySelectorAll('.live-payment-row')).find(b=>b.textContent.includes(${JSON.stringify(evidence.reference)})).click()`);
  browser('wait', '--text', 'Recipient payment verified and invoice matched');
  evaluate(`window.__exportBlob = null; const original = URL.createObjectURL; URL.createObjectURL = b => {window.__exportBlob=b; return original(b);}`);
  browser('find', 'role', 'button', 'click', '--name', 'Export records', '--exact');
  const csv = evaluate('window.__exportBlob.text()');
  assert.ok(csv.includes('arc-testnet')); assert.ok(csv.includes(evidence.reference)); assert.ok(csv.includes(evidence.recipient));
  assert.ok(!csv.includes('privateKey') && !csv.includes('"raw"'));
  browser('set', 'viewport', '1440', '1000');
  browser('screenshot', resolve(artifacts, 'testnet-desktop.png'), '--full');
  browser('set', 'viewport', '375', '812');
  assert.ok(evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile overflow');
  browser('screenshot', resolve(artifacts, 'testnet-mobile.png'), '--full');
  browser('reload'); browser('wait', '--text', evidence.reference);
  assert.equal(evaluate('!!document.querySelector("vite-error-overlay")'), false);
  const errors = browser('errors');
  assert.equal(errors.trim(), '', `Browser errors: ${errors}`);
  console.log('PASS testnet persistence, duplicate-payout rejection, token protection, CSV export, desktop/mobile rendering');
} finally { browser('close'); }
