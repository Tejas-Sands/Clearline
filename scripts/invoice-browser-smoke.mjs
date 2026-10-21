// Synthetic rendering checks: no network, signer, wallet, or browser IPC.
// Run with: node scripts/invoice-browser-smoke.mjs --render-only
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { renderToStaticMarkup } from 'react-dom/server';

if (!process.argv.includes('--render-only')) throw new Error('Use --render-only. Browser IPC is unavailable in this sandbox.');
const file = resolve('src/components/TestnetPayments.tsx');
const source = (await readFile(file, 'utf8')).replace(
  "import { downloadFile } from '../csv.ts';",
  'const downloadFile = (...args) => globalThis.__invoiceDownload(...args);',
).replace(
  "import { useEffect, useState, type ReactNode } from 'react';",
  "import type { ReactNode } from 'react'; const useEffect = () => {}; const useState = (...args) => globalThis.__invoiceUseState(...args);",
);
const result = await build({ stdin: { contents: source, loader: 'tsx', resolveDir: dirname(file) }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', write: false });
const folder = await mkdtemp(join(tmpdir(), 'clearline-invoice-ui-'));
try {
  const modulePath = join(folder, 'component.mjs');
  await writeFile(modulePath, result.outputFiles[0].text);
  const { TestnetPayments } = await import(pathToFileURL(modulePath).href);
  const sender = '0x0000000000000000000000000000000000000001';
  const recipient = '0x0000000000000000000000000000000000000002';
  const payment = { id: 'invoice-1', reference: 'EXACT-001', sender, recipient, amount: '1000000', targetAmount: '800000', paymentAmount: '800000', surplusAmount: '100000', outputAmount: '900000', source: 'arc', status: 'converted', createdAt: 1, transactions: [], events: [] };
  let tree;
  let updates;
  function render(record, { form = false, mode = 'exact', amount = '1.00', target = '0.80', source = 'arc' } = {}) {
    let call = 0;
    updates = [];
    globalThis.__invoiceUseState = initial => {
      const index = call++;
      const snapshot = { token: 'synthetic', sender, defaultRecipient: recipient, payments: [record], busy: null, balanceCheckedAt: null, balances: null };
      // Existing component hooks precede the added invoice hooks. Override only UI state.
      const overrides = { 0: 'synthetic-session', 1: snapshot, 6: form, 8: recipient, 9: amount, 10: source, 13: mode, 14: target };
      const value = Object.hasOwn(overrides, index) ? overrides[index] : typeof initial === 'function' ? initial() : initial;
      return [value, value => updates.push({ index, value })];
    };
    tree = TestnetPayments();
    return renderToStaticMarkup(tree);
  }
  function findElement(predicate, node) {
    if (arguments.length < 2) node = tree;
    if (Array.isArray(node)) return node.flatMap(child => findElement(predicate, child));
    if (!node || typeof node !== 'object' || !node.props) return [];
    return [...(predicate(node) ? [node] : []), ...findElement(predicate, node.props.children)];
  }
  const submit = () => findElement(node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path, options = {}) => {
    if (options.method === 'POST') {
      requests.push(JSON.parse(options.body));
      return Response.json(payment);
    }
    return Response.json({ payments: [payment], sender, defaultRecipient: recipient, busy: null, balances: null });
  };
  let csv;
  globalThis.__invoiceDownload = (_name, text) => { csv = text; };
  const converted = render(payment);
  assert.match(converted, /Invoice target/);
  assert.match(converted, /Send 0\.80 test EURC to recipient/);
  assert.doesNotMatch(converted, /Send 0\.90 test EURC to recipient/);
  assert.match(converted, /Surplus kept in source wallet/);
  assert.match(converted, /0\.10 EURC/);
  const micro = render({ ...payment, targetAmount: '1', paymentAmount: '1', surplusAmount: '899999' });
  assert.match(micro, /Send 0\.000001 test EURC to recipient/);
  assert.match(micro, /0\.899999 EURC/);
  const quoted = render({ ...payment, status: 'quoted', outputAmount: undefined, paymentAmount: undefined, surplusAmount: undefined, quote: { expected: '900000', minimum: '790000', expiresAt: Date.now() + 60000, fees: [] } });
  assert.match(quoted, /minimum.*cannot cover|minimum.*below.*target/i);
  assert.match(quoted, /<button[^>]*disabled=""[^>]*>[^<]*(?:<[^>]*>.*?<\/[^>]*>)*Approve conversion to EURC/);
  const legacy = render({ ...payment, reference: 'LEGACY-001', targetAmount: undefined, paymentAmount: undefined, surplusAmount: undefined });
  assert.match(legacy, /Legacy.*full converted output/i);
  assert.match(legacy, /Send 0\.90 test EURC to recipient/);
  assert.doesNotMatch(legacy, /Invoice target/);
  const form = render(payment, { form: true });
  assert.match(form, /Exact EURC invoice/);
  assert.match(form, /Invoice amount.*test EURC/);
  assert.match(form, /pattern="/);
  assert.match(form, /0\.80/);
  assert.match(form, /additional.*fees|fees.*additional/i);
  render(payment, { form: true });
  await submit();
  assert.equal(requests.at(-1).targetAmount, '0.80', 'Exact form submits decimal target');
  assert.equal(requests.at(-1).amount, '1.00', 'Full source input remains selected');
  render(payment, { form: true, mode: 'legacy', target: 'not a target' });
  await submit();
  assert.equal(Object.hasOwn(requests.at(-1), 'targetAmount'), false, 'Legacy form omits target');
  render(payment, { form: true, source: 'base' });
  await submit();
  assert.equal(requests.at(-1).source, 'base');
  assert.equal(requests.at(-1).targetAmount, '0.80', 'Base form preserves target');
  const submitted = requests.length;
  for (const target of ['0', '-1', '1e2', '1.0000001', '100.000001']) {
    render(payment, { form: true, target });
    await submit();
    assert.equal(requests.length, submitted, `Invalid target ${target} submits no request`);
    assert.equal(updates.some(update => /EURC invoice/.test(update.value)), true);
  }
  render(payment, { form: true, source: 'base', amount: '0.01' });
  await submit();
  assert.equal(requests.length, submitted, 'Base amount must exceed bridge fee floor');
  assert.equal(updates.some(update => /more than 0.01/.test(update.value)), true);
  render({ ...payment, status: 'reconciled' });
  findElement(node => node.type === 'button' && node.props.onClick?.name === 'exportCsv')[0].props.onClick();
  const csvRows = csv.split('\r\n').map(row => row.split(',').map(cell => cell.slice(1, -1)));
  assert.equal(csvRows[0][5], 'eurc_paid', 'Existing CSV column order is preserved');
  assert.equal(csvRows[1][5], '0.80', 'CSV recipient payment excludes surplus');
  assert.deepEqual(csvRows[0].slice(-3), ['target_eurc', 'actual_output_eurc', 'surplus_eurc']);
  assert.deepEqual(csvRows[1].slice(-3), ['0.80', '0.90', '0.10']);
  render({ ...payment, status: 'paid', targetAmount: undefined, paymentAmount: undefined, surplusAmount: undefined });
  findElement(node => node.type === 'button' && node.props.onClick?.name === 'exportCsv')[0].props.onClick();
  assert.equal(csv.split('\r\n')[1].split(',')[5], '"0.90"', 'Legacy CSV preserves full-output payment');
  globalThis.fetch = originalFetch;
  console.log('PASS synthetic SSR and event handlers: exact/legacy/Base form contracts, validation, payout and CSV accounting; display: exact payout and surplus, inadequate minimum blocks conversion, legacy output, exact invoice form');
} finally {
  delete globalThis.__invoiceUseState;
  delete globalThis.__invoiceDownload;
  await rm(folder, { recursive: true, force: true });
}
