import { ArrowRight, ArrowUpRight, CheckCheck, Clock, Globe, RefreshCw, Shield, Zap } from 'lucide-react';
import { Brand } from './ui.tsx';

const steps = [
  {
    number: '01',
    label: 'Invoice arrives',
    description: 'A supplier invoice is entered or imported. The obligation is recorded immediately.',
    token: 'INV',
    color: 'step-blue',
  },
  {
    number: '02',
    label: 'Fund in USDC',
    description: 'Pay from existing Arc USDC, or bridge from Base Sepolia via CCTP in one click.',
    token: 'USDC',
    color: 'step-teal',
  },
  {
    number: '03',
    label: 'Approve conversion',
    description: 'Get a live on-chain quote. Approve the minimum output you will accept. Quote is valid for 60 seconds.',
    token: 'USDC → EURC',
    color: 'step-green',
  },
  {
    number: '04',
    label: 'Pay the recipient',
    description: 'The exact converted EURC amount is transferred directly to the recipient wallet on Arc Testnet.',
    token: 'EURC',
    color: 'step-amber',
  },
  {
    number: '05',
    label: 'Reconcile',
    description: 'Each transaction hash is independently verifiable. Match the payment to its invoice and export.',
    token: '✓',
    color: 'step-settled',
  },
];

const proofs = [
  {
    ref: 'ARC-PROOF-001',
    route: 'Direct Arc',
    input: '1 USDC',
    output: '0.822060 EURC',
    txCount: 4,
    highlight: 'Swap + recipient payout in a single workflow',
  },
  {
    ref: 'CCTP-PROOF-001',
    route: 'Base → CCTP → Arc',
    input: '1 USDC',
    output: '0.822252 EURC',
    txCount: 6,
    highlight: 'Cross-chain bridge, swap, and payout — all verified',
  },
];

export function Landing({ onDemo, onProof }: { onDemo: () => void; onProof: () => void }) {
  return (
    <div className="landing">
      {/* Nav */}
      <header className="landing-nav">
        <Brand />
        <nav className="landing-nav-links">
          <button className="landing-link" onClick={onProof}>Verified transactions</button>
          <button className="button primary" onClick={onDemo}>Try the demo</button>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Arc Testnet · two reconciled payments verified onchain
          </div>
          <h1 className="landing-h1">
            Stablecoin invoice<br />
            payments, <em>end to end</em>.
          </h1>
          <p className="landing-subtitle">
            Clearline moves supplier invoices from obligation to settled EURC recipient payment — with every bridge, conversion, and payout independently verifiable onchain.
          </p>
          <div className="landing-hero-actions">
            <button className="button primary landing-cta" id="try-demo-btn" onClick={onDemo}>
              Try the guided demo <ArrowRight size={18} />
            </button>
            <button className="landing-proof-link" onClick={onProof}>
              View verified transactions <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="landing-stats">
            <div className="landing-stat">
              <strong>2</strong>
              <span>Reconciled testnet payments</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <strong>10</strong>
              <span>Independently verified receipts</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <strong>USDC → EURC</strong>
              <span>Arc Testnet · Circle Swap Kit</span>
            </div>
          </div>
        </div>

        {/* Hero visual — payment card preview */}
        <div className="landing-hero-card" aria-hidden="true">
          <div className="hero-card-inner">
            <div className="hero-card-header">
              <span className="hero-eyebrow">PAYMENT JOURNEY</span>
              <span className="hero-status settled">Reconciled</span>
            </div>
            <div className="hero-card-ref">ARC-PROOF-001</div>
            <div className="hero-flow">
              <div className="hero-flow-step">
                <span className="hero-flow-token usdc">USDC</span>
                <span className="hero-flow-amount">1.00</span>
                <span className="hero-flow-label">Source</span>
              </div>
              <div className="hero-flow-arrow"><ArrowRight size={16} /></div>
              <div className="hero-flow-step">
                <span className="hero-flow-token swap">↔</span>
                <span className="hero-flow-amount">Swap</span>
                <span className="hero-flow-label">Arc Testnet</span>
              </div>
              <div className="hero-flow-arrow"><ArrowRight size={16} /></div>
              <div className="hero-flow-step">
                <span className="hero-flow-token eurc">EURC</span>
                <span className="hero-flow-amount">0.8221</span>
                <span className="hero-flow-label">Recipient paid</span>
              </div>
            </div>
            <div className="hero-card-txs">
              <div className="hero-tx"><CheckCheck size={13} /><span>swap · Arc</span></div>
              <div className="hero-tx"><CheckCheck size={13} /><span>pay · Arc</span></div>
              <div className="hero-tx verified"><Shield size={13} /><span>reconciled</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment journey steps */}
      <section className="landing-journey">
        <div className="landing-section-label">THE COMPLETE JOURNEY</div>
        <h2 className="landing-h2">From invoice to recipient — nothing skipped.</h2>
        <p className="landing-section-sub">Each stage produces an onchain receipt. The guided demo walks you through all five.</p>
        <div className="journey-steps">
          {steps.map(step => (
            <div key={step.number} className={`journey-step ${step.color}`}>
              <div className="journey-step-number">{step.number}</div>
              <div className="journey-step-token">{step.token}</div>
              <h3 className="journey-step-label">{step.label}</h3>
              <p className="journey-step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof highlights */}
      <section className="landing-proof-section">
        <div className="landing-section-label">VERIFIED ONCHAIN</div>
        <h2 className="landing-h2">Two complete payments. Every transaction confirmed.</h2>
        <p className="landing-section-sub">Independent RPC verification — not simulated. These are real testnet transactions.</p>
        <div className="proof-cards">
          {proofs.map(p => (
            <div key={p.ref} className="proof-highlight-card">
              <div className="proof-highlight-top">
                <span className="proof-highlight-ref">{p.ref}</span>
                <span className="proof-highlight-route">{p.route}</span>
              </div>
              <div className="proof-highlight-amounts">
                <div>
                  <span>Input</span>
                  <strong>{p.input}</strong>
                </div>
                <ArrowRight size={16} className="proof-arrow" />
                <div>
                  <span>Recipient received</span>
                  <strong>{p.output}</strong>
                </div>
              </div>
              <div className="proof-highlight-note">
                <CheckCheck size={14} />
                <span>{p.highlight} · {p.txCount} receipts</span>
              </div>
            </div>
          ))}
        </div>
        <button className="button secondary landing-view-proof" onClick={onProof}>
          Inspect all transactions <ArrowUpRight size={15} />
        </button>
      </section>

      {/* Why Clearline */}
      <section className="landing-why">
        <div className="landing-section-label">WHY CLEARLINE</div>
        <h2 className="landing-h2">Beyond a bridge or swap UI.</h2>
        <div className="why-grid">
          <div className="why-card">
            <span className="why-icon"><Shield size={22} /></span>
            <h3>Receipt-first architecture</h3>
            <p>Transactions are signed and journaled before broadcast. Each stage verifies its own receipt before advancing.</p>
          </div>
          <div className="why-card">
            <span className="why-icon"><Globe size={22} /></span>
            <h3>Cross-chain by default</h3>
            <p>Bridge USDC from Base Sepolia via CCTP or fund directly on Arc. The payment engine handles both paths.</p>
          </div>
          <div className="why-card">
            <span className="why-icon"><Zap size={22} /></span>
            <h3>Recipient payment included</h3>
            <p>Conversion to EURC and delivery to the supplier's wallet are separate, verified steps — not a treasury balance update.</p>
          </div>
          <div className="why-card">
            <span className="why-icon"><RefreshCw size={22} /></span>
            <h3>Crash-safe recovery</h3>
            <p>Server restarts replay the same signed bytes. No duplicate transactions. Reverted bridge stages can be retried safely.</p>
          </div>
          <div className="why-card">
            <span className="why-icon"><Clock size={22} /></span>
            <h3>Approval-controlled workflow</h3>
            <p>Every conversion requires an explicit quote approval with a 60-second expiry. Invoices and reconciliation stay in sync.</p>
          </div>
          <div className="why-card">
            <span className="why-icon"><CheckCheck size={22} /></span>
            <h3>Auditable reconciliation</h3>
            <p>Every payment links its invoice reference to onchain receipts. Export a CSV with explorer links for full audit trail.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-cta-inner">
          <h2>Ready to explore the flow?</h2>
          <p>The interactive demo runs entirely in your browser — no wallet required. The verified transactions page shows real onchain proof.</p>
          <div className="landing-hero-actions">
            <button className="button primary landing-cta" onClick={onDemo}>
              Start guided demo <ArrowRight size={17} />
            </button>
            <button className="landing-proof-link light" onClick={onProof}>
              View verified transactions <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <Brand compact />
        <span>Clearline · stablecoin payment operations desk</span>
        <span>Arc Testnet · Base Sepolia · USDC → EURC</span>
      </footer>
    </div>
  );
}
