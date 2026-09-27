import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, FileSpreadsheet, Upload, Download, CircleAlert, CheckCircle2 } from 'lucide-react';
import type { Payment, PaymentInput, Scenario } from '../domain.ts';
import { parseUnits } from '../domain.ts';
import { IMPORT_TEMPLATE, downloadFile, parseImport } from '../csv.ts';

export function PaymentForm({ onSubmit }: { onSubmit: (input: PaymentInput) => void }) {
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try { onSubmit({ reference: String(data.get('reference')), counterparty: String(data.get('counterparty')), amount: String(data.get('amount')), scenario: String(data.get('scenario')) as Scenario }); }
    catch (err) { setError((err as Error).message); }
  }
  return <form onSubmit={submit} className="form-body">
    <div className="pair-banner"><span className="currency-icon usd">$</span><div><strong>USDC</strong><span>Source currency</span></div><ArrowRight size={20} aria-hidden="true" /><span className="currency-icon eur">€</span><div><strong>EURC</strong><span>Settlement currency</span></div></div>
    <label>Counterparty<input name="counterparty" placeholder="e.g. Acme Europe" required maxLength={100} autoFocus /></label>
    <div className="form-grid"><label>Invoice reference<input name="reference" placeholder="INV-2001" required maxLength={60} /></label><label>Source amount (USDC)<input name="amount" inputMode="decimal" placeholder="2500.00" required /></label></div>
    <label>Simulation scenario<select name="scenario" defaultValue="success"><option value="success">Successful settlement</option><option value="delayed">Counterparty funding delay</option><option value="unknown">Uncertain provider response</option></select></label>
    <p className="form-hint">This creates a payment obligation. You’ll review a quote before approving the simulated conversion. Counterparties are labels; no beneficiary payout is made.</p>
    {error && <p className="form-error" role="alert"><CircleAlert size={16} />{error}</p>}
    <button type="submit" className="button primary full">Create payment <ArrowRight size={16} /></button>
  </form>;
}

export function ImportForm({ existing, onImport }: { existing: Payment[]; onImport: (inputs: PaymentInput[]) => void }) {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  let preview: PaymentInput[] = [];
  let validation = '';
  if (csv.trim()) { try { preview = parseImport(csv, existing); } catch (e) { validation = (e as Error).message; } }
  return <div className="form-body"><button className="button secondary full" onClick={() => downloadFile('clearline-import-template.csv', IMPORT_TEMPLATE)}><Download size={16} />Download sample CSV</button>
    <label className="upload-zone"><Upload size={25} /><strong>{fileName || 'Choose a CSV file'}</strong><span>Up to 500 payments · 1 MB maximum</span><input type="file" accept=".csv,text/csv" aria-label="Upload payment CSV" onChange={async e => {
      const file = e.target.files?.[0]; if (!file) return;
      setError(''); setCsv(''); setFileName('');
      if (file.size > 1_000_000) { setError('Choose a CSV file smaller than 1 MB.'); return; }
      try { setCsv(await file.text()); setFileName(file.name); } catch { setError('Unable to read this file. Try again or paste the CSV below.'); }
    }} /></label>
    <label>Or paste CSV<textarea value={csv} onChange={e => { setCsv(e.target.value); setFileName(''); setError(''); }} rows={6} placeholder={IMPORT_TEMPLATE} spellCheck={false} /></label>
    {validation && <p className="form-error" role="alert"><CircleAlert size={16} />{validation}</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {!!preview.length && <div className="notice success"><CheckCircle2 size={18} /><span><strong>{preview.length} payments ready to import.</strong> References and amounts have been validated.</span></div>}
    <p className="form-hint">All rows must be valid. Existing invoice references are never imported twice. Imported payments use the successful-settlement scenario.</p>
    <button className="button primary full" disabled={!preview.length || !!validation || !!error} onClick={() => { try { onImport(preview); } catch (e) { setError((e as Error).message); } }}><FileSpreadsheet size={16} />Import {preview.length || ''} payments</button>
  </div>;
}

export function FundingForm({ onFund }: { onFund: (amount: string) => void }) {
  const [amount, setAmount] = useState('50000');
  const [error, setError] = useState('');
  return <form className="form-body" onSubmit={e => { e.preventDefault(); try { parseUnits(amount); onFund(amount); } catch (err) { setError((err as Error).message); } }}>
    <div className="notice"><CircleAlert size={20} /><span>Demo funds are local numbers. This does not connect to a wallet or deposit real USDC.</span></div>
    <label>Amount (USDC)<input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" required autoFocus /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button primary full" type="submit">Add demo funds <ArrowRight size={16} /></button>
  </form>;
}
