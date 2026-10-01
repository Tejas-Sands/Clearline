import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../server/store.mjs';
import { sendJournaled } from '../server/journal.mjs';

test('a broadcast timeout is recoverable with the same signed transaction after disk reload', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'clearline-journal-'));
  try {
    const store = openStore(dir);
    const p = { id: 'p', transactions: [] }; store.state.payments.push(p);
    let signs = 0; let broadcasts = 0;
    const io = {
      sign: async () => { signs++; return { raw: '0x1234', hash: `0x${'ab'.repeat(32)}` }; },
      broadcast: async (raw) => {
        broadcasts++; assert.equal(raw, '0x1234');
        const saved = openStore(dir).state.payments[0];
        assert.equal(saved.transactions[0].raw, '0x1234');
        if (broadcasts === 1) throw new Error('RPC timeout after accepting transaction');
      },
    };
    await assert.rejects(sendJournaled(p, 'pay', 'arc', { to: 'recipient' }, io, store.save), /timeout/);
    const reloaded = openStore(dir);
    await sendJournaled(reloaded.state.payments[0], 'pay', 'arc', {}, io, reloaded.save);
    assert.equal(signs, 1); assert.equal(broadcasts, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('failure to persist a signature prevents broadcasting', async () => {
  let sent = false;
  await assert.rejects(sendJournaled({ transactions: [] }, 'pay', 'arc', {}, {
    sign: async () => ({ raw: '0x12', hash: '0xab' }), broadcast: async () => { sent = true; },
  }, () => { throw new Error('disk full'); }), /disk full/);
  assert.equal(sent, false);
});
test('already confirmed steps are never broadcast again', async () => {
  const result = await sendJournaled({ transactions: [{ step: 'pay', chain: 'arc', hash: '0xab', status: 'success' }] }, 'pay', 'arc', {}, {
    sign: async () => { throw new Error('duplicate signature'); }, broadcast: async () => { throw new Error('duplicate broadcast'); },
  }, () => {});
  assert.equal(result, '0xab');
});

test('a journal step cannot silently reuse an approval hash for a different transaction', async () => {
  const payment = { transactions: [] };
  const io = { sign: async () => ({ raw: '0x12', hash: '0xab' }), broadcast: async () => {} };
  await sendJournaled(payment, 'swap:1', 'arc', { to: '0x1111', data: '0x39509351' }, io, () => {});
  payment.transactions[0].status = 'success';
  await assert.rejects(sendJournaled(payment, 'swap:1', 'arc', { to: '0x2222', data: '0x12345678' }, io, () => {}), /different transaction/i);
});

test('an asynchronous signature checkpoint must complete before broadcast', async () => {
  let release;
  const checkpoint = new Promise<void>(resolve => { release = resolve; });
  let started;
  const saving = new Promise<void>(resolve => { started = resolve; });
  let broadcasts = 0;
  let saves = 0;
  const operation = sendJournaled({ transactions: [] }, 'pay', 'arc', {}, {
    sign: async () => ({ raw: '0x12', hash: '0xab' }),
    broadcast: async () => { broadcasts++; },
  }, () => { saves++; started(); return checkpoint; });
  await saving;
  try { assert.equal(broadcasts, 0, 'broadcast must wait for durable storage'); }
  finally { release(); await operation; }
  assert.equal(broadcasts, 1);
  assert.equal(saves, 2);
});

test('a rejected asynchronous checkpoint blocks broadcast and preserves the signature for recovery', async () => {
  const payment = { transactions: [] };
  let signs = 0;
  let broadcasts = 0;
  const io = {
    sign: async () => { signs++; return { raw: '0x12', hash: '0xab' }; },
    broadcast: async raw => { assert.equal(raw, '0x12'); broadcasts++; },
  };
  await assert.rejects(sendJournaled(payment, 'pay', 'arc', {}, io, () => {
    const failure = Promise.reject(new Error('database unavailable'));
    failure.catch(() => {}); // Keep the pre-fix implementation from leaking an unhandled rejection.
    return failure;
  }), /database unavailable/);
  assert.equal(broadcasts, 0);
  assert.equal(payment.transactions.length, 1);
  assert.equal(payment.transactions[0].status, 'signed');
  let persisted = false;
  await sendJournaled(payment, 'pay', 'arc', {}, {
    ...io, broadcast: async raw => { assert.equal(persisted, true); await io.broadcast(raw); },
  }, async () => { persisted = true; });
  assert.equal(signs, 1);
  assert.equal(broadcasts, 1);
});

test('failure to save the submitted state retains the original transaction for recovery', async () => {
  const payment = { transactions: [] };
  let signs = 0;
  let saves = 0;
  const io = {
    sign: async () => { signs++; return { raw: '0x12', hash: '0xab' }; },
    broadcast: async raw => { assert.equal(raw, '0x12'); },
  };
  await assert.rejects(sendJournaled(payment, 'pay', 'arc', {}, io, () => {
    if (++saves !== 2) return Promise.resolve();
    const failure = Promise.reject(new Error('submitted checkpoint failed'));
    failure.catch(() => {});
    return failure;
  }), /submitted checkpoint failed/);
  assert.equal(payment.transactions[0].status, 'submitted');
  await sendJournaled(payment, 'pay', 'arc', {}, io, async () => {});
  assert.equal(signs, 1);
});
