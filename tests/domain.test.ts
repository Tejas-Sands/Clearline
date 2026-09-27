import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUnits, formatUnits, createInitialState, transition } from '../src/domain.ts';

const NOW = Date.parse('2026-09-27T09:00:00Z');
const blank = () => createInitialState(NOW, false);
function quoted(amount = '100', scenario = 'success') {
  let state = transition(blank(), { type: 'create', input: { reference: 'INV-TEST', counterparty: 'Test supplier', amount, scenario } }, NOW);
  const id = state.payments[0].id;
  state = transition(state, { type: 'quote', id }, NOW);
  return { state, id };
}

test('money preserves all six decimal places without float rounding', () => {
  assert.equal(parseUnits('123456789.123456'), 123456789123456n);
  assert.equal(parseUnits('0.000001'), 1n);
  assert.equal(formatUnits('123456789123456'), '123456789.123456');
  assert.equal(formatUnits('1'), '0.000001');
});
test('money rejects signs, exponent notation, zero, overprecision and excessive amounts', () => {
  for (const value of ['-1', '+1', '1e3', 'NaN', '0', '0.0000001', '1,000', '', '1000000000.000001']) {
    assert.throws(() => parseUnits(value));
  }
});
test('approval debits source plus fee and credits the exact floor-rounded target', () => {
  const { state, id } = quoted('100.000001');
  const done = transition(state, { type: 'execute', id }, NOW + 1000);
  assert.equal(BigInt(state.balances.USDC) - BigInt(done.balances.USDC), 100250001n);
  assert.equal(done.balances.EURC, '91500000');
  assert.equal(done.payments[0].status, 'settled');
});
test('a duplicate approval cannot debit a settled payment twice', () => {
  const { state, id } = quoted();
  const done = transition(state, { type: 'execute', id }, NOW + 1000);
  assert.throws(() => transition(done, { type: 'execute', id }, NOW + 2000), /already|status|quote/i);
  assert.equal(done.balances.EURC, '91500000');
});
test('quote expires at precisely 60 seconds without any debit', () => {
  const { state, id } = quoted();
  assert.throws(() => transition(state, { type: 'execute', id }, NOW + 60000), /expired/i);
  assert.equal(state.balances.USDC, '250000000000');
});
test('insufficient funds creates a recoverable exception with no debit', () => {
  const { state, id } = quoted('300000');
  const failed = transition(state, { type: 'execute', id }, NOW + 1000);
  assert.equal(failed.payments[0].status, 'needs_funds');
  assert.equal(failed.balances.USDC, state.balances.USDC);
  const funded = transition(failed, { type: 'fund', amount: '100000' }, NOW + 2000);
  const refreshed = transition(funded, { type: 'quote', id }, NOW + 3000);
  assert.equal(transition(refreshed, { type: 'execute', id }, NOW + 4000).payments[0].status, 'settled');
});
test('unknown result reserves funds and must be checked instead of resubmitted', () => {
  const { state, id } = quoted('100', 'unknown');
  const unknown = transition(state, { type: 'execute', id }, NOW + 1000);
  assert.equal(unknown.payments[0].status, 'unknown');
  assert.equal(unknown.balances.EURC, '0');
  assert.throws(() => transition(unknown, { type: 'quote', id }, NOW + 2000));
  assert.throws(() => transition(unknown, { type: 'execute', id }, NOW + 2000));
  const resolved = transition(unknown, { type: 'check', id }, NOW + 3000);
  assert.equal(resolved.payments[0].status, 'settled');
  assert.equal(resolved.balances.USDC, unknown.balances.USDC);
  assert.equal(resolved.balances.EURC, '91500000');
  assert.throws(() => transition(resolved, { type: 'check', id }, NOW + 4000));
});
test('pending counterparty funding can resolve exactly once', () => {
  const { state, id } = quoted('100', 'delayed');
  const pending = transition(state, { type: 'execute', id }, NOW + 1000);
  assert.equal(pending.payments[0].status, 'pending');
  assert.equal(transition(pending, { type: 'check', id }, NOW + 2000).balances.EURC, '91500000');
});
test('reconciliation requires settlement and never alters balances', () => {
  const { state, id } = quoted();
  assert.throws(() => transition(state, { type: 'reconcile', id }, NOW + 1000));
  const settled = transition(state, { type: 'execute', id }, NOW + 1000);
  const reconciled = transition(settled, { type: 'reconcile', id }, NOW + 2000);
  assert.equal(reconciled.payments[0].status, 'reconciled');
  assert.deepEqual(reconciled.balances, settled.balances);
  assert.throws(() => transition(reconciled, { type: 'reconcile', id }, NOW + 3000));
});
test('duplicate references are rejected case-insensitively before import commits', () => {
  const { state } = quoted();
  assert.throws(() => transition(state, { type: 'import', inputs: [
    { reference: 'NEW', counterparty: 'New supplier', amount: '25', scenario: 'success' },
    { reference: ' inv-test ', counterparty: 'Duplicate', amount: '30', scenario: 'success' },
  ] }, NOW), /duplicate/i);
  assert.equal(state.payments.length, 1);
});
test('invalid scenario and empty counterparty do not create a payment', () => {
  assert.throws(() => transition(blank(), { type: 'create', input: { reference: 'R', counterparty: '', amount: '10', scenario: 'success' } }, NOW));
  assert.throws(() => transition(blank(), { type: 'create', input: { reference: 'R', counterparty: 'Acme', amount: '10', scenario: 'invalid' } }, NOW));
});
test('seeded workspace contains useful settled, pending and exception examples', () => {
  const state = createInitialState(NOW);
  assert.ok(state.payments.length >= 8);
  assert.ok(state.payments.some(p => p.status === 'settled'));
  assert.ok(state.payments.some(p => p.status === 'unknown'));
  assert.ok(BigInt(state.balances.USDC) >= 0n);
});
