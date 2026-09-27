export const UNIT = 1_000_000n;
export const MAX_AMOUNT = 1_000_000_000n * UNIT;
export const RATE = '915000';
export const FEE = '250000';
export const QUOTE_LIFETIME = 60_000;
export const STATUSES = ['ready', 'quoted', 'pending', 'unknown', 'needs_funds', 'settled', 'reconciled'] as const;
export const SCENARIOS = ['success', 'delayed', 'unknown'] as const;
export type Status = typeof STATUSES[number];
export type Scenario = typeof SCENARIOS[number];
export type PaymentInput = { reference: string; counterparty: string; amount: string; scenario: Scenario };
export type Quote = { rate: string; fee: string; toAmount: string; expiresAt: number };
export type Payment = {
  id: string; reference: string; counterparty: string; amount: string; scenario: Scenario;
  status: Status; createdAt: number; updatedAt: number; settledAt?: number;
  quote?: Quote; settlementId?: string;
};
export type Activity = { id: string; paymentId?: string; title: string; detail: string; at: number; kind: 'success' | 'warning' | 'info' };
export type State = { version: 1; balances: { USDC: string; EURC: string }; payments: Payment[]; activity: Activity[] };
export type Action =
  | { type: 'create'; input: PaymentInput }
  | { type: 'import'; inputs: PaymentInput[] }
  | { type: 'quote' | 'execute' | 'check' | 'reconcile'; id: string }
  | { type: 'fund'; amount: string };

export function parseUnits(value: string): bigint {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,6})?$/.test(value.trim()) || value.length > 32) {
    throw new Error('Enter a positive amount with up to 6 decimal places.');
  }
  const [whole, fraction = ''] = value.trim().split('.');
  const units = BigInt(whole) * UNIT + BigInt(fraction.padEnd(6, '0'));
  if (units <= 0n || units > MAX_AMOUNT) throw new Error('Amount must be greater than 0 and at most 1,000,000,000.');
  return units;
}

export function formatUnits(units: string | bigint): string {
  const value = BigInt(units);
  return `${value / UNIT}.${(value % UNIT).toString().padStart(6, '0')}`;
}

// Display uses integer arithmetic too; expand precision when cents would hide value.
export function displayMoney(units: string | bigint, precise = false): string {
  const [whole, fraction] = formatUnits(units).split('.');
  const digits = precise || /[1-9]/.test(fraction.slice(2)) ? fraction.replace(/0+$/, '').padEnd(2, '0') : fraction.slice(0, 2);
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${digits}`;
}

export function validateInput(input: PaymentInput): PaymentInput {
  const reference = input.reference.trim();
  const counterparty = input.counterparty.trim();
  if (!reference || reference.length > 60 || /[\r\n\t]/.test(reference)) throw new Error('Reference is required and must be at most 60 characters, on one line.');
  if (!counterparty || counterparty.length > 100 || /[\r\n\t]/.test(counterparty)) throw new Error('Counterparty is required and must be at most 100 characters, on one line.');
  if (!SCENARIOS.includes(input.scenario)) throw new Error('Choose a supported simulation scenario.');
  parseUnits(input.amount);
  return { ...input, reference, counterparty };
}

function record(state: State, at: number, title: string, detail: string, kind: Activity['kind'] = 'info', paymentId?: string) {
  state.activity.unshift({ id: crypto.randomUUID(), at, title, detail, kind, paymentId });
}

export function transition(current: State, action: Action, now = Date.now()): State {
  // Never partially mutate caller state when a later validation fails.
  const state = structuredClone(current);
  if (action.type === 'fund') {
    const amount = parseUnits(action.amount);
    state.balances.USDC = (BigInt(state.balances.USDC) + amount).toString();
    record(state, now, 'Demo funds added', `${displayMoney(amount)} USDC added to the simulated balance.`, 'success');
    return state;
  }
  if (action.type === 'create' || action.type === 'import') {
    const inputs = action.type === 'create' ? [action.input] : action.inputs;
    if (!inputs.length || inputs.length > 500) throw new Error('Import between 1 and 500 payments at a time.');
    if (state.payments.length + inputs.length > 5000) throw new Error('This demo supports up to 5,000 payments. Export and reset to start a new workspace.');
    const seen = new Set(state.payments.map(p => p.reference.toLowerCase()));
    for (const raw of inputs) {
      const input = validateInput(raw);
      const key = input.reference.toLowerCase();
      if (seen.has(key)) throw new Error(`Duplicate invoice reference: ${input.reference}. No payments were imported.`);
      seen.add(key);
      const payment: Payment = { id: crypto.randomUUID(), ...input, amount: parseUnits(input.amount).toString(), status: 'ready', createdAt: now, updatedAt: now };
      state.payments.unshift(payment);
      record(state, now, 'Payment created', `${payment.reference} · ${payment.counterparty}`, 'info', payment.id);
    }
    return state;
  }
  const payment = state.payments.find(p => p.id === action.id);
  if (!payment) throw new Error('Payment not found. Reload the workspace.');
  const describe = `${payment.reference} · ${payment.counterparty}`;
  if (action.type === 'quote') {
    if (!['ready', 'quoted', 'needs_funds'].includes(payment.status)) throw new Error('This payment is already submitted. Check its status instead of requesting a new quote.');
    const toAmount = BigInt(payment.amount) * BigInt(RATE) / UNIT;
    if (toAmount === 0n) throw new Error('Amount is too small to receive 0.000001 EURC at this demo rate.');
    payment.quote = { rate: RATE, fee: FEE, toAmount: toAmount.toString(), expiresAt: now + QUOTE_LIFETIME };
    payment.status = 'quoted';
    record(state, now, 'Quote ready for approval', `${describe} · valid for 60 seconds.`, 'info', payment.id);
  } else if (action.type === 'execute') {
    if (payment.status !== 'quoted' || !payment.quote) throw new Error('An active quote is required. This payment may already be submitted.');
    if (now >= payment.quote.expiresAt) throw new Error('Quote expired. Request a fresh quote before approving.');
    const debit = BigInt(payment.amount) + BigInt(payment.quote.fee);
    if (BigInt(state.balances.USDC) < debit) {
      payment.status = 'needs_funds';
      record(state, now, 'Insufficient funds', `${describe} · add demo funds, then request a fresh quote. No debit occurred.`, 'warning', payment.id);
    } else {
      state.balances.USDC = (BigInt(state.balances.USDC) - debit).toString();
      payment.settlementId = `SIM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      if (payment.scenario === 'success') {
        payment.status = 'settled';
        payment.settledAt = now;
        state.balances.EURC = (BigInt(state.balances.EURC) + BigInt(payment.quote.toAmount)).toString();
        record(state, now, 'Settlement confirmed', `${describe} · ${displayMoney(payment.quote.toAmount)} EURC received.`, 'success', payment.id);
      } else {
        payment.status = payment.scenario === 'unknown' ? 'unknown' : 'pending';
        record(state, now, payment.status === 'unknown' ? 'Outcome needs verification' : 'Awaiting counterparty', `${describe} · source funds reserved. Check status before taking further action.`, 'warning', payment.id);
      }
    }
  } else if (action.type === 'check') {
    if (!['pending', 'unknown'].includes(payment.status) || !payment.quote) throw new Error('Only unresolved settlements can be checked.');
    payment.status = 'settled';
    payment.settledAt = now;
    state.balances.EURC = (BigInt(state.balances.EURC) + BigInt(payment.quote.toAmount)).toString();
    record(state, now, 'Settlement verified', `${describe} · simulated status check confirmed receipt. No second debit.`, 'success', payment.id);
  } else if (action.type === 'reconcile') {
    if (payment.status !== 'settled') throw new Error('Only settled, unreconciled payments can be reconciled.');
    payment.status = 'reconciled';
    record(state, now, 'Payment reconciled', `${describe} · matched to its obligation in the local demo ledger.`, 'success', payment.id);
  }
  payment.updatedAt = now;
  return state;
}

export function createInitialState(now = Date.now(), seed = true): State {
  let state: State = { version: 1, balances: { USDC: '250000000000', EURC: '0' }, payments: [], activity: [] };
  if (!seed) return state;
  const examples: Array<[string, string, string, Scenario, 'ready' | 'quoted' | 'execute' | 'reconcile']> = [
    ['INV-1041', 'Forma Studio', '8400', 'success', 'reconcile'],
    ['INV-1042', 'Orbit Logistics', '18250', 'success', 'reconcile'],
    ['INV-1043', 'Meridian Supply', '12680', 'success', 'reconcile'],
    ['INV-1044', 'Atlas Systems', '32400', 'success', 'execute'],
    ['INV-1045', 'Northstar Labs', '9600', 'success', 'execute'],
    ['INV-1046', 'Studio Koto', '4250', 'delayed', 'execute'],
    ['INV-1047', 'Loom Technologies', '7800', 'unknown', 'execute'],
    ['INV-1048', 'Aperture Group', '18500', 'success', 'quoted'],
    ['INV-1049', 'Fieldwork Co.', '6250', 'success', 'ready'],
  ];
  examples.forEach(([reference, counterparty, amount, scenario, target], i) => {
    const at = now - (examples.length - i) * 14 * 60 * 60 * 1000;
    state = transition(state, { type: 'create', input: { reference, counterparty, amount, scenario } }, at);
    const id = state.payments[0].id;
    if (target !== 'ready') state = transition(state, { type: 'quote', id }, at + 1000);
    if (target === 'execute' || target === 'reconcile') state = transition(state, { type: 'execute', id }, at + 2000);
    if (target === 'reconcile') state = transition(state, { type: 'reconcile', id }, at + 3000);
  });
  return state;
}

export const STATUS_LABELS: Record<Status, string> = { ready: 'Ready to quote', quoted: 'Awaiting approval', pending: 'Awaiting counterparty', unknown: 'Check required', needs_funds: 'Needs funds', settled: 'Settled', reconciled: 'Reconciled' };
export const isFinal = (p: Payment) => p.status === 'settled' || p.status === 'reconciled';
export const needsAttention = (p: Payment, now = Date.now()) => p.status === 'unknown' || p.status === 'needs_funds' || (p.status === 'quoted' && !!p.quote && p.quote.expiresAt <= now);
