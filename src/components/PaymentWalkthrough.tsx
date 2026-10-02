import { useState, type RefObject } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, CheckCheck, FileText, FlaskConical, RefreshCw, Send, Wallet } from 'lucide-react';
import { displayMoney } from '../domain.ts';

const steps = [
  { title: 'Start with an invoice', short: 'Invoice', icon: FileText, description: 'Imagine Studio North sent you an invoice. Choose how many demo dollar tokens you want to convert for their payment.', action: 'Create demo invoice', lesson: 'An invoice tells you who to pay and gives the payment a reference you can find later.' },
  { title: 'Give your payment a starting point', short: 'Add funds', icon: Wallet, description: 'Add pretend digital dollars to your wallet. We’ll include enough for this payment and the example conversion fee.', action: 'Add demo dollars', lesson: 'USDC is a digital dollar token. Funding means adding tokens to the wallet that will make the payment.' },
  { title: 'Check the numbers. Then approve.', short: 'Convert', icon: RefreshCw, description: 'Studio North receives euro tokens. Review this practice quote to see what your dollar tokens become before you approve.', action: 'Approve demo conversion', lesson: 'A quote is a preview of the exchange. You approve it before conversion. This fixed demo rate is illustrative; testnet rates and fees vary.' },
  { title: 'The euros are ready to send', short: 'Pay', icon: Send, description: 'Your wallet now holds the converted euro tokens. Send them to Studio North’s sample wallet to complete the payment.', action: 'Send demo payment', lesson: 'Changing currency and paying someone are two separate steps. EURC is the euro token the recipient receives.' },
  { title: 'Put the payment and invoice together', short: 'Match', icon: CheckCheck, description: 'Studio North has received the demo payment. Link its receipt to the invoice so your records tell the whole story.', action: 'Match invoice & payment', lesson: 'Matching is also called reconciliation. It updates the records; it doesn’t move money again.' },
];

export function PaymentWalkthrough({ titleRef }: { titleRef: RefObject<HTMLHeadingElement | null> }) {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(50);
  const source = BigInt(amount) * 1_000_000n;
  const output = source * 915n / 1000n;
  const fee = 250_000n;
  const dollars = step === 2 ? source + fee : 0n;
  const euros = step === 3 ? output : 0n;
  const received = step >= 4 ? output : 0n;
  const complete = step === steps.length;
  const current = steps[Math.min(step, steps.length - 1)];
  const Icon = complete ? CheckCheck : current.icon;
  function restart() { setStep(0); setAmount(50); }

  return <section id="payment-playground" className="learn-desk" aria-labelledby="playground-title">
    <div className="learn-heading"><div><span className="home-kicker">THE CLICK-THROUGH FIELD GUIDE</span><h2 id="playground-title" ref={titleRef} tabIndex={-1}>One small payment.<br /><em>Try the whole journey.</em></h2><p>Meet Studio North, your pretend supplier. You click. We’ll show you what happens.</p></div><span className="learn-demo-label"><FlaskConical size={16} aria-hidden="true" /> Simulation · no real funds</span></div>
    <div className="learn-layout">
      <div className="learn-route"><ol className="learn-steps" aria-label="Payment journey">{steps.map((item, index) => <li key={item.short} className={index < step ? 'done' : index === step ? 'current' : ''} aria-current={index === step ? 'step' : undefined}><span className="learn-step-number">{index < step ? <Check size={16} aria-hidden="true" /> : `0${index + 1}`}</span><div><strong>{item.short}</strong><span>{index < step ? 'Complete' : index === step ? 'Try this step' : 'Up next'}</span></div></li>)}</ol><button className="learn-reset" onClick={restart}><RefreshCw size={14} aria-hidden="true" /> Restart walkthrough</button></div>
      <div className="learn-stage">
        <div className="learn-stage-top"><span>PRACTICE PAYMENT / CL-DEMO-001</span><span>{complete ? 'All 5 steps complete' : `Step ${step + 1} of 5`}</span></div>
        <div className="learn-stage-copy" key={step}><span className={`learn-stage-icon ${complete ? 'complete' : ''}`}><Icon size={24} aria-hidden="true" /></span><h3>{complete ? 'From to-do to done. Nicely matched.' : current.title}</h3><p>{complete ? 'You’ve funded, converted, paid, and matched a payment. Your invoice and receipt now live in one clear record.' : current.description}</p></div>
        {step === 0 && <fieldset className="learn-amounts"><legend>Choose a demo dollar amount</legend><div>{[25, 50, 100].map(value => <button key={value} aria-pressed={value === amount} onClick={() => setAmount(value)}>${value}</button>)}</div></fieldset>}
        {step < 2 && <div className="learn-invoice"><div><span>EXAMPLE INVOICE</span><strong>Studio North</strong><small>Design services · CL-DEMO-001</small></div><div><strong>${displayMoney(source)}</strong><small>USDC to convert</small></div></div>}
        {step === 2 && <div className="learn-quote"><div className="learn-exchange"><div><span>You convert</span><strong>${displayMoney(source)}</strong><small>digital dollars · USDC</small></div><ArrowRight size={22} aria-hidden="true" /><div><span>You receive</span><strong>€{displayMoney(output)}</strong><small>digital euros · EURC</small></div></div><dl><div><dt>Practice rate</dt><dd>1 USDC = 0.915 EURC</dd></div><div><dt>Example conversion fee</dt><dd>$0.25 USDC</dd></div><div><dt>Total demo dollars used</dt><dd>${displayMoney(source + fee)} USDC</dd></div></dl></div>}
        {step === 3 && <div className="learn-send"><span className="learn-recipient-avatar">SN</span><div><span>To Studio North’s sample wallet</span><strong>€{displayMoney(output)} <small>EURC</small></strong><span>Converted. Awaiting your send approval.</span></div></div>}
        {step >= 4 && <div className="learn-receipt"><div className="learn-receipt-head"><FileText size={18} aria-hidden="true" /><strong>Demo payment receipt</strong><span><Check size={14} aria-hidden="true" />{complete ? 'Matched' : 'Paid'}</span></div><dl><div><dt>Recipient</dt><dd>Studio North</dd></div><div><dt>Invoice reference</dt><dd>CL-DEMO-001</dd></div><div><dt>Recipient received</dt><dd>€{displayMoney(output)} EURC</dd></div><div><dt>Record</dt><dd>{complete ? 'Invoice + payment matched' : 'Ready to match to invoice'}</dd></div></dl><p>Practice receipt only · no onchain transaction</p></div>}
        <div className="learn-stage-actions"><button className="button primary learn-action" onClick={() => complete ? restart() : setStep(step + 1)}>{complete ? 'Start again' : current.action}{complete ? <RefreshCw size={16} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}</button>{step > 0 && !complete && <button className="home-text-button" onClick={() => setStep(step - 1)}><ArrowLeft size={15} aria-hidden="true" /> Back a step</button>}</div>
        <p className="learn-lesson"><strong>{complete ? 'You’ve got the idea.' : 'In everyday words'}</strong>{complete ? 'The full simulation workspace lets you create and import invoices, explore quotes, and export matched records. This walkthrough resets when you leave Home.' : current.lesson}</p>
      </div>
      <aside className="learn-money" aria-label="Demo money tracker"><span className="learn-tracker-title">FOLLOW THE MONEY</span><div className="learn-balances"><div><span><Wallet size={15} aria-hidden="true" /> Your demo wallet</span><strong>${displayMoney(dollars)} <small>USDC</small></strong><strong>€{displayMoney(euros)} <small>EURC</small></strong></div><div className="learn-money-arrow"><ArrowDown size={19} aria-hidden="true" /><span>{step >= 4 ? 'Demo payment delivered' : 'Your approval comes first'}</span></div><div><span><span className="learn-mini-avatar">SN</span> Studio North</span><strong>€{displayMoney(received)} <small>EURC received</small></strong></div></div><p className="learn-money-note">{step === 0 ? 'Watch the balances change as you click through each step.' : step === 1 ? 'Invoice created. Next, add funds to your demo wallet.' : step === 2 ? 'Demo dollars added, including $0.25 for the example fee.' : step === 3 ? 'Conversion complete. The example fee was deducted; euros are still in your wallet.' : step === 4 ? 'Payment sent. The euros are now with Studio North.' : 'Record matched. The balances stay the same.'}</p><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{complete ? 'Walkthrough complete. Demo payment matched.' : `Step ${step + 1} of 5: ${current.title}`}</span></aside>
    </div>
    <p className="learn-bottom-note">Illustrative rate and fee. This page teaches the payment flow; it doesn’t create workspace records or send tokens.</p>
  </section>;
}
