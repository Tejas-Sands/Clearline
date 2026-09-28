import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, CheckCheck, CircleAlert, Copy, ExternalLink, LoaderCircle, Plus, RefreshCw, Wallet } from 'lucide-react';
import { displayMoney } from '../domain.ts';
import { downloadFile } from '../csv.ts';

type Tx = { hash: string; step: string; chain: 'arc' | 'base'; status: string; blockNumber?: string };
type LivePayment = {
  id: string; reference: string; recipient: string; sender: string; amount: string; source: 'arc' | 'base';
  status: string; outputAmount?: string; fundedAmount?: string; error?: string; createdAt: number; canRetryBridge?: boolean;
  quote?: { expected: string; minimum: string; expiresAt: number; fees: { token: string; amount: string; type?: string }[] };
  transactions: Tx[]; events: { at: number; message: string }[];
};
type Snapshot = {
  token: string; sender: string; defaultRecipient: string; payments: LivePayment[];
  busy: { id: string; action: string } | null; balanceCheckedAt: number | null;
  balances: { arcUSDC: string | null; arcEURC: string | null; baseUSDC: string | null; baseETH: string | null } | null;
};
const labels: Record<string, string> = { created: 'Needs bridge funding', bridging: 'Bridge in progress', funded: 'Ready for quote', quoted: 'Quote ready', swapping: 'Conversion in progress', converted: 'Ready to pay', paying: 'Payment in progress', paid: 'Payment verified', reconciled: 'Reconciled' };
const explorer = (tx: Tx) => `${tx.chain === 'arc' ? 'https://testnet.arcscan.app' : 'https://sepolia.basescan.org'}/tx/${tx.hash}`;
const short = (address: string) => `${address.slice(0, 8)}…${address.slice(-6)}`;

export function TestnetPayments() {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('clearline-session');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('clearline-session', id); }
    return id;
  });
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1.00');
  const [source, setSource] = useState('arc');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    async function poll() {
      try {
        const response = await fetch('/api/testnet', { signal: abort.signal, headers: { 'X-Session-ID': sessionId } });
        if (!response.ok) {
          let msg = `Testnet API returned ${response.status}.`;
          try { const body = await response.json(); msg = body.error ?? msg; } catch { /* ignore */ }
          throw new Error(msg);
        }
        const data = await response.json() as Snapshot;
        if (active) { setSnapshot(data); setNow(Date.now()); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Cannot reach the testnet API.'); }
    }
    void poll(); const timer = setInterval(() => void poll(), 2500);
    return () => { active = false; abort.abort(); clearInterval(timer); };
  }, [sessionId]);
  async function post(path: string, input = {}) {
    if (!snapshot || working) return;
    setWorking(true); setError('');
    try {
      const response = await fetch(`/api/testnet${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clearline-Token': snapshot.token, 'X-Session-ID': sessionId }, body: JSON.stringify(input) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed.');
      const update = await fetch('/api/testnet', { headers: { 'X-Session-ID': sessionId } }).then(r => r.json()) as Snapshot;
      setSnapshot(update);
      return result;
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed.'); }
    finally { setWorking(false); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice('Address copied.'); }
    catch { setNotice('Copy the full address shown below.'); }
  }
  function exportCsv() {
    if (!snapshot) return;
    const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;
    const rows = [['environment','reference','source_network','source_usdc','recipient','eurc_paid','status','transactions'], ...snapshot.payments.map(p => ['arc-testnet', p.reference, p.source === 'base' ? 'base-sepolia' : 'arc-testnet', displayMoney(p.amount, true).replaceAll(',', ''), p.recipient, ['paid','reconciled'].includes(p.status) ? displayMoney(p.outputAmount!, true).replaceAll(',', '') : '', p.status, p.transactions.map(t => explorer(t)).join(' ')])];
    downloadFile('clearline-testnet-payments.csv', rows.map(row => row.map(cell).join(',')).join('\r\n'));
  }
  const active = snapshot?.payments.find(p => p.id === selected);
  const disabled = working || !!snapshot?.busy;
  const money = (value: string | null | undefined) => value == null ? 'Unavailable' : displayMoney(value);

  return <div className="testnet-workspace">
    <div className="notice testnet-notice"><CircleAlert size={20} /><span><strong>Real transactions · test assets only.</strong> This local wallet uses Arc Testnet and Base Sepolia. Tokens have no monetary value. Quotes reflect test-pool liquidity, not market FX rates.</span></div>
    {error && <div className="storage-error" role="alert"><CircleAlert size={20} /><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}>×</button></div>}
    {!snapshot ? <section className="panel settings-body"><LoaderCircle size={24} className="spin" /><h2>Connecting to the testnet service…</h2><p>{error || 'Waiting for the testnet API to respond.'}</p></section> : <>
      <section className="panel live-wallet"><div className="panel-header"><div><h2><Wallet size={19} /> Testnet wallet</h2><p>Dedicated to this prototype · keys stay on this computer</p></div><button className="button secondary small" disabled={working} onClick={() => void post('/refresh')}><RefreshCw size={15} />Refresh balances</button></div>
        <div className="wallet-address"><code>{snapshot.sender}</code><button className="icon-button" aria-label="Copy testnet wallet address" onClick={() => void copy(snapshot.sender)}><Copy size={16} /></button><a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="button secondary small">Get free test USDC <ExternalLink size={14} /></a></div>
        <div className="live-balances"><div><span>Arc · available USDC</span><strong>{money(snapshot.balances?.arcUSDC)}</strong></div><div><span>Arc · available EURC</span><strong>{money(snapshot.balances?.arcEURC)}</strong></div><div><span>Base Sepolia · USDC</span><strong>{money(snapshot.balances?.baseUSDC)}</strong></div><div><span>Base Sepolia · gas ETH</span><strong>{snapshot.balances?.baseETH == null ? 'Unavailable' : `${(BigInt(snapshot.balances.baseETH) / 1000000000000n).toString().padStart(7, '0').replace(/(.{6})$/, '.$1')}`}</strong></div></div>
        <p className="wallet-footnote">Arc fees use test USDC. Bridging from Base also needs test ETH on Base Sepolia. {snapshot.balanceCheckedAt ? `Last checked ${new Date(snapshot.balanceCheckedAt).toLocaleTimeString()}.` : 'Reading public RPC balances…'}</p>
      </section>
      <div className="live-toolbar"><div><h2>Testnet payment queue <span className="count-pill">{snapshot.payments.length}</span></h2><p>Fund → quote → convert → pay → reconcile</p></div><div className="heading-actions"><button className="button secondary" onClick={exportCsv}><ArrowDownToLine size={16} />Export records</button><button className="button primary" disabled={disabled} onClick={() => { setRecipient(snapshot.defaultRecipient); setShowForm(!showForm); }}><Plus size={17} />New test payment</button></div></div>
      {showForm && <form className="panel live-form" onSubmit={async e => { e.preventDefault(); const p = await post('/payments', { reference, recipient, amount, source }); if (p) { setSelected(p.id); setShowForm(false); setReference(''); } }}>
        <div className="form-grid"><label>Invoice reference<input required maxLength={60} value={reference} onChange={e => setReference(e.target.value)} placeholder="TEST-001" /></label><label>Source amount · test USDC<input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></label></div>
        <label>Funding network<select value={source} onChange={e => setSource(e.target.value)}><option value="arc">Arc Testnet · use existing USDC</option><option value="base">Base Sepolia → Arc · CCTP bridge first</option></select></label>
        <label>Recipient on Arc Testnet<input required value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x…" /></label><p className="field-hint">The prefilled address is a second test wallet generated for this demo. Up to 100 test USDC per payment. Creating a record does not move tokens.</p><div className="heading-actions"><button className="button primary" disabled={disabled}>Create test payment</button><button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>}
      {snapshot.busy && <div className="notice" role="status"><LoaderCircle size={19} className="spin" /><span>Processing {snapshot.busy.action}. You can leave this page; the local server keeps the operation and transaction journal.</span></div>}
      <div className="live-grid"><section className="panel live-queue" aria-label="Testnet payments">
        {snapshot.payments.length ? snapshot.payments.map(p => <button key={p.id} className={`live-payment-row ${selected === p.id ? 'selected' : ''}`} onClick={() => setSelected(p.id)}><div><strong>{p.reference}</strong><span>{short(p.recipient)} · {p.source === 'base' ? 'Base → Arc' : 'Arc'}</span></div><div><strong>{displayMoney(p.amount)} USDC</strong><span className={`status ${['paid','reconciled'].includes(p.status) ? 'status-settled' : 'status-pending'}`}>{labels[p.status]}</span></div></button>) : <div className="empty-state"><Wallet size={28} /><h3>No testnet payments yet</h3><p>Fund the test wallet, then create a payment to receive a live quote.</p></div>}
      </section><section className="panel live-detail" aria-label="Selected testnet payment">
        {!active ? <div className="empty-state"><ArrowUpRight size={26} /><h3>Select a payment</h3><p>Inspect its quote, receipts, and next action.</p></div> : <>
          <div className="panel-header"><div><span className="eyebrow">{labels[active.status]}</span><h2>{active.reference}</h2></div>{['paid','reconciled'].includes(active.status) && <CheckCheck size={25} className="muted" />}</div>
          <div className="settings-body"><dl className="detail-facts"><div><dt>Source obligation</dt><dd>{displayMoney(active.amount)} USDC</dd></div>{active.fundedAmount && <div><dt>Arrived after bridge fees</dt><dd>{displayMoney(active.fundedAmount)} USDC</dd></div>}<div><dt>Recipient</dt><dd className="live-recipient">{active.recipient}</dd></div>{active.outputAmount && <div><dt>Converted amount</dt><dd>{displayMoney(active.outputAmount)} EURC</dd></div>}</dl>
          {active.quote && ['quoted','swapping'].includes(active.status) && <div className="live-quote"><span className="eyebrow">LIVE TESTNET ESTIMATE</span><h3>{displayMoney(active.quote.expected)} EURC</h3><p>Minimum approved output: <strong>{displayMoney(active.quote.minimum)} EURC</strong></p><p>{now >= active.quote.expiresAt ? 'Approval expired — request a fresh quote.' : `Approve within ${Math.max(0, Math.ceil((active.quote.expiresAt - now) / 1000))}s`}</p><ul>{active.quote.fees.map((fee, i) => <li key={i}>{fee.type ?? 'Provider'} fee: {fee.amount} {fee.token}</li>)}</ul></div>}
          {active.error && <div className="notice error" role="alert"><CircleAlert size={19} /><span>{active.error}</span></div>}
          <div className="live-actions">
            {active.status === 'created' && <><p>CCTP burns the source USDC and mints it on Arc. Allow up to 0.01 USDC protocol fee plus network gas; standard attestation can take several minutes.</p><button className="button primary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/bridge`)}>Approve CCTP funding</button></>}
            {['funded','quoted'].includes(active.status) && <button className="button secondary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/quote`)}>{active.quote ? 'Refresh quote' : 'Get live swap quote'}</button>}
            {active.status === 'quoted' && <button className="button primary full" disabled={disabled || !active.quote || now >= active.quote.expiresAt} onClick={() => void post(`/payments/${active.id}/swap`)}>Approve conversion to EURC</button>}
            {active.status === 'converted' && <button className="button primary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/pay`)}>Send {displayMoney(active.outputAmount!)} test EURC to recipient</button>}
            {['bridging','swapping','paying'].includes(active.status) && <button className="button primary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/recover`)}><RefreshCw size={16} />Check & recover original transaction</button>}
            {active.canRetryBridge && <button className="button secondary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/retry`)}>Retry confirmed reverted bridge stage</button>}
            {active.status === 'paid' && <button className="button primary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/reconcile`)}><CheckCheck size={16} />Match payment to invoice</button>}
            {active.status === 'reconciled' && <div className="notice"><CheckCheck size={19} /><span>Recipient payment verified and invoice matched. Export the record for its transaction links.</span></div>}
          </div>
          {active.transactions.length > 0 && <div className="live-transactions"><h3>Onchain evidence</h3>{active.transactions.map(tx => <a key={tx.hash} href={explorer(tx)} target="_blank" rel="noreferrer"><div><strong>{tx.step.replaceAll('_', ' ').replace(/:\d+$/, '')} · {tx.chain === 'arc' ? 'Arc' : 'Base'}</strong><code>{short(tx.hash)}</code></div><span>{tx.status}</span><ExternalLink size={14} /></a>)}</div>}
          <div className="live-events"><h3>Operation history</h3>{active.events.map((event, i) => <div key={`${event.at}-${i}`}><time>{new Date(event.at).toLocaleTimeString()}</time><p>{event.message}</p></div>)}</div></div>
        </>}
      </section></div>
      <p className="page-footnote">The bridge, swap and recipient payment are separate transactions. A completed bridge does not mean the recipient has been paid. This workspace verifies token transfers, not bank payouts.</p>
    </>}
    <span className="sr-only" role="status">{notice}</span>
  </div>;
}
