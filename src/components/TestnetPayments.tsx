import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCheck, CircleAlert, Copy, ExternalLink, LoaderCircle, Plus, RefreshCw, Wallet, X } from 'lucide-react';
import { displayMoney } from '../domain.ts';
import { downloadFile } from '../csv.ts';
import { readTestnetResponse } from '../testnet-api.ts';

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
const steps = ['Funding', 'Quote', 'Convert', 'Pay', 'Match'];
const stage: Record<string, number> = { created: 0, bridging: 0, funded: 1, quoted: 2, swapping: 2, converted: 3, paying: 3, paid: 4, reconciled: 5 };
const guidance: Record<string, [string, string]> = {
  created: ['First, bring your USDC to Arc', 'Approve the bridge from Base Sepolia. Once the mint is verified, you can request a quote.'],
  bridging: ['Your bridge is in progress', 'Check the original transaction to see whether your USDC has arrived. Attestation can take several minutes.'],
  funded: ['Next, see how much EURC you’ll receive', 'Requesting a quote does not move tokens. Review the amount and fees before approving conversion.'],
  quoted: ['Your quote is ready to review', 'Check the minimum EURC output and fees below. Conversion is a separate approval; the recipient is paid afterward.'],
  swapping: ['Check your conversion', 'Recover the original transaction to confirm the EURC received before paying the recipient.'],
  converted: ['You’re ready to pay the recipient', 'Your conversion is verified. The next approval sends the exact EURC amount to the address below.'],
  paying: ['Check the recipient transfer', 'Verify the original payment transaction before taking another action.'],
  paid: ['Payment delivered. Let’s close the loop.', 'Match the verified transfer to your invoice. Matching moves no funds.'],
  reconciled: ['All matched and ready to export', 'Your recipient transfer is verified and matched to this invoice. Export the record for your transaction links.'],
};
const workingLabels: Record<string, string> = { quote: 'Getting your live quote…', refresh: 'Checking wallet balances…', payments: 'Creating your payment…', swap: 'Submitting your conversion…', bridge: 'Checking bridge funding…', pay: 'Submitting your recipient payment…', recover: 'Checking the original transaction…', retry: 'Retrying the reverted bridge stage…', reconcile: 'Matching your payment…' };

export function TestnetPayments() {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('clearline-session');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('clearline-session', id); }
    return id;
  });
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [working, setWorking] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1.00');
  const [source, setSource] = useState('arc');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    async function poll() {
      try {
        const response = await fetch('/api/testnet', { signal: abort.signal, headers: { 'X-Session-ID': sessionId } });
        const data = await readTestnetResponse<Snapshot>(response);
        if (active) { setSnapshot(data); setConnectionError(''); }
      } catch (e) { if (active) setConnectionError(e instanceof Error ? e.message : 'Cannot reach the testnet API.'); }
    }
    void poll(); const timer = setInterval(() => void poll(), 2500);
    return () => { active = false; abort.abort(); clearInterval(timer); };
  }, [sessionId]);
  async function post(path: string, input = {}) {
    if (!snapshot || working) return;
    setWorking(path.split('/').at(-1) ?? 'request'); setError('');
    try {
      const response = await fetch(`/api/testnet${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clearline-Token': snapshot.token, 'X-Session-ID': sessionId }, body: JSON.stringify(input) });
      const result = await readTestnetResponse<LivePayment>(response);
      const update = await fetch('/api/testnet', { headers: { 'X-Session-ID': sessionId } }).then(readTestnetResponse<Snapshot>);
      setSnapshot(update);
      if (path === '/refresh') setNotice('Wallet balances updated.');
      return result;
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed.'); }
    finally { setWorking(''); }
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
  const active = snapshot?.payments.find(p => p.id === selected) ?? snapshot?.payments[0];
  const disabled = !!working || !!snapshot?.busy;
  const visibleError = error || connectionError;
  const quoteExpired = !!active?.quote && now >= active.quote.expiresAt;
  const money = (value: string | null | undefined) => value == null ? 'Unavailable' : displayMoney(value);

  return <div className="testnet-workspace">
    <div className="notice testnet-notice"><Wallet size={20} aria-hidden="true" /><span><strong>A real payment workflow, with free test tokens.</strong> Use Arc Testnet USDC, or bridge from Base Sepolia. Review and approve each step. Test tokens have no monetary value; quotes use test-pool liquidity.</span></div>
    {visibleError && <div className="notice error" role="alert"><CircleAlert size={20} aria-hidden="true" /><span><strong>We couldn’t complete that request</strong>{visibleError}</span>{error && <button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}><X size={18} /></button>}</div>}
    {!snapshot ? <section className="panel live-loading" role="status"><LoaderCircle size={24} className="spin" /><h2>Connecting to your payment workspace…</h2><p>{connectionError || 'Your wallet balances and payment records will appear here.'}</p></section> : <>
      <section className="panel live-wallet"><div className="panel-header"><div><h2><Wallet size={19} /> Your testnet wallet</h2><p>The source wallet for these payments</p></div><button className="button secondary small" disabled={disabled} onClick={() => void post('/refresh')}><RefreshCw size={15} />Refresh balances</button></div>
        <div className="wallet-address"><code>{snapshot.sender}</code><button className="icon-button" aria-label="Copy testnet wallet address" onClick={() => void copy(snapshot.sender)}><Copy size={16} /></button><a href="https://faucet.circle.com" target="_blank" rel="noreferrer" className="button secondary small">Get free test USDC <ExternalLink size={14} /></a></div>
        <div className="live-balances"><div><span>Arc · available USDC</span><strong>{money(snapshot.balances?.arcUSDC)}</strong></div><div><span>Arc · available EURC</span><strong>{money(snapshot.balances?.arcEURC)}</strong></div><div><span>Base Sepolia · USDC</span><strong>{money(snapshot.balances?.baseUSDC)}</strong></div><div><span>Base Sepolia · gas ETH</span><strong>{snapshot.balances?.baseETH == null ? 'Unavailable' : `${(BigInt(snapshot.balances.baseETH) / 1000000000000n).toString().padStart(7, '0').replace(/(.{6})$/, '.$1')}`}</strong></div></div>
        <p className="wallet-footnote">Arc fees use test USDC. Bridging from Base also needs test ETH on Base Sepolia. {snapshot.balanceCheckedAt ? `Last checked ${new Date(snapshot.balanceCheckedAt).toLocaleTimeString()}.` : 'Reading public RPC balances…'}</p>
      </section>
      <div className="live-toolbar"><div><h2>Your testnet payments <span className="count-pill">{snapshot.payments.length}</span></h2><p>Choose a payment to see exactly what comes next.</p></div><div className="heading-actions"><button className="button secondary" onClick={exportCsv}><ArrowDownToLine size={16} />Export records</button><button className="button primary" disabled={disabled} aria-expanded={showForm} aria-controls="testnet-payment-form" onClick={() => { if (!showForm) setRecipient(snapshot.defaultRecipient); setShowForm(!showForm); }}><Plus size={17} />New test payment</button></div></div>
      {showForm && <form id="testnet-payment-form" className="panel live-form" onSubmit={async e => { e.preventDefault(); const p = await post('/payments', { reference, recipient, amount, source }); if (p) { setSelected(p.id); setShowForm(false); setReference(''); setNotice('Payment created. Choose the next step when you’re ready.'); } }}>
        <div className="live-form-heading"><div><h3>Let’s set up your payment</h3><p>Start with the invoice details. You’ll approve token movement separately.</p></div><button type="button" className="icon-button" aria-label="Close payment form" disabled={disabled} onClick={() => setShowForm(false)}><X size={20} /></button></div>
        <div className="form-grid"><label>Invoice reference<input required autoFocus maxLength={60} value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. TEST-001" /></label><label>You send · test USDC<input required inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} aria-describedby="testnet-amount-hint" /><span id="testnet-amount-hint" className="field-hint">Up to 100 USDC. Your EURC amount depends on the quote.</span></label></div>
        <label>Funding network<select value={source} onChange={e => setSource(e.target.value)}><option value="arc">Arc Testnet · use existing USDC</option><option value="base">Base Sepolia → Arc · CCTP bridge first</option></select></label>
        <label>Recipient wallet on Arc Testnet<input required value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x…" aria-describedby="testnet-recipient-hint" spellCheck={false} autoComplete="off" /></label><p id="testnet-recipient-hint" className="field-hint">We’ve filled in the demo recipient. Use this address or enter your own Arc Testnet recipient.</p><div className="heading-actions"><button className="button primary" disabled={disabled}>{working === 'payments' ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}Create test payment</button><button type="button" className="button secondary" disabled={disabled} onClick={() => setShowForm(false)}>Cancel</button></div>
      </form>}
      {(working || snapshot.busy) && <div className="notice" role="status"><LoaderCircle size={19} className="spin" aria-hidden="true" /><span>{workingLabels[working || snapshot.busy!.action] ?? 'Processing your request…'} Please wait for the latest status before taking another action.</span></div>}
      <div className="live-grid"><section className="panel live-queue" aria-label="Testnet payments">
        <div className="panel-header"><h2>Payment list</h2><span className="eyebrow">USDC → EURC</span></div>
        {snapshot.payments.length ? snapshot.payments.map(p => <button key={p.id} className={`live-payment-row ${active?.id === p.id ? 'selected' : ''}`} aria-pressed={active?.id === p.id} onClick={() => setSelected(p.id)}><div><strong>{p.reference}</strong><span>{short(p.recipient)} · {p.source === 'base' ? 'Base → Arc' : 'Arc'}</span></div><div><strong>{displayMoney(p.amount)} USDC</strong><span className={`status ${['paid','reconciled'].includes(p.status) ? 'status-settled' : 'status-pending'}`}>{labels[p.status]}</span></div></button>) : <div className="empty-state"><Wallet size={28} /><h3>Your first payment starts here</h3><p>Create an invoice record, then review a live quote. No tokens move until you approve.</p><button className="button secondary" onClick={() => { setRecipient(snapshot.defaultRecipient); setShowForm(true); }} disabled={disabled}><Plus size={16} />Create your first payment</button></div>}
      </section><section className="panel live-detail" aria-label="Selected testnet payment">
        {!active ? <div className="empty-state"><ArrowUpRight size={26} /><h3>Select a payment</h3><p>Inspect its quote, receipts, and next action.</p></div> : <>
          <div className="panel-header"><div><span className="eyebrow">{labels[active.status]}</span><h2>{active.reference}</h2></div>{['paid','reconciled'].includes(active.status) && <CheckCheck size={25} className="muted" />}</div>
          <div className="settings-body">
          <ol className="payment-progress" aria-label="Payment progress">{steps.map((step, index) => <li key={step} className={index < stage[active.status] ? 'complete' : index === stage[active.status] ? 'current' : ''} aria-current={index === stage[active.status] ? 'step' : undefined}><span>{index < stage[active.status] ? <Check size={14} aria-hidden="true" /> : index + 1}</span><span>{step}<span className="sr-only">{index < stage[active.status] ? ' complete' : index === stage[active.status] ? ' current step' : ''}</span></span></li>)}</ol>
          <div className="next-step"><strong>{quoteExpired && active.status === 'quoted' ? 'Your quote expired. Get a fresh one.' : guidance[active.status]?.[0]}</strong><p>{quoteExpired && active.status === 'quoted' ? 'Quotes last 60 seconds. Refresh to review the latest output before approving.' : guidance[active.status]?.[1]}</p>{active.source === 'arc' && active.status === 'funded' && <p>Check the Arc wallet balance above covers your amount plus network fees.</p>}</div>
          <dl className="detail-facts"><div><dt>You send</dt><dd>{displayMoney(active.amount)} USDC</dd></div>{active.fundedAmount && <div><dt>Arrived after bridge fees</dt><dd>{displayMoney(active.fundedAmount)} USDC</dd></div>}<div><dt>Recipient wallet</dt><dd className="live-recipient">{active.recipient}</dd></div>{active.outputAmount && <div><dt>Converted amount</dt><dd>{displayMoney(active.outputAmount)} EURC</dd></div>}</dl>
          {active.quote && ['quoted','swapping'].includes(active.status) && <div className="live-quote"><span className="eyebrow">LIVE TESTNET ESTIMATE</span><h3>{displayMoney(active.quote.expected)} EURC</h3><p>Minimum approved output: <strong>{displayMoney(active.quote.minimum)} EURC</strong></p><p>{now >= active.quote.expiresAt ? 'Approval expired — request a fresh quote.' : `Approve within ${Math.max(0, Math.ceil((active.quote.expiresAt - now) / 1000))}s`}</p><ul>{active.quote.fees.map((fee, i) => <li key={i}>{fee.type ?? 'Provider'} fee: {fee.amount} {fee.token}</li>)}</ul></div>}
          {active.error && <div className="notice error" role="alert"><CircleAlert size={19} /><span>{active.error}</span></div>}
          <div className="live-actions">
            {active.status === 'created' && <><p>CCTP burns the source USDC and mints it on Arc. Allow up to 0.01 USDC protocol fee plus network gas; standard attestation can take several minutes.</p><button className="button primary full" disabled={disabled} onClick={() => void post(`/payments/${active.id}/bridge`)}>Approve CCTP funding</button></>}
            {['funded','quoted'].includes(active.status) && <button className={`button ${active.status === 'funded' || quoteExpired ? 'primary' : 'secondary'} full`} disabled={disabled} onClick={() => void post(`/payments/${active.id}/quote`)}>{working === 'quote' ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}{active.quote ? 'Refresh quote' : 'Get live swap quote'}</button>}
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
    {notice && <div className="live-feedback" role="status"><CheckCheck size={18} aria-hidden="true" />{notice}</div>}
  </div>;
}
