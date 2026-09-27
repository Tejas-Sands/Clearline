import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight, Check, Clock3, CircleAlert, X } from 'lucide-react';
import { STATUS_LABELS } from '../domain.ts';
import type { Payment } from '../domain.ts';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 8h30L22 20H5zm0 15h17L9 35H5z" fill="currentColor" /></svg>{!compact && <span>clearline<span className="brand-dot">.</span></span>}</span>;
}

export function StatusBadge({ payment, now = Date.now() }: { payment: Payment; now?: number }) {
  const expired = payment.status === 'quoted' && payment.quote && payment.quote.expiresAt <= now;
  const status = expired ? 'expired' : payment.status;
  const Icon = ['settled', 'reconciled'].includes(status) ? Check : ['unknown', 'needs_funds', 'expired'].includes(status) ? CircleAlert : Clock3;
  return <span className={`status status-${status}`}><Icon size={12} aria-hidden="true" />{expired ? 'Quote expired' : STATUS_LABELS[payment.status]}</span>;
}

export function Modal({ title, children, onClose, drawer = false, subtitle }: { title: string; children: ReactNode; onClose: () => void; drawer?: boolean; subtitle?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const before = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => { element.close(); before?.focus(); };
  }, []);
  return <dialog ref={dialog} className={drawer ? 'modal drawer' : 'modal'} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><header className="modal-header"><div><span className="eyebrow">CLEARLINE / SIMULATION</span><h2 id="dialog-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header>{children}</div>
  </dialog>;
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><Check size={24} /><h3>{title}</h3><p>{children}</p></div>;
}

export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button className="text-button" onClick={onClick}>{children}<ArrowUpRight size={15} aria-hidden="true" /></button>;
}

export function formatDate(at: number, withTime = false) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(at);
}
