import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, transition } from '../src/domain.ts';
import { parseImport, exportPayments } from '../src/csv.ts';
import { decodeState } from '../src/storage.ts';

const header = 'reference,counterparty,amount,currency\r\n';
test('CSV imports quoted commas, escaped quotes, CRLF and exact decimals', () => {
  const rows = parseImport('\uFEFF' + header + 'INV-1,"Acme, ""Europe""",123.456789,USDC\r\n', []);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].counterparty, 'Acme, "Europe"');
  assert.equal(rows[0].amount, '123.456789');
});
test('CSV rejects malformed quoting and unexpected columns', () => {
  for (const body of ['1,"Unclosed,10,USDC', '1,"Company"garbage,10,USDC', '1,Com"pany,10,USDC', '1,Company,10,USDC,extra']) {
    assert.throws(() => parseImport(header + body, []));
  }
});
test('CSV rejects unsupported currencies, missing headers and duplicate references', () => {
  assert.throws(() => parseImport(header + '1,Acme,10,EURC', []), /USDC/);
  assert.throws(() => parseImport('reference,amount\n1,10', []), /header/i);
  assert.throws(() => parseImport(header + 'one,A,10,USDC\nONE,B,20,USDC', []), /duplicate/i);
});
test('an invalid CSV row prevents partial results', () => {
  assert.throws(() => parseImport(header + '1,A,10,USDC\n2,B,1e3,USDC', []), /row 3/i);
});
test('CSV prevents duplicate references against existing payments', () => {
  const state = createInitialState();
  assert.throws(() => parseImport(header + 'inv-1041,Acme,10,USDC', state.payments), /duplicate/i);
});
test('delimiter-bearing blank records are rejected without discarding valid rows', () => {
  assert.throws(() => parseImport(header + 'GOOD,Acme,10,USDC\n,,,\n', []), /row 3/i);
  assert.equal(parseImport(header + '\nGOOD,Acme,10,USDC\n\n', []).length, 1);
});
test('persisted optional settlement metadata must match the payment lifecycle', () => {
  const ready = createInitialState();
  ready.payments[0].settledAt = 'invalid-date' as unknown as number;
  assert.throws(() => decodeState(JSON.stringify(ready)));
  const quoted = createInitialState();
  const payment = quoted.payments.find(p => p.status === 'quoted')!;
  payment.settlementId = 'SIM-ALREADY-EXECUTED';
  payment.settledAt = Date.now();
  assert.throws(() => decodeState(JSON.stringify(quoted)));
  const pending = createInitialState();
  pending.payments.find(p => p.status === 'pending')!.settledAt = Date.now();
  assert.throws(() => decodeState(JSON.stringify(pending)));
});
test('exports preserve exact amounts and neutralize spreadsheet formulas', () => {
  const state = transition(createInitialState(Date.now(), false), { type: 'create', input: {
    reference: '=SUM(1+1)', counterparty: '+supplier', amount: '2.123456', scenario: 'success',
  } });
  const csv = exportPayments(state.payments);
  assert.ok(csv.includes("'=SUM(1+1)"));
  assert.ok(csv.includes("'+supplier"));
  assert.ok(csv.includes('2.123456'));
  assert.ok(csv.includes('simulation'));
});
test('saved state survives JSON round-trip', () => {
  const state = createInitialState();
  assert.deepEqual(decodeState(JSON.stringify(state)), state);
});
test('saved state rejects corrupt JSON, unknown versions and invalid money', () => {
  for (const raw of ['broken', '{}', 'null', '{"version":2}']) assert.throws(() => decodeState(raw));
  const state = createInitialState();
  state.balances.USDC = 'NaN';
  assert.throws(() => decodeState(JSON.stringify(state)));
});
test('saved state rejects duplicate references and settled payments without quotes', () => {
  const state = createInitialState();
  state.payments[0].reference = state.payments[1].reference;
  assert.throws(() => decodeState(JSON.stringify(state)));
  const second = createInitialState();
  delete second.payments.find(p => p.status === 'settled')!.quote;
  assert.throws(() => decodeState(JSON.stringify(second)));
});
