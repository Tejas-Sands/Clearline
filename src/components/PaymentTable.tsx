import { useState } from 'react';
import { ArrowDownLeft, ArrowRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { displayMoney, isFinal, needsAttention } from '../domain.ts';
import type { Payment } from '../domain.ts';
import { EmptyState, StatusBadge, formatDate } from './ui.tsx';

export type Filter = 'all' | 'action' | 'pending' | 'settled' | 'unreconciled' | 'reconciled';
export function PaymentTable({ payments, onSelect, compact = false, filter = 'all', onFilter, now, reconciliation = false }: { payments: Payment[]; onSelect: (p: Payment) => void; compact?: boolean; filter?: Filter; onFilter?: (f: Filter) => void; now: number; reconciliation?: boolean }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const matches = payments.filter(p => {
    const text = `${p.reference} ${p.counterparty}`.toLowerCase().includes(query.toLowerCase());
    const visible = filter === 'all' || (filter === 'action' && needsAttention(p, now)) || (filter === 'pending' && ['ready', 'quoted', 'pending', 'unknown', 'needs_funds'].includes(p.status)) || (filter === 'settled' && isFinal(p)) || (filter === 'unreconciled' && p.status === 'settled') || (filter === 'reconciled' && p.status === 'reconciled');
    return text && visible;
  });
  const size = compact ? 5 : 8;
  const activePage = Math.min(page, Math.max(0, Math.ceil(matches.length / size) - 1));
  const visible = matches.slice(activePage * size, (activePage + 1) * size);
  const tabs: Filter[] = reconciliation ? ['all', 'unreconciled', 'reconciled'] : ['all', 'pending', 'action', 'settled'];
  const labels: Record<Filter, string> = { all: reconciliation ? 'All settlements' : 'All payments', pending: 'In progress', action: 'Needs attention', settled: 'Settled', unreconciled: 'Ready to match', reconciled: 'Reconciled' };
  return <>
    {!compact && <div className="table-tools"><div className="filter-tabs" aria-label="Payment filters">{tabs.map(value => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => { onFilter?.(value); setPage(0); }}>{labels[value]}</button>)}</div><label className="search-field"><Search size={16} aria-hidden="true" /><input aria-label="Search payments" placeholder="Search payments…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></label></div>}
    {visible.length ? <div className="table-scroll"><table><thead><tr><th>Counterparty / Reference</th><th>Amount</th><th>Corridor</th><th>Status</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(p => <tr key={p.id}>
      <td><div className="counterparty-cell"><span className={`company-avatar tone-${p.counterparty.length % 4}`}>{p.counterparty.split(' ').map(s => s[0]).slice(0, 2).join('')}</span><div><button className="table-name" onClick={() => onSelect(p)}>{p.counterparty}</button><span className="table-reference">{p.reference}</span></div></div></td>
      <td className="amount-cell"><strong>{displayMoney(p.amount)}</strong><span>USDC</span></td>
      <td><span className="corridor">USD <ArrowRight size={13} aria-hidden="true" /> EUR</span></td>
      <td><StatusBadge payment={p} now={now} /></td><td className="date-cell">{formatDate(p.createdAt)}</td>
      <td><button className="icon-button row-action" aria-label={`Open ${p.reference}`} onClick={() => onSelect(p)}><ArrowUpRightIcon /></button></td>
    </tr>)}</tbody></table></div> : <EmptyState title="Nothing in this view">Try another filter or create a payment to start a new settlement.</EmptyState>}
    <div className="table-footer"><span>{matches.length ? `${activePage * size + 1}–${Math.min((activePage + 1) * size, matches.length)} of ${matches.length} payments` : '0 payments'}<span className="footer-dot">·</span>Simulated records</span>{!compact && matches.length > size ? <div className="pagination"><button className="icon-button" aria-label="Previous page" disabled={activePage === 0} onClick={() => setPage(activePage - 1)}><ChevronLeft size={16} /></button><span>{activePage + 1} / {Math.ceil(matches.length / size)}</span><button className="icon-button" aria-label="Next page" disabled={(activePage + 1) * size >= matches.length} onClick={() => setPage(activePage + 1)}><ChevronRight size={16} /></button></div> : <ArrowDownLeft size={15} aria-hidden="true" />}</div>
  </>;
}
function ArrowUpRightIcon() { return <ArrowRight size={17} aria-hidden="true" />; }
