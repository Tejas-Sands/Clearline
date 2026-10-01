// Local UI verification with synthetic API responses. Never contacts a signer.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = process.env.CLEARLINE_TEST_URL || 'http://127.0.0.1:5173';
const session = `clearline-ui-${process.pid}`;
const artifacts = resolve('artifacts');
mkdirSync(artifacts, { recursive: true });
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], {
  encoding: 'utf8', timeout: 20000,
  env: { ...process.env, AGENT_BROWSER_DEFAULT_TIMEOUT: '10000' },
});
const evaluate = code => {
  const result = JSON.parse(browser('eval', code, '--json'));
  assert.equal(result.success, true, result.error);
  return result.data.result;
};
const click = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
const wait = text => browser('wait', '--text', text);
const fits = () => assert.equal(evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'No page overflow');
const audit = () => {
  const result = JSON.parse(browser('a11y', '--tags', 'wcag2a,wcag2aa', '--json'));
  assert.equal(result.success, true, result.error);
  assert.deepEqual(result.data.violations, [], 'No automated WCAG A/AA violations');
};

try {
  browser('open', `${origin}/#overview`);
  browser('set', 'viewport', '1440', '1000');
  browser('snapshot', '-i');
  fits(); audit();
  browser('screenshot', resolve(artifacts, 'refresh-overview-desktop.png'), '--full');

  // Intercept every testnet request before mounting that workspace.
  evaluate(`(() => {
    const originalFetch = window.fetch.bind(window);
    const sender = '0x0000000000000000000000000000000000000001';
    const recipient = '0x0000000000000000000000000000000000000002';
    const payment = { id: 'abc-123', reference: 'UI-TEST-001', recipient, sender, amount: '1000000', source: 'arc', status: 'funded', createdAt: Date.now(), transactions: [], events: [] };
    const snapshot = { token: 'synthetic-ui-session', sender, defaultRecipient: recipient, payments: [payment], busy: null, balanceCheckedAt: Date.now(), balances: { arcUSDC: '20000000', arcEURC: '0', baseUSDC: '19000000', baseETH: '1000000000000000' } };
    window.__clearlineMock = { snapshot, mode: 'error', actions: [] };
    window.fetch = async (input, options = {}) => {
      const path = new URL(input, location.href).pathname;
      if (!path.startsWith('/api/testnet')) return originalFetch(input, options);
      const state = window.__clearlineMock;
      if (!options.method || options.method === 'GET') return Response.json(state.snapshot);
      state.actions.push(path);
      if (path.endsWith('/quote')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (state.mode === 'error') return new Response('A server error has occurred', { status: 500 });
        payment.status = 'quoted';
        payment.quote = { expected: '900000', minimum: '890000', expiresAt: Date.now() + 60000, fees: [] };
        return Response.json(payment, { status: 202 });
      }
      if (path === '/api/testnet/payments') {
        const input = JSON.parse(options.body);
        const created = { ...payment, id: 'def-456', reference: input.reference, recipient: input.recipient, status: 'funded', quote: undefined };
        state.snapshot.payments.unshift(created);
        return Response.json(created, { status: 201 });
      }
      throw new Error('Unexpected action in UI verification: ' + path);
    };
    return true;
  })()`);
  browser('find', 'role', 'link', 'click', '--name', 'Testnet payments', '--exact');
  wait('UI-TEST-001');
  assert.equal(evaluate('document.querySelectorAll(".payment-progress li").length'), 5);
  assert.equal(evaluate('document.querySelector(".payment-progress [aria-current=step]").textContent.includes("Quote")'), true);
  fits(); audit();
  browser('screenshot', resolve(artifacts, 'refresh-testnet-desktop.png'), '--full');

  click('Get live swap quote');
  assert.equal(evaluate('document.querySelector("button[aria-busy=\\"true\\"] .spin") !== null'), true, 'Quote action shows an animated loading indicator');
  wait('HTTP 500');
  assert.equal(evaluate('document.body.textContent.includes("Unexpected token")'), false);
  assert.equal(evaluate('document.querySelector(".payment-progress [aria-current=step]").textContent.includes("Quote")'), true);
  evaluate('window.__clearlineMock.mode = "success"');
  click('Get live swap quote');
  wait('Approve conversion to EURC');
  assert.equal(evaluate('document.querySelector(".payment-progress [aria-current=step]").textContent.includes("Convert")'), true);
  evaluate('window.__clearlineMock.snapshot.payments[0].quote.expiresAt = Date.now() - 1000');
  wait('Your quote expired. Get a fresh one.');
  assert.equal(evaluate('Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Approve conversion")).disabled'), true);
  console.log('PASS quote failure, successful quote, progress, and expiry recovery');

  click('New test payment');
  wait('Let’s set up your payment');
  assert.equal(evaluate('document.activeElement.getAttribute("placeholder")'), 'e.g. TEST-001');
  browser('fill', 'input[placeholder="e.g. TEST-001"]', 'UI-CREATED-002');
  audit();
  browser('set', 'viewport', '375', '812');
  fits();
  browser('screenshot', resolve(artifacts, 'refresh-testnet-form-mobile.png'), '--full');
  click('Create test payment');
  wait('UI-CREATED-002');
  assert.equal(evaluate('document.querySelector(".live-detail h2").textContent'), 'UI-CREATED-002');
  assert.equal(evaluate('window.__clearlineMock.actions.some(path => /\\/(swap|pay|bridge|recover|retry)$/.test(path))'), false);
  fits(); audit();
  browser('screenshot', resolve(artifacts, 'refresh-testnet-mobile.png'), '--full');
  browser('set', 'viewport', '812', '375');
  fits();
  console.log('PASS testnet form, automatic selection, mobile and landscape layouts; no token-moving actions');

  browser('open', `${origin}/#landing`);
  browser('set', 'viewport', '1440', '1000');
  fits(); audit();
  browser('screenshot', resolve(artifacts, 'refresh-landing-desktop.png'), '--full');
  browser('set', 'viewport', '375', '812');
  fits();
  browser('screenshot', resolve(artifacts, 'refresh-landing-mobile.png'), '--full');
  click('Explore the simulation');
  wait('Settlement overview');
  fits();
  browser('screenshot', resolve(artifacts, 'refresh-overview-mobile.png'), '--full');
  console.log('PASS landing entry points and mobile overview');
  browser('set', 'viewport', '1440', '1000');
  for (const page of ['payments', 'reconciliation', 'activity', 'settings', 'proof']) {
    browser('open', `${origin}/#${page}`);
    browser('snapshot', '-i');
    fits(); audit();
  }
  console.log('PASS remaining workspace pages and proof accessibility');
} finally {
  browser('close');
}
