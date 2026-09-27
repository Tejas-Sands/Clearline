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
