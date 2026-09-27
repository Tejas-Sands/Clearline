import { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCheck, CircleAlert, Clock3, Layers3, Plus, Wallet } from 'lucide-react';
import { displayMoney, isFinal, needsAttention } from '../domain.ts';
import type { Payment, State } from '../domain.ts';
import { PaymentTable } from './PaymentTable.tsx';
import { TextLink } from './ui.tsx';

export function Overview({ state, now, onSelect, onPayments, onAttention, onReconcile, onFund }: { state: State; now: number; onSelect: (p: Payment) => void; onPayments: () => void; onAttention: () => void; onReconcile: () => void; onFund: () => void }) {
  const settled = state.payments.filter(isFinal);
  const volume = settled.reduce((sum, p) => sum + BigInt(p.amount), 0n);
  const open = state.payments.filter(p => !isFinal(p));
  const attention = state.payments.filter(p => needsAttention(p, now));
  const matched = settled.filter(p => p.status === 'reconciled');
  return <>
    <div className="metric-grid">
      <div className="metric-card"><div className="metric-label">Settled volume <span className="metric-icon"><ArrowUpRight size={16} /></span></div><div className="metric-value"><span className="metric-symbol">$</span>{displayMoney(volume)}</div><div className="metric-note"><span className="positive"><CheckCheck size={13} />{settled.length} confirmed</span><span>USDC source · all time</span></div></div>
      <div className="metric-card"><div className="metric-label">In progress <span className="metric-icon"><Clock3 size={16} /></span></div><div className="metric-value">{open.length.toString().padStart(2, '0')}<span className="metric-unit">payments</span></div><div className="metric-note">From quote to final settlement</div></div>
      <button className="metric-card interactive" onClick={onAttention}><div className="metric-label">Needs attention <span className="metric-icon amber"><CircleAlert size={16} /></span></div><div className="metric-value">{attention.length.toString().padStart(2, '0')}<span className="metric-unit">exceptions</span></div><div className="metric-note"><span className="attention-text">Review the exception queue</span><ArrowRight size={14} /></div></button>
      <button className="metric-card interactive" onClick={onReconcile}><div className="metric-label">Reconciled <span className="metric-icon"><CheckCheck size={16} /></span></div><div className="metric-value">{settled.length ? Math.round(matched.length / settled.length * 100) : 0}<span className="metric-symbol">%</span></div><div className="metric-note"><span className="mini-progress"><span style={{ width: `${settled.length ? matched.length / settled.length * 100 : 0}%` }} /></span>{matched.length} of {settled.length} settled</div></button>
    </div>
    <div className="overview-grid"><VolumeChart payments={settled} now={now} /><section className="balance-card"><div className="section-heading"><span className="eyebrow">YOUR TREASURY</span><Wallet size={19} /></div><p className="balance-label">Available to settle</p><div className="balance-amount">${displayMoney(state.balances.USDC)}</div><div className="balance-currency"><span className="currency-mini">$</span>USDC<span className="balance-network">Simulated Arc balance</span></div><div className="balance-divider" /><div className="received-balance"><span>EURC received</span><strong>€{displayMoney(state.balances.EURC)}</strong></div><button className="button balance-button" onClick={onFund}><Plus size={16} />Add demo funds</button><div className="balance-caption"><span className="tiny-dot" />Local simulation · no real funds</div></section></div>
    {attention.length > 0 && <div className="attention-banner"><div><span className="attention-circle"><CircleAlert size={18} /></span><span><strong>{attention.length} payments could use a closer look.</strong><span> Resolve expired quotes and uncertain outcomes before continuing.</span></span></div><button onClick={onAttention}>Review exceptions <ArrowRight size={16} /></button></div>}
    <section className="panel payments-panel"><div className="panel-header"><div><h2>Recent payments</h2><p>Every obligation, from first quote to final match.</p></div><TextLink onClick={onPayments}>View all payments</TextLink></div><PaymentTable payments={state.payments} onSelect={onSelect} compact now={now} /></section>
    <div className="overview-bottom"><Layers3 size={15} /><span>One corridor. Full visibility.</span><span className="subtle">USDC → EURC · Quote, settle, reconcile.</span><span className="overview-bottom-right">All workspace data is synthetic.</span></div>
  </>;
}

function VolumeChart({ payments, now }: { payments: Payment[]; now: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today); date.setDate(date.getDate() - (6 - i));
    const next = new Date(date); next.setDate(next.getDate() + 1);
    return { date, value: payments.filter(p => p.settledAt! >= date.getTime() && p.settledAt! < next.getTime()).reduce((sum, p) => sum + BigInt(p.amount), 0n) };
  });
  const sum = days.reduce((s, d) => s + d.value, 0n);
  const max = days.reduce((m, d) => d.value > m ? d.value : m, 1n);
  return <section className="panel volume-panel"><div className="panel-header"><div><h2>Settlement activity</h2><p>USDC converted across the last 7 days</p></div><span className="period-pill">Last 7 days</span></div><div className="chart-topline"><strong>${displayMoney(selected === null ? sum : days[selected].value)}</strong><span><span className="legend-dot" />{selected === null ? 'Settled source volume' : days[selected].date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span></div>
    <div className="chart" role="group" aria-label="Daily settled USDC volume"><div className="chart-grid-lines"><span /><span /><span /></div>{days.map((day, i) => <button className={`chart-column ${selected === i ? 'selected' : ''}`} key={day.date.toISOString()} onClick={() => setSelected(selected === i ? null : i)} aria-pressed={selected === i} aria-label={`${day.date.toLocaleDateString('en')}: ${displayMoney(day.value)} USDC settled`}><span className="bar-area"><span className="chart-bar" style={{ height: `${Math.max(2, Number(day.value * 100n / max))}%` }}><span className="bar-cap" /></span></span><span className="chart-label">{day.date.toLocaleDateString('en', { weekday: 'short' })}</span></button>)}</div>
  </section>;
}
