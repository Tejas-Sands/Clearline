import { useRef } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, FileText, MoveRight, Wallet } from 'lucide-react';
import { Brand } from './ui.tsx';
import { PaymentWalkthrough } from './PaymentWalkthrough.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import './landing.css';

export function Landing({ onDemo, onProof, onTestnet }: { onDemo: () => void; onProof: () => void; onTestnet: () => void }) {
  const playgroundTitle = useRef<HTMLHeadingElement>(null);
  function tryPayment() {
    playgroundTitle.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    playgroundTitle.current?.focus({ preventScroll: true });
  }

  return <div className="landing home-guide">
    <a className="skip-link" href="#home-content">Skip to content</a>
    <header className="home-nav"><Brand /><nav aria-label="Home navigation"><button className="home-text-button home-proof-nav" onClick={onProof}>Verified transactions <ArrowUpRight size={14} aria-hidden="true" /></button><ThemeToggle /><button className="button secondary" onClick={onDemo}>Open workspace <ArrowUpRight size={15} aria-hidden="true" /></button></nav></header>
    <main id="home-content" className="home-content" tabIndex={-1}>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy"><span className="home-kicker"><span /> A LITTLE LESS MYSTERY. A LOT MORE CLARITY.</span><h1 id="home-title">A clear path<br />from <em>“to pay”</em><br />to <em>“all paid.”</em></h1><p>Pay a supplier. Change dollars to euros. Keep the paperwork together. Clearline helps you follow every step.</p><button className="button primary home-main-cta" onClick={tryPayment}>Try a payment, step by step <ArrowDown size={18} aria-hidden="true" /></button><span className="home-small-note">A hands-on example. No wallet. No real money.</span></div>
        <div className="home-illustration" role="img" aria-label="An invoice follows a clear path from your digital dollars to a supplier’s digital euros and a matched payment record.">
          <span className="home-illustration-caption">EVERY PAYMENT HAS A STORY</span>
          <div className="home-paper"><FileText size={24} aria-hidden="true" /><span>FROM YOUR TO-DO LIST</span><strong>Pay Studio North</strong><div className="home-paper-line" /><div className="home-paper-line short" /><span className="home-paper-total">$50.00 <small>sample invoice</small></span></div>
          <svg className="home-path" viewBox="0 0 480 380" fill="none" aria-hidden="true"><path d="M130 130 C65 145 55 230 135 241 L338 241 C435 241 441 332 354 338 L226 338" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" /><path d="m239 330-13 8 13 8" stroke="currentColor" strokeWidth="2" /></svg>
          <div className="home-currency home-dollar"><span>$</span><div><strong>Your dollars</strong><small>USDC</small></div></div><span className="home-change"><MoveRight size={20} aria-hidden="true" /> change currency</span><div className="home-currency home-euro"><span>€</span><div><strong>Their euros</strong><small>EURC</small></div></div><div className="home-paid-stamp"><Check size={20} aria-hidden="true" /> Paid. Matched. Clear.</div><span className="home-margin-note">You’re in control<br />at every turn.</span>
        </div>
      </section>
      <section className="home-capabilities" aria-label="What you can do with Clearline"><span>ONE DESK. THE WHOLE JOURNEY.</span><p><FileText size={18} aria-hidden="true" /> Record an invoice</p><ArrowRight size={16} aria-hidden="true" /><p><Wallet size={18} aria-hidden="true" /> Convert & pay</p><ArrowRight size={16} aria-hidden="true" /><p><Check size={18} aria-hidden="true" /> Match & export</p></section>
      <PaymentWalkthrough titleRef={playgroundTitle} />
      <section className="home-explainer" aria-labelledby="home-explainer-title">
        <div><span className="home-kicker">THE WORDS, WITHOUT THE HEADACHE</span><h2 id="home-explainer-title">New to this?<br /><em>You’re in the right place.</em></h2><p>You don’t need to know the technology to try the example. Here’s a little context when you want it.</p></div>
        <div className="home-faq">
          <details><summary>What are USDC and EURC?</summary><p>They’re digital tokens called stablecoins, designed to track the US dollar and euro. USDC is the dollar side; EURC is the euro side. They move between digital wallets rather than bank accounts.</p></details>
          <details><summary>What is a wallet?</summary><p>A wallet is a way to hold and send digital tokens. Think of its address as the delivery address for a payment. This walkthrough uses pretend balances, so you don’t need a wallet.</p></details>
          <details><summary>What does “matching” a payment mean?</summary><p>It means linking a completed payment to the invoice it belongs to. Accountants call this reconciliation. It organizes your records and doesn’t send any more money.</p></details>
          <details><summary>Is this sending real money?</summary><p>This page is a practice example only. The simulation workspace also uses pretend funds. The separate testnet workspace uses test tokens on experimental networks; it isn’t a service for paying real invoices.</p></details>
          <details><summary>Can I pay an exact euro invoice?</summary><p>Today, you choose the dollar-token amount to convert, and the euro-token output depends on the quote. Clearline doesn’t yet guarantee settlement of an exact euro invoice. This example uses a fixed practice rate; testnet quotes vary.</p></details>
        </div>
      </section>
      <section className="home-next" aria-labelledby="home-next-title">
        <div><span className="home-kicker">YOUR NEXT STEP</span><h2 id="home-next-title">A little practice.<br />A lot more confidence.</h2><p>Explore sample invoices, try different scenarios, and export your records in the full simulation workspace.</p><button id="try-demo-btn" className="button primary" onClick={onDemo}>Explore the simulation <ArrowRight size={17} aria-hidden="true" /></button></div>
        <div className="home-next-links"><article><span className="home-option-label">FOR THE CURIOUS</span><h3>See a payment on a test network</h3><p>Use free test tokens and approve each step in the separate testnet workspace.</p><button className="home-text-button" onClick={onTestnet}>Make a testnet payment <ArrowUpRight size={16} aria-hidden="true" /></button></article><article><span className="home-option-label">THE EVIDENCE</span><h3>Two journeys, recorded onchain</h3><p>Inspect the 10 transaction receipts from our two completed test payments, recorded September 27, 2026.</p><button className="home-text-button" onClick={onProof}>View verified transactions <ArrowUpRight size={16} aria-hidden="true" /></button></article></div>
      </section>
    </main>
    <footer className="home-footer"><Brand compact /><span>Every payment, a little clearer.</span><span>Practice first. Understand every step.</span></footer>
  </div>;
}
