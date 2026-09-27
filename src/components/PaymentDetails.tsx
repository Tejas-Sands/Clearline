import { useState } from 'react';
import { ArrowRight, CheckCheck, Clock3, CircleAlert, RefreshCw, ShieldCheck } from 'lucide-react';
import { displayMoney, formatUnits, isFinal } from '../domain.ts';
import type { Action, Activity, Payment } from '../domain.ts';
import { StatusBadge, formatDate } from './ui.tsx';

export function PaymentDetails({ payment: p, activity, now, onAction, onFund }: { payment: Payment; activity: Activity[]; now: number; onAction: (action: Action) => void; onFund: () => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expired = !!p.quote && p.quote.expiresAt <= now;
  const seconds = p.quote ? Math.max(0, Math.ceil((p.quote.expiresAt - now) / 1000)) : 0;
  async function run(type: 'quote' | 'execute' | 'check' | 'reconcile') {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      onAction({ type, id: p.id });
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  const events = activity.filter(a => a.paymentId === p.id);
  return <div className="detail-body">
    <div className="detail-summary"><StatusBadge payment={p} now={now} /><span className="mono">{p.reference}</span><h3>{displayMoney(p.amount)} <span>USDC</span></h3><p>Conversion obligation for {p.counterparty}</p></div>
    <div className="conversion-card"><div><span className="currency-icon usd">$</span><span><small>You send</small><strong>{displayMoney(p.amount)} <em>USDC</em></strong></span></div><span className="conversion-arrow"><ArrowRight size={18} /></span><div><span className="currency-icon eur">€</span><span><small>You receive</small><strong>{p.quote ? displayMoney(p.quote.toAmount) : '—'} <em>EURC</em></strong></span></div></div>
    <dl className="detail-facts"><div><dt>Settlement venue</dt><dd>Arc / simulated StableFX</dd></div><div><dt>Demo exchange rate</dt><dd>1 USDC = 0.915000 EURC</dd></div><div><dt>Simulated service fee</dt><dd>{p.quote ? displayMoney(p.quote.fee) : '0.25'} USDC</dd></div>{p.quote && <div><dt>Total source debit</dt><dd>{displayMoney(BigInt(p.amount) + BigInt(p.quote.fee))} USDC</dd></div>}<div><dt>Created</dt><dd>{formatDate(p.createdAt, true)}</dd></div>{p.settlementId && <div><dt>Simulation receipt</dt><dd className="mono">{p.settlementId}</dd></div>}</dl>
    <p className="form-hint">Fixed demo pricing, not a market quote or an estimate of Arc gas. EURC stays in your simulated treasury; beneficiary payout is outside this prototype.</p>
    {p.status === 'quoted' && <div className={`notice ${expired ? 'warning' : ''}`}><Clock3 size={19} /><span>{expired ? 'This quote has expired. Refresh it before approving.' : `Quote valid for ${seconds}s. Total debit includes the 0.25 USDC demo fee.`}</span></div>}
    {p.status === 'unknown' && <div className="notice warning"><CircleAlert size={20} /><span><strong>The response was uncertain.</strong> Source funds were reserved. Verify the existing settlement; resubmission is blocked to prevent a duplicate debit.</span></div>}
    {p.status === 'pending' && <div className="notice"><Clock3 size={20} /><span>Waiting for counterparty funding. The demo status check will complete this settlement without debiting USDC again.</span></div>}
    {p.status === 'needs_funds' && <div className="notice warning"><CircleAlert size={20} /><span><strong>Not enough available USDC.</strong> No debit occurred. Add demo funds, then request a fresh quote.</span></div>}
    {isFinal(p) && <div className="notice success"><ShieldCheck size={20} /><span>{p.status === 'reconciled' ? 'Matched to its original obligation. Included in the reconciled ledger export.' : 'Simulated conversion complete. Review the receipt and reconcile it against this obligation.'}</span></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="detail-actions">
      {['ready', 'needs_funds'].includes(p.status) && <button className="button primary full" disabled={busy} onClick={() => run('quote')}>{busy ? 'Requesting…' : 'Request demo quote'}<ArrowRight size={16} /></button>}
      {p.status === 'needs_funds' && <button className="button secondary full" onClick={onFund}>Add demo funds</button>}
      {p.status === 'quoted' && <><button className="button primary full" disabled={busy} onClick={() => run(expired ? 'quote' : 'execute')}>{busy ? 'Processing…' : expired ? 'Refresh expired quote' : 'Approve simulated settlement'}<ArrowRight size={16} /></button>{!expired && <button className="button ghost full" disabled={busy} onClick={() => run('quote')}><RefreshCw size={15} />Refresh quote</button>}</>}
      {['pending', 'unknown'].includes(p.status) && <button className="button primary full" disabled={busy} onClick={() => run('check')}><RefreshCw size={16} className={busy ? 'spin' : ''} />{busy ? 'Checking…' : 'Check simulated settlement'}</button>}
      {p.status === 'settled' && <button className="button primary full" disabled={busy} onClick={() => run('reconcile')}><CheckCheck size={17} />{busy ? 'Matching…' : 'Reconcile payment'}</button>}
    </div>
    <section className="timeline-section"><h3>Payment timeline <span>{events.length} events</span></h3><ol className="timeline">{events.map(event => <li key={event.id} className={`event-${event.kind}`}><span className="timeline-dot" /><div><strong>{event.title}</strong><p>{event.detail}</p><time dateTime={new Date(event.at).toISOString()}>{formatDate(event.at, true)}</time></div></li>)}</ol></section>
    <details className="technical-details"><summary>Exact ledger values</summary><pre>{JSON.stringify({ sourceUSDC: formatUnits(p.amount), targetEURC: p.quote ? formatUnits(p.quote.toAmount) : null, status: p.status, scenario: p.scenario, environment: 'simulation' }, null, 2)}</pre></details>
  </div>;
}
