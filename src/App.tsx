import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, CheckCheck, CircleAlert, CircleHelp, Download, FlaskConical, LayoutDashboard, Menu, Plus, Settings2, ShieldCheck, Upload, Wallet, X, ArrowLeftRight, Home } from 'lucide-react';
import { useWorkspace } from './useWorkspace.ts';
import { displayMoney, isFinal, needsAttention } from './domain.ts';
import type { Action, Payment } from './domain.ts';
import { downloadFile, exportPayments } from './csv.ts';
import { Brand, EmptyState, Modal, formatDate } from './components/ui.tsx';
import { Overview } from './components/Overview.tsx';
import { PaymentTable } from './components/PaymentTable.tsx';
import type { Filter } from './components/PaymentTable.tsx';
import { FundingForm, ImportForm, PaymentForm } from './components/PaymentForms.tsx';
import { PaymentDetails } from './components/PaymentDetails.tsx';
import { TestnetPayments } from './components/TestnetPayments.tsx';
import { Landing } from './components/Landing.tsx';
import { ProofPage } from './components/ProofPage.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';

const pages = ['overview', 'payments', 'reconciliation', 'activity', 'settings', 'testnet'] as const;
type Page = typeof pages[number];
type FullPage = Page | 'landing' | 'proof';
type Overlay = { kind: 'payment'; id: string } | { kind: 'new' | 'import' | 'fund' | 'reset' } | null;
const pageFromHash = (): FullPage => {
  const hash = location.hash.slice(1) as FullPage;
  if (hash === 'proof' || hash === 'landing') return hash;
  return pages.includes(hash as Page) ? hash as Page : 'landing';
};
const titles: Record<Page, [string, string, string]> = {
  testnet: ['LET’S MAKE A PAYMENT', 'Testnet payments', 'Create a payment, review the live quote, then approve each step.'],
  overview: ['YOUR OPERATIONS, IN FOCUS', 'Settlement overview', 'A clear view of your money in motion.'],
  payments: ['ONE PLACE FOR EVERY PAYMENT', 'Payments', 'Find an invoice, review its status, and pick up where you left off.'],
  reconciliation: ['CLOSE THE LOOP', 'Reconciliation', 'Match settled payments to their invoices and export your records.'],
  activity: ['YOUR WORKSPACE STORY', 'Activity log', 'See what happened, when it happened, and what needs a closer look.'],
  settings: ['MAKE YOURSELF AT HOME', 'Settings', 'Manage your demo workspace and keep a copy of your records.'],
};

export default function App() {
  const workspace = useWorkspace();
  const { state, storageError } = workspace;
  const [page, setPage] = useState<FullPage>(pageFromHash);
  const [filter, setFilter] = useState<Filter>('all');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const mainContent = useRef<HTMLElement>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { mainContent.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [page]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 4500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const change = () => {
      const next = pageFromHash();
      setPage(next);
      setMobileNav(false);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (!mobileNav) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...sidebar.current!.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')].filter(el => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMobileNav(false); }
      if (event.key !== 'Tab') return;
      const targets = focusable();
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const resize = () => { if (window.innerWidth > 760) setMobileNav(false); };
    window.addEventListener('keydown', keyboard); window.addEventListener('resize', resize);
    return () => { window.removeEventListener('keydown', keyboard); window.removeEventListener('resize', resize); document.body.style.overflow = overflow; previous?.focus(); };
  }, [mobileNav]);
  const attention = state.payments.filter(p => needsAttention(p, now)).length;
  const pendingMatches = state.payments.filter(p => p.status === 'settled');
  const selected = overlay?.kind === 'payment' ? state.payments.find(p => p.id === overlay.id) : undefined;

  function go(next: FullPage, nextFilter: Filter = 'all') { setFilter(nextFilter); setPage(next); location.hash = next; setMobileNav(false); }
  function select(p: Payment) { setOverlay({ kind: 'payment', id: p.id }); }
  function act(action: Action) { workspace.act(action); setNow(Date.now()); }
  function exportCsv() {
    const rows = page === 'reconciliation' ? state.payments.filter(p => p.status === 'reconciled') : state.payments;
    downloadFile(`clearline-${page === 'reconciliation' ? 'reconciled' : 'payments'}-${new Date().toISOString().slice(0, 10)}.csv`, exportPayments(rows));
    setToast(`Exported ${rows.length} ${page === 'reconciliation' ? 'reconciled ' : ''}payment records.`);
  }
  const navItems = [
    { id: 'landing', label: 'Home', icon: Home },
    { id: 'testnet', label: 'Testnet payments', icon: Wallet },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: ArrowLeftRight },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCheck },
    { id: 'activity', label: 'Activity log', icon: Activity },
  ] as const;

  // Landing and proof pages render without the workspace shell
  if (page === 'landing') {
    return <Landing onDemo={() => go('overview')} onProof={() => go('proof')} onTestnet={() => go('testnet')} />;
  }
  if (page === 'proof') {
    return <ProofPage onBack={() => go('overview')} />;
  }

  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a>
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside ref={sidebar} className={`sidebar ${mobileNav ? 'mobile-open' : ''}`} role={mobileNav ? 'dialog' : undefined} aria-modal={mobileNav || undefined} aria-label="Workspace navigation"><div className="sidebar-brand"><a href="#overview" onClick={() => go('overview')} aria-label="Clearline overview"><Brand /></a><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={20} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">C</span><div><strong>Your payment workspace</strong><span>USDC in. EURC out.</span></div></div>
      <nav aria-label="Main navigation">{navItems.map(item => <div key={item.id}>{item.id === 'landing' && <div className="nav-label">EXPLORE</div>}{item.id === 'overview' && <div className="nav-label nav-section">SIMULATION</div>}<a href={`#${item.id}`} className={`nav-item ${page === item.id ? 'active' : ''}`} aria-current={page === item.id ? 'page' : undefined} onClick={e => { e.preventDefault(); go(item.id); }}><item.icon size={19} /><span>{item.label}</span>{item.id === 'payments' && attention > 0 && <span className="nav-count">{attention}</span>}</a></div>)}</nav>
      <div className="sidebar-bottom"><div className="arc-card"><span className="arc-mark">arc<span>↗</span></span><p>Built around stablecoin settlement.</p><span className="arc-card-label">USDC → EURC</span><a href="https://docs.arc.io/app-kit/swap" target="_blank" rel="noreferrer">Explore Arc swaps <ArrowUpRight size={14} /></a></div>
      <a href="#settings" className={`nav-item ${page === 'settings' ? 'active' : ''}`} aria-current={page === 'settings' ? 'page' : undefined} onClick={e => { e.preventDefault(); go('settings'); }}><Settings2 size={18} />Settings</a>
      <a href="https://docs.arc.io/app-kit/swap" target="_blank" rel="noreferrer" className="nav-item"><CircleHelp size={18} />Developer resources<ArrowUpRight size={14} className="nav-end" /></a>
      <div className="profile"><span className="profile-avatar">OP</span><div><strong>Operations team</strong><span>Local demo session</span></div><span className="profile-indicator" /></div></div>
    </aside>
    <div className="main-shell" inert={mobileNav}><header className="topbar"><div className="breadcrumb"><button className="icon-button menu-button" aria-label="Open navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(true)}><Menu size={21} /></button><span className="breadcrumb-workspace">Workspace</span><span className="breadcrumb-slash">/</span><strong>{page === 'overview' ? 'Overview' : titles[page as Page]?.[1] ?? page}</strong></div><div className="topbar-right"><ThemeToggle /><span className="simulation-badge"><FlaskConical size={13} />{page === 'testnet' ? 'Arc Testnet' : 'Simulation'}</span><span className="topbar-divider" /><button className="topbar-avatar" aria-label="Open workspace settings" onClick={() => go('settings')}>OP</button></div></header>
      <main id="main" ref={mainContent} tabIndex={-1}><div className="page-heading"><div><span className="eyebrow">{titles[page as Page]?.[0]}</span><h1>{titles[page as Page]?.[1]}</h1><p>{titles[page as Page]?.[2]}</p></div>{['overview', 'payments'].includes(page) && <div className="heading-actions"><button className="button secondary" onClick={() => setOverlay({ kind: 'import' })}><Upload size={16} />Import CSV</button><button className="button primary" onClick={() => setOverlay({ kind: 'new' })}><Plus size={17} />New payment</button></div>}{page === 'reconciliation' && <button className="button primary" onClick={exportCsv}><ArrowDownToLine size={16} />Export matched ledger</button>}</div>
      {storageError && <div className="storage-error" role="alert"><CircleAlert size={21} /><div><strong>Workspace needs attention</strong><p>{storageError}</p></div><button className="button secondary" onClick={() => location.reload()}>Reload</button><button className="button secondary" onClick={() => go('settings')}>Recovery options</button></div>}
      {page === 'testnet' && <TestnetPayments />}
      {page === 'overview' && <div className="workspace-intro"><span className="intro-icon"><FlaskConical size={24} aria-hidden="true" /></span><div><strong>A little practice, a lot more clarity.</strong><p>These sample payments are yours to explore. Create an invoice, review a quote, and follow it through settlement.</p></div><button className="button secondary" onClick={() => go('testnet')}>Try testnet payments <ArrowRight size={16} aria-hidden="true" /></button></div>}
      {page === 'overview' && <Overview state={state} now={now} onSelect={select} onPayments={() => go('payments')} onAttention={() => go('payments', 'action')} onReconcile={() => go('reconciliation')} onFund={() => setOverlay({ kind: 'fund' })} />}
      {page === 'payments' && <section className="panel"><div className="panel-header"><div><h2>Payment queue <span className="count-pill">{state.payments.length}</span></h2><p>USDC → EURC · all payment obligations</p></div><button className="button secondary small" onClick={exportCsv}><Download size={15} />Export CSV</button></div><PaymentTable payments={state.payments} onSelect={select} filter={filter} onFilter={setFilter} now={now} /></section>}
      {page === 'reconciliation' && <><div className="reconcile-summary"><div><span className="summary-icon"><CheckCheck size={25} /></span><div><span className="eyebrow">READY TO MATCH</span><h2>{pendingMatches.length} settled payments</h2><p>${displayMoney(pendingMatches.reduce((s, p) => s + BigInt(p.amount), 0n))} USDC source value awaiting reconciliation</p></div></div><span className="reconcile-note"><ShieldCheck size={16} />Matches do not move funds</span></div><section className="panel"><div className="panel-header"><div><h2>Settlement ledger</h2><p>Open a settled payment to inspect its receipt and match it.</p></div></div><PaymentTable payments={state.payments.filter(isFinal)} onSelect={select} filter={filter} onFilter={setFilter} now={now} reconciliation /></section><p className="page-footnote">Reconciliation matches the simulated conversion to an imported obligation. It does not verify an external bank statement or a beneficiary payout.</p></>}
      {page === 'activity' && <section className="panel"><div className="panel-header"><div><h2>Workspace events <span className="count-pill">{state.activity.length}</span></h2><p>Most recent first · timestamps shown in your local timezone</p></div><Activity size={20} className="muted" /></div>{state.activity.length ? <div className="activity-list">{state.activity.map(event => <div className="activity-row" key={event.id}><span className={`activity-icon ${event.kind}`}>{event.kind === 'success' ? <CheckCheck size={18} /> : event.kind === 'warning' ? <CircleAlert size={18} /> : <ArrowRight size={18} />}</span><div><strong>{event.title}</strong><p>{event.detail}</p></div><time dateTime={new Date(event.at).toISOString()}>{formatDate(event.at, true)}</time>{event.paymentId && <button className="icon-button" aria-label={`Inspect payment for ${event.title}`} onClick={() => setOverlay({ kind: 'payment', id: event.paymentId! })}><ArrowUpRight size={16} /></button>}</div>)}</div> : <EmptyState title="No activity yet">Create a payment to start the audit trail.</EmptyState>}</section>}
      {page === 'settings' && <div className="settings-grid"><section className="panel"><div className="panel-header"><div><h2>Settlement environment</h2><p>A safe workspace for exploring the workflow.</p></div><FlaskConical size={21} /></div><div className="settings-body"><div className="integration-row"><span className="integration-icon"><FlaskConical size={22} /></span><div><strong>Local settlement simulator</strong><p>Active · all data stays in this browser</p></div><span className="status status-settled">Active</span></div><dl className="detail-facts"><div><dt>Corridor</dt><dd>USDC → EURC</dd></div><div><dt>Demo rate</dt><dd>0.915000 EURC / USDC</dd></div><div><dt>Demo fee</dt><dd>0.25 USDC / conversion</dd></div><div><dt>Quote lifetime</dt><dd>60 seconds</dd></div><div><dt>StableFX API</dt><dd>Not connected</dd></div><div><dt>Wallet / Arc RPC</dt><dd>Not connected</dd></div></dl><div className="notice"><BookOpen size={20} /><span>This page configures the local simulator. Open Testnet payments for actual Arc swaps, CCTP funding, recipient transfers, and verified receipts using the dedicated test wallet.</span></div><a className="button secondary full" href="https://docs.arc.io/app-kit/swap" target="_blank" rel="noreferrer">Read the integration guide <ArrowUpRight size={16} /></a></div></section>
      <div className="settings-stack"><section className="panel"><div className="panel-header"><div><h2>Workspace data</h2><p>Local to this browser and origin.</p></div><Wallet size={20} /></div><div className="settings-body"><p className="settings-description">Download records before clearing browser data. The activity log is a demo history, not an immutable or shared accounting system.</p><button className="button secondary full" onClick={exportCsv}><Download size={16} />Export all payment records</button><button className="button secondary full" onClick={() => { downloadFile('clearline-workspace-backup.json', workspace.rawBackup ?? JSON.stringify(state, null, 2), 'application/json'); setToast('Workspace backup downloaded.'); }}><Download size={16} />Download workspace backup</button></div></section><section className="panel reset-panel"><div className="settings-body"><h2>Start fresh</h2><p>Replace this local workspace with the original sample payments and demo balances.</p><button className="button danger" onClick={() => setOverlay({ kind: 'reset' })}>Reset demo workspace</button></div></section></div></div>}
      <footer className="page-footer"><span><span className="tiny-dot" />{page === 'testnet' ? 'Test assets only' : 'Simulation · no real funds'}</span><span>Every payment, a little clearer.</span><span>Clearline</span></footer>
      </main>
    </div>
    {overlay?.kind === 'new' && <Modal title="New payment" subtitle="Start with an obligation. Approve the quote when you're ready." onClose={() => setOverlay(null)}><PaymentForm onSubmit={input => { const next = workspace.act({ type: 'create', input }); setOverlay({ kind: 'payment', id: next.payments[0].id }); setToast('Payment created. Request a quote to continue.'); }} /></Modal>}
    {overlay?.kind === 'import' && <Modal title="Import payments" subtitle="Bring your obligations into one settlement queue." onClose={() => setOverlay(null)}><ImportForm existing={state.payments} onImport={inputs => { workspace.act({ type: 'import', inputs }); setOverlay(null); go('payments'); setToast(`${inputs.length} payments imported successfully.`); }} /></Modal>}
    {overlay?.kind === 'fund' && <Modal title="Add demo funds" onClose={() => setOverlay(null)}><FundingForm onFund={amount => { act({ type: 'fund', amount }); setOverlay(null); setToast('Simulated USDC balance updated.'); }} /></Modal>}
    {overlay?.kind === 'payment' && selected && <Modal key={selected.id} title="Payment details" drawer onClose={() => setOverlay(null)}><PaymentDetails payment={selected} activity={state.activity} now={now} onAction={act} onFund={() => setOverlay({ kind: 'fund' })} /></Modal>}
    {overlay?.kind === 'reset' && <Modal title="Reset this workspace?" onClose={() => setOverlay(null)}><div className="form-body"><p>This replaces all local payments, balances, and activity with the original demo. Export any records you want to keep first.</p><button className="button danger full" onClick={() => { try { workspace.reset(); setOverlay(null); go('overview'); setToast('Demo workspace reset.'); } catch { setToast('Reset failed: browser storage is unavailable.'); } }}>Yes, reset demo workspace</button><button className="button secondary full" onClick={() => setOverlay(null)}>Keep my workspace</button></div></Modal>}
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><CheckCheck size={18} /><span>{toast}</span><button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></>}</div>
  </div>;
}
