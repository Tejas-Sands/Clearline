// Requires a running local app and agent-browser installed with Chrome.
// Uses an isolated session and synthetic data only; does not touch your normal browser.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = process.env.CLEARLINE_TEST_URL || 'http://127.0.0.1:5173';
const session = `clearline-e2e-${process.pid}`;
const artifacts = resolve('artifacts');
mkdirSync(artifacts, { recursive: true });
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], {
  encoding: 'utf8', timeout: 15000,
  env: { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '7000', AGENT_BROWSER_DOWNLOAD_PATH: artifacts },
});
const evaluate = code => {
  const response = JSON.parse(browser('eval', code, '--json'));
  assert.equal(response.success, true, response.error);
  return response.data.result;
};
const state = () => evaluate('JSON.parse(localStorage.getItem("clearline.workspace.v1"))');
const click = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
const waitText = text => browser('wait', '--text', text);
const close = () => click('Close dialog');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const passed = message => console.log(`PASS ${message}`);

try {
  browser('open', `${origin}/#overview`);
  browser('set', 'viewport', '1440', '1000');
  browser('snapshot', '-i');
  assert.equal(evaluate('document.querySelector("h1").textContent'), 'Settlement overview');
  assert.equal(evaluate('!!document.querySelector("vite-error-overlay")'), false);
  const initial = state();
  assert.equal(initial.payments.length, 9);
  passed('App renders the seeded overview without a framework error');
  browser('screenshot', resolve(artifacts, 'overview-desktop.png'), '--full');

  click('New payment');
  browser('snapshot', '-i');
  browser('fill', 'input[name="counterparty"]', 'Browser Test Supplier');
  browser('fill', 'input[name="reference"]', 'E2E-2001');
  browser('fill', 'input[name="amount"]', '2500.00');
  click('Create payment');
  waitText('Request demo quote');
  click('Request demo quote');
  waitText('Approve simulated settlement');
  click('Approve simulated settlement');
  waitText('Reconcile payment');
  let current = state();
  assert.equal(BigInt(initial.balances.USDC) - BigInt(current.balances.USDC), 2500250000n);
  assert.equal(BigInt(current.balances.EURC) - BigInt(initial.balances.EURC), 2287500000n);
  assert.equal(current.payments.find(p => p.reference === 'E2E-2001').status, 'settled');
  const settledBalances = current.balances;
  click('Reconcile payment');
  waitText('Payment reconciled');
  assert.equal(state().payments.find(p => p.reference === 'E2E-2001').status, 'reconciled');
  assert.deepEqual(state().balances, settledBalances);
  browser('screenshot', resolve(artifacts, 'reconciled-payment.png'));
  close();
  browser('reload');
  assert.equal(state().payments.find(p => p.reference === 'E2E-2001').status, 'reconciled');
  passed('Create → quote → approve → reconcile preserves exact balances and survives reload');

  click('Open INV-1047');
  browser('snapshot', '-i');
  const beforeCheck = state();
  click('Check simulated settlement');
  waitText('Reconcile payment');
  assert.equal(state().balances.USDC, beforeCheck.balances.USDC);
  assert.equal(BigInt(state().balances.EURC) - BigInt(beforeCheck.balances.EURC), 7137000000n);
  close();
  passed('Unknown outcome resolves with one target credit and no second source debit');

  click('Open INV-1048');
  waitText('Refresh expired quote');
  click('Refresh expired quote');
  waitText('Approve simulated settlement');
  close();
  passed('Expired quote has a working refresh path');

  click('Import CSV');
  const importText = 'reference,counterparty,amount,currency\nE2E-CSV-1,"Quoted, Supplier",50.123456,USDC\nE2E-CSV-2,Second Supplier,25,USDC';
  browser('fill', 'textarea', importText);
  waitText('2 payments ready to import');
  const oversized = resolve(artifacts, 'oversized.csv');
  writeFileSync(oversized, 'x'.repeat(1_000_001));
  browser('upload', 'input[type="file"]', oversized);
  waitText('Choose a CSV file smaller than 1 MB.');
  assert.equal(evaluate('document.querySelector("dialog .button.primary").disabled'), true);
  assert.equal(evaluate('document.querySelector("textarea").value'), '');
  browser('fill', 'textarea', importText);
  click('Import 2 payments');
  waitText('Payment queue');
  assert.equal(state().payments.find(p => p.reference === 'E2E-CSV-1').amount, '50123456');
  passed('CSV imports exact values and oversized replacement files clear stale previews');

  browser('fill', 'input[aria-label="Search payments"]', 'E2E-CSV-1');
  assert.equal(evaluate('document.querySelectorAll("tbody tr").length'), 1);
  assert.ok(evaluate('document.querySelector("tbody").textContent').includes('Quoted, Supplier'));
  browser('fill', 'input[aria-label="Search payments"]', '');
  click('Export CSV');
  for (let i = 0; i < 10 && !readdirSync(artifacts).some(f => /^clearline-payments-.*\.csv$/.test(f)); i++) await pause(200);
  const exportName = readdirSync(artifacts).find(f => /^clearline-payments-.*\.csv$/.test(f));
  assert.ok(exportName, 'CSV export download exists');
  assert.ok(readFileSync(resolve(artifacts, exportName), 'utf8').includes('E2E-CSV-1'));
  passed('Search filters the queue and export downloads the real records');

  browser('find', 'role', 'link', 'click', '--name', 'Reconciliation', '--exact');
  click('Ready to match');
  assert.equal(evaluate('Array.from(document.querySelectorAll("tbody .status")).every(e => e.textContent === "Settled")'), true);
  click('Reconciled');
  assert.equal(evaluate('Array.from(document.querySelectorAll("tbody .status")).every(e => e.textContent === "Reconciled")'), true);
  passed('Reconciliation offers meaningful matched/unmatched filters');

  browser('open', `${origin}/#overview`);
  browser('set', 'viewport', '375', '812');
  assert.equal(evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(evaluate('getComputedStyle(document.querySelector(".sidebar")).visibility'), 'hidden');
  click('Open navigation');
  await pause(250);
  assert.equal(evaluate('document.querySelector(".sidebar").contains(document.activeElement)'), true);
  assert.equal(evaluate('document.querySelector(".main-shell").inert'), true);
  browser('press', 'Shift+Tab');
  assert.equal(evaluate('document.querySelector(".sidebar").contains(document.activeElement)'), true);
  browser('press', 'Tab');
  assert.equal(evaluate('document.querySelector(".sidebar").contains(document.activeElement)'), true);
  browser('press', 'Escape');
  await pause(250);
  assert.equal(evaluate('document.activeElement.getAttribute("aria-label")'), 'Open navigation');
  browser('screenshot', resolve(artifacts, 'overview-mobile.png'), '--full');
  click('New payment');
  assert.equal(evaluate('document.querySelector("dialog").contains(document.activeElement)'), true);
  browser('press', 'Escape');
  assert.equal(evaluate('!!document.querySelector("dialog[open]")'), false);
  passed('375px layout has no document overflow; mobile menu traps/restores focus and Escape closes dialogs');

  evaluate('localStorage.setItem("clearline.workspace.v1", "broken-json")');
  browser('reload');
  waitText('Workspace needs attention');
  assert.equal(evaluate('localStorage.getItem("clearline.workspace.v1")'), 'broken-json');
  click('Recovery options');
  click('Reset demo workspace');
  click('Yes, reset demo workspace');
  waitText('Settlement overview');
  assert.equal(state().payments.length, 9);
  assert.equal(evaluate('!!document.querySelector(".storage-error")'), false);
  passed('Corrupt storage stays intact until explicit recovery reset');

  const errors = browser('errors').trim();
  assert.equal(errors, '', `Browser errors: ${errors}`);
  console.log('All browser smoke checks passed. Screenshots and downloads: artifacts/');
} finally {
  browser('close');
}
