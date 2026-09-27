import test from 'node:test';
import assert from 'node:assert/strict';
import { makeService } from '../server/service.mjs';
const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
function fixture(overrides = {}) {
  const store = { state: { payments: [] }, account: { address: sender }, save() {} };
  const chain = { quote: async () => ({ expected: '822102', minimum: '813881', expiresAt: Date.now() + 60000, fees: [] }), swap: async p => { p.outputAmount = '822102'; p.transactions.push({ step: `swap:${p.attempt}`, status: 'success', chain: 'arc' }); return 822102n; }, pay: async () => {}, ...overrides };
  return { store, service: makeService(store, chain) };
}
test('real operation workflow requires conversion and verified payment before reconciliation', async () => {
  const { service } = fixture();
  const p = service.create({ reference: 'INV1', recipient, source: 'arc', amount: '1' });
  await service.act(p.id, 'quote');
  await assert.rejects(service.act(p.id, 'reconcile'));
  await service.act(p.id, 'swap'); assert.equal(p.status, 'converted');
  await service.act(p.id, 'pay'); assert.equal(p.status, 'paid');
  await assert.rejects(service.act(p.id, 'pay'));
  await service.act(p.id, 'reconcile'); assert.equal(p.status, 'reconciled');
});
test('unknown swap outcome blocks a second swap and recovers the original operation', async () => {
  let executions = 0;
  const { service } = fixture({
    swap: async p => { executions++; p.transactions.push({ step: 'swap:1', hash: '0xab', status: 'submitted', chain: 'arc' }); throw new Error('timeout'); },
    recoverSwap: async p => { p.outputAmount = '822102'; p.transactions[0].status = 'success'; return 822102n; },
  });
  const p = service.create({ reference: 'INV1', recipient, source: 'arc', amount: '1' });
  await service.act(p.id, 'quote'); await service.act(p.id, 'swap');
  assert.equal(p.status, 'swapping'); assert.match(p.error, /timeout/);
  await assert.rejects(service.act(p.id, 'swap'));
  await service.act(p.id, 'recover'); assert.equal(p.status, 'converted'); assert.equal(executions, 1);
});
test('quote failure preserves funding and duplicate references are rejected', async () => {
  const { service } = fixture({ quote: async () => { throw new Error('No liquidity'); } });
  const p = service.create({ reference: 'INV1', recipient, source: 'arc', amount: '1' });
  assert.throws(() => service.create({ reference: 'inv1', recipient, source: 'arc', amount: '1' }));
  await service.act(p.id, 'quote'); assert.equal(p.status, 'funded'); assert.match(p.error, /liquidity/);
});
test('concurrent mutation is rejected while a transaction is in flight', async () => {
  let release; const pending = new Promise(resolve => { release = resolve; });
  const { service } = fixture({ quote: async () => { await pending; return { expiresAt: Date.now() + 60000 }; } });
  const p = service.create({ reference: 'INV1', recipient, source: 'arc', amount: '1' });
  const work = service.act(p.id, 'quote');
  await assert.rejects(service.act(p.id, 'quote'), /progress/);
  release(); await work;
});

test('resolved SDK call without a verified swap never marks a payment converted', async () => {
  const { service } = fixture({ swap: async () => null });
  const p = service.create({ reference: 'EMPTY', recipient, source: 'arc', amount: '1' });
  await service.act(p.id, 'quote'); await service.act(p.id, 'swap');
  assert.equal(p.status, 'funded');
  assert.match(p.error, /verified swap/i);
  await assert.rejects(service.act(p.id, 'pay'));
});

test('unverified journal output remains recoverable and cannot authorize payout', async () => {
  const { service } = fixture({ swap: async p => {
    p.transactions.push({ step: 'swap:1', chain: 'arc', status: 'submitted' });
    p.outputAmount = '822102'; return 822102n;
  } });
  const p = service.create({ reference: 'UNVERIFIED', recipient, source: 'arc', amount: '1' });
  await service.act(p.id, 'quote'); await service.act(p.id, 'swap');
  assert.equal(p.status, 'swapping');
  await assert.rejects(service.act(p.id, 'pay'));
});

test('explicit bridge retry completes a failed destination mint without a new source burn', async () => {
  let retries = 0;
  const { service } = fixture({ retryBridge: async p => { retries++; p.fundedAmount = '990000'; return true; } });
  const p = service.create({ reference: 'BRIDGE-RETRY', recipient, source: 'base', amount: '1' });
  p.status = 'bridging';
  p.transactions.push({ step: 'burn', status: 'success', hash: 'original-burn' }, { step: 'mint', status: 'reverted' });
  await service.act(p.id, 'retry');
  assert.equal(p.status, 'funded'); assert.equal(retries, 1);
  assert.equal(p.transactions.filter(t => t.step === 'burn').length, 1);
  assert.equal(p.transactions[0].hash, 'original-burn');
});
