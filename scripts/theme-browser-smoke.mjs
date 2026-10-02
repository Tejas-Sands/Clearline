// Theme and synthetic UI verification only. No signer or token-moving requests.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = process.env.CLEARLINE_TEST_URL || 'http://127.0.0.1:5173';
const session = `clearline-theme-${process.pid}`;
mkdirSync('artifacts', { recursive: true });
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], { encoding: 'utf8', timeout: 20000 });
const evaluate = code => {
  const result = JSON.parse(browser('eval', code, '--json'));
  assert.equal(result.success, true, result.error);
  return result.data.result;
};
const click = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
const violations = [];
const audit = () => {
  const result = JSON.parse(browser('a11y', '--tags', 'wcag2a,wcag2aa', '--json'));
  assert.equal(result.success, true, result.error);
  for (const violation of result.data.violations) violations.push({ page: evaluate('location.hash'), id: violation.id, nodes: violation.nodes.map(node => ({ target: node.target, failure: node.failureSummary })) });
};
const fits = () => assert.equal(evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'Page fits viewport');
const isDark = () => assert.equal(evaluate('document.documentElement.dataset.theme'), 'dark');

try {
  browser('open', `${origin}/#landing`);
  browser('set', 'media', 'dark');
  evaluate('localStorage.removeItem("clearline.theme.v1")');
  browser('reload');
  browser('wait', '--text', 'Try a payment, step by step');
  isDark();
  assert.equal(evaluate('getComputedStyle(document.documentElement).colorScheme'), 'dark');
  browser('set', 'viewport', '1440', '1000');
  audit(); fits();
  browser('screenshot', resolve('artifacts/theme-home-dark.png'), '--full');
  click('Switch to light mode');
  assert.equal(evaluate('document.documentElement.dataset.theme'), 'light');
  assert.equal(evaluate('localStorage.getItem("clearline.theme.v1")'), 'light');
  browser('reload');
  browser('wait', '--fn', 'document.querySelector(".theme-toggle")?.getAttribute("aria-label") === "Switch to dark mode"');
  assert.equal(evaluate('document.documentElement.dataset.theme'), 'light', 'Saved preference overrides device theme');
  click('Switch to dark mode');
  browser('set', 'media', 'light');
  browser('reload');
  browser('wait', '--fn', 'document.querySelector(".theme-toggle")?.getAttribute("aria-label") === "Switch to light mode"');
  isDark();
  for (const action of ['Create demo invoice', 'Add demo dollars', 'Approve demo conversion', 'Send demo payment', 'Match invoice & payment']) {
    click(action); audit(); fits();
  }
  for (const width of [320, 375, 768, 1024]) {
    browser('set', 'viewport', String(width), '900'); audit(); fits();
  }
  console.log('Checked theme defaults, persistence and dark homepage journey.');
  browser('set', 'viewport', '375', '812');
  browser('screenshot', resolve('artifacts/theme-home-dark-mobile.png'), '--full');
  browser('set', 'viewport', '1440', '1000');
  click('Explore the simulation');
  browser('wait', '--text', 'Settlement overview');
  isDark(); audit(); fits();
  browser('screenshot', resolve('artifacts/theme-overview-dark.png'), '--full');
  browser('find', 'first', '.table-name', 'click');
  audit();
  browser('press', 'Escape');
  click('New payment');
  audit();
  browser('press', 'Escape');
  for (const page of ['payments', 'reconciliation', 'activity', 'settings', 'proof']) {
    browser('open', `${origin}/#${page}`); browser('snapshot', '-i');
    isDark(); audit(); fits();
    browser('set', 'viewport', '375', '812'); audit(); fits();
    browser('set', 'viewport', '1440', '1000');
  }
  console.log('Checked dark workspace, dialogs and proof on desktop/mobile.');
  browser('open', `${origin}/#overview`);
  browser('snapshot', '-i');
  evaluate(`(() => {
    const originalFetch = window.fetch.bind(window);
    const sender = '0x0000000000000000000000000000000000000001';
    const recipient = '0x0000000000000000000000000000000000000002';
    const payment = { id: 'theme-test', reference: 'THEME-TEST-001', recipient, sender, amount: '1000000', source: 'arc', status: 'funded', createdAt: Date.now(), transactions: [{ step: 'swap:1', chain: 'arc', hash: '0x' + '1'.repeat(64), status: 'success' }], events: [] };
    window.__themePayment = payment;
    window.__themeActions = [];
    const snapshot = { token: 'synthetic-theme-session', sender, defaultRecipient: recipient, payments: [payment, { ...payment, id: 'theme-second', reference: 'THEME-TEST-002', transactions: [] }], busy: null, balanceCheckedAt: Date.now(), balances: { arcUSDC: '20000000', arcEURC: '0', baseUSDC: '19000000', baseETH: '1000000000000000' } };
    window.fetch = async (input, options = {}) => {
      const path = new URL(input, location.href).pathname;
      if (!path.startsWith('/api/testnet')) return originalFetch(input, options);
      if (!options.method || options.method === 'GET') return Response.json(snapshot);
      window.__themeActions.push(path);
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (!path.endsWith('/quote')) throw new Error('Unexpected synthetic action');
      payment.status = 'quoted';
      payment.quote = { expected: '900000', minimum: '890000', expiresAt: Date.now() + 60000, fees: [] };
      return Response.json(payment, { status: 202 });
    };
  })()`);
  browser('find', 'role', 'link', 'click', '--name', 'Testnet payments', '--exact');
  browser('wait', '--text', 'THEME-TEST-001');
  isDark(); audit(); fits();
  browser('find', 'nth', '1', '.live-payment-row', 'hover');
  audit();
  click('Get live swap quote');
  assert.equal(evaluate('document.querySelector("button[aria-busy=true]").disabled'), true);
  assert.equal(evaluate('getComputedStyle(document.querySelector("button[aria-busy=true] .spin")).animationName'), 'live-spin');
  browser('wait', '--text', 'Approve conversion to EURC');
  audit();
  browser('screenshot', resolve('artifacts/theme-testnet-dark.png'), '--full');
  click('New test payment'); audit();
  browser('set', 'viewport', '375', '812'); audit(); fits();
  browser('screenshot', resolve('artifacts/theme-testnet-dark-mobile.png'), '--full');
  browser('set', 'media', 'light', 'reduced-motion');
  evaluate('window.__themePayment.status = "funded"; delete window.__themePayment.quote');
  browser('wait', '--text', 'Get live swap quote');
  click('Get live swap quote');
  assert.equal(evaluate('getComputedStyle(document.querySelector("button[aria-busy=true] .spin")).animationName'), 'none');
  browser('wait', '--text', 'Approve conversion to EURC');
  assert.equal(evaluate('window.__themeActions.length'), 2);
  click('Switch to light mode'); audit(); fits();
  assert.equal(browser('errors').trim(), '');
  assert.deepEqual(violations, [], 'No automated WCAG A/AA violations across the theme journey');
  console.log('PASS device theme, persistent choice, navigation, dark walkthrough, workspace/forms/proof/testnet, mobile layouts, loading/reduced motion and WCAG A/AA audits; synthetic quote requests only');
} finally {
  browser('close');
}
