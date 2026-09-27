import { FEE, MAX_AMOUNT, RATE, SCENARIOS, STATUSES, UNIT } from './domain.ts';
import type { State } from './domain.ts';

export const STORAGE_KEY = 'clearline.workspace.v1';
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const money = (v: unknown): v is string => typeof v === 'string' && /^\d{1,24}$/.test(v);
const text = (v: unknown, limit: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= limit;
const time = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0 && v < 8_640_000_000_000_000;

export function decodeState(raw: string): State {
  const fail = () => { throw new Error('Saved workspace is unreadable or from an unsupported version. Export a backup or explicitly reset it.'); };
  let state: unknown;
  try { state = JSON.parse(raw); } catch { return fail(); }
  if (!isRecord(state) || state.version !== 1 || !isRecord(state.balances) || !money(state.balances.USDC) || !money(state.balances.EURC) || !Array.isArray(state.payments) || !Array.isArray(state.activity) || state.payments.length > 5000) return fail();
  const ids = new Set<string>(), references = new Set<string>();
  for (const p of state.payments) {
    if (!isRecord(p) || !text(p.id, 100) || !text(p.reference, 60) || !text(p.counterparty, 100) || !money(p.amount) || BigInt(p.amount) <= 0n || BigInt(p.amount) > MAX_AMOUNT || !SCENARIOS.includes(p.scenario as never) || !STATUSES.includes(p.status as never) || !time(p.createdAt) || !time(p.updatedAt)) return fail();
    if (ids.has(p.id) || references.has(p.reference.toLowerCase())) return fail();
    ids.add(p.id); references.add(p.reference.toLowerCase());
    if (p.quote !== undefined) {
      const q = p.quote;
      if (!isRecord(q) || q.fee !== FEE || q.rate !== RATE || !money(q.toAmount) || BigInt(q.toAmount) <= 0n || BigInt(q.toAmount) !== BigInt(p.amount) * BigInt(RATE) / UNIT || !time(q.expiresAt)) return fail();
    }
    if (p.status === 'ready' ? p.quote !== undefined : !p.quote) return fail();
    const submitted = ['settled', 'reconciled', 'unknown', 'pending'].includes(p.status as string);
    const final = ['settled', 'reconciled'].includes(p.status as string);
    if (submitted ? !text(p.settlementId, 100) : p.settlementId !== undefined) return fail();
    if (final ? !time(p.settledAt) : p.settledAt !== undefined) return fail();
    if (p.updatedAt < p.createdAt || (final && ((p.settledAt as number) < p.createdAt || (p.settledAt as number) > p.updatedAt))) return fail();
  }
  for (const a of state.activity) {
    if (!isRecord(a) || !text(a.id, 100) || !text(a.title, 200) || !text(a.detail, 1000) || !time(a.at) || !['info', 'warning', 'success'].includes(a.kind as string) || (a.paymentId !== undefined && (typeof a.paymentId !== 'string' || !ids.has(a.paymentId)))) return fail();
  }
  return state as State;
}
