// Homepage teaching flow only: synthetic funds, isolated browser, no signing API.
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const origin = process.env.CLEARLINE_TEST_URL || 'http://127.0.0.1:5173';
const session = `clearline-learn-${process.pid}`;
const artifacts = resolve('artifacts');
mkdirSync(artifacts, { recursive: true });
const browser = (...args) => execFileSync('agent-browser', ['--session', session, ...args], { encoding: 'utf8', timeout: 20000 });
const evaluate = code => {
  const result = JSON.parse(browser('eval', code, '--json'));
  assert.equal(result.success, true, result.error);
  return result.data.result;
};
const click = name => browser('find', 'role', 'button', 'click', '--name', name, '--exact');
const text = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent`);
const audit = () => {
  const result = JSON.parse(browser('a11y', '--tags', 'wcag2a,wcag2aa', '--json'));
  assert.equal(result.success, true, result.error);
  assert.deepEqual(result.data.violations, []);
};
const fits = () => assert.equal(evaluate('document.documentElement.scrollWidth <= innerWidth'), true);

try {
  browser('open', `${origin}/#landing`);
  browser('set', 'viewport', '1440', '1000');
  browser('snapshot', '-i');
  assert.equal(evaluate('!!document.querySelector("#payment-playground")'), true, 'Home has an embedded payment walkthrough');
  const savedWorkspace = evaluate('localStorage.getItem("clearline.workspace.v1")');
  evaluate(`window.__learnRequests = []; const originalFetch = window.fetch; window.fetch = (...args) => { window.__learnRequests.push(String(args[0])); return originalFetch(...args); };`);
  click('Try a payment, step by step');
  assert.equal(evaluate('document.activeElement.id'), 'playground-title');
  audit(); fits();
  browser('screenshot', resolve(artifacts, 'learn-home-desktop.png'), '--full');

  for (const amount of [25, 50, 100]) {
    const output = { 25: '22.875', 50: '45.75', 100: '91.50' }[amount];
    click(`$${amount}`);
    click('Create demo invoice');
    click('Add demo dollars');
    assert.ok(text('.learn-quote').includes(`$${amount}.00`));
    assert.ok(text('.learn-quote').includes(`€${output}`));
    audit();
    click('Approve demo conversion');
    assert.ok(text('.learn-balances').includes(`€${output}`));
    click('Send demo payment');
    assert.ok(text('.learn-balances').includes('€0.00'));
    const paidBalances = text('.learn-balances');
    click('Match invoice & payment');
    assert.equal(text('.learn-balances'), paidBalances, 'Matching does not move funds');
    assert.ok(text('.learn-receipt').includes('Matched'));
    assert.ok(text('.learn-receipt').includes(`€${output}`));
    audit(); fits();
    assert.equal(evaluate('location.hash'), '#landing', 'Entire tutorial stays on Home');
    if (amount === 100) browser('screenshot', resolve(artifacts, 'learn-home-complete.png'), '--full');
    click('Start again');
  }
  assert.equal(evaluate('localStorage.getItem("clearline.workspace.v1")'), savedWorkspace, 'Tutorial does not change workspace records');
  assert.deepEqual(evaluate('window.__learnRequests'), [], 'Tutorial does not contact an API');
  click('Create demo invoice');
  click('Back a step');
  assert.ok(text('.learn-stage').includes('Create demo invoice'));
  click('Restart walkthrough');
  evaluate('document.querySelector(".learn-action").focus()');
  browser('press', 'Enter');
  assert.ok(text('.learn-stage').includes('Add demo dollars'), 'Keyboard can advance the tutorial');
  click('Restart walkthrough');
  for (const width of [320, 375, 768, 1024]) {
    browser('set', 'viewport', String(width), '900');
    fits(); audit();
  }
  browser('set', 'viewport', '375', '812');
  browser('screenshot', resolve(artifacts, 'learn-home-mobile.png'), '--full');
  for (const action of ['Create demo invoice', 'Add demo dollars', 'Approve demo conversion', 'Send demo payment', 'Match invoice & payment']) {
    click(action);
    fits(); audit();
  }
  assert.ok(text('.learn-receipt').includes('Matched'));
  click('Start again');
  browser('find', 'text', 'What is a wallet?', 'click', '--exact');
  assert.equal(evaluate('Array.from(document.querySelectorAll("details")).some(d => d.open && d.textContent.includes("delivery address"))'), true);
  browser('set', 'media', 'light', 'reduced-motion');
  assert.equal(evaluate('getComputedStyle(document.querySelector(".learn-stage-copy")).animationName'), 'none');
  click('Explore the simulation');
  browser('wait', '--text', 'Settlement overview');
  assert.equal(browser('errors').trim(), '');
  console.log('PASS homepage journey, three amounts, balances, matching, reset/back, keyboard, workspace/API isolation, responsive layouts and WCAG A/AA audits');
} finally {
  browser('close');
}
