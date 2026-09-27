import { formatUnits, validateInput } from './domain.ts';
import type { Payment, PaymentInput } from './domain.ts';

export const IMPORT_TEMPLATE = 'reference,counterparty,amount,currency\r\nINV-2001,Acme Europe,2500.00,USDC\r\nINV-2002,Harbor Studio,1250.50,USDC\r\n';

function readRows(text: string): string[][] {
  if (text.length > 1_000_000) throw new Error('CSV must be smaller than 1 MB.');
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += c;
    } else if (c === '"') {
      if (field || closed) throw new Error('Malformed CSV: quote inside an unquoted field.');
      quoted = true;
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false;
      if (c !== ',') {
        if (row.length > 1 || row.some(cell => cell.trim())) rows.push(row);
        row = [];
        if (c === '\r' && input[i + 1] === '\n') i++;
      }
    } else {
      if (closed) throw new Error('Malformed CSV: unexpected text after closing quote.');
      field += c;
    }
  }
  if (quoted) throw new Error('Malformed CSV: unclosed quoted field.');
  row.push(field);
  if (row.length > 1 || row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function parseImport(text: string, existing: Payment[]): PaymentInput[] {
  const rows = readRows(text);
  const header = rows.shift()?.map(s => s.trim().toLowerCase());
  if (header?.join(',') !== 'reference,counterparty,amount,currency') throw new Error('CSV header must be: reference,counterparty,amount,currency');
  if (!rows.length || rows.length > 500) throw new Error('Include between 1 and 500 payment rows.');
  const seen = new Set(existing.map(p => p.reference.toLowerCase()));
  return rows.map((row, i) => {
    try {
      if (row.length !== 4) throw new Error('Expected exactly four columns.');
      const [reference, counterparty, amount, currency] = row.map(s => s.trim());
      if (currency !== 'USDC') throw new Error('Only USDC source currency is supported.');
      const input = validateInput({ reference, counterparty, amount, scenario: 'success' });
      const key = input.reference.toLowerCase();
      if (seen.has(key)) throw new Error(`Duplicate reference: ${reference}.`);
      seen.add(key);
      return input;
    } catch (error) {
      throw new Error(`CSV row ${i + 2}: ${(error as Error).message} Nothing was imported.`);
    }
  });
}

function csvCell(value: string): string {
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportPayments(payments: Payment[]): string {
  const header = ['reference', 'counterparty', 'source_amount', 'source_currency', 'quoted_target_amount', 'target_currency', 'quoted_fee_usdc', 'status', 'settlement_id', 'created_at', 'settled_at', 'environment'];
  const rows = payments.map(p => [p.reference, p.counterparty, formatUnits(p.amount), 'USDC', p.quote ? formatUnits(p.quote.toAmount) : '', 'EURC', p.quote ? formatUnits(p.quote.fee) : '', p.status, p.settlementId ?? '', new Date(p.createdAt).toISOString(), p.settledAt ? new Date(p.settledAt).toISOString() : '', 'simulation']);
  return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadFile(name: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
