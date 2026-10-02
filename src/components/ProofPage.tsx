import { ArrowUpRight, CheckCheck, ExternalLink, Shield } from 'lucide-react';
import { Brand } from './ui.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

type TxProof = {
  step: string;
  chain: 'arc' | 'base';
  hash: string;
  status: string;
  blockNumber?: string;
  gasNativeUnits?: string;
};

type PaymentProof = {
  reference: string;
  status: string;
  source: string;
  sender: string;
  recipient: string;
  sourceUSDC: string;
  fundedUSDC?: string;
  minimumEURC: string;
  paidEURC: string;
  transactions: TxProof[];
};

const explorerBase = {
  arc: 'https://testnet.arcscan.app/tx/',
  base: 'https://sepolia.basescan.org/tx/',
};

const stepLabels: Record<string, string> = {
  bridge_approve: 'CCTP approval',
  burn: 'Base USDC burn (CCTP)',
  mint: 'Arc USDC mint (CCTP)',
  'swap_approve:1': 'Swap approval (attempt 1)',
  'swap_approve:2': 'Swap approval (attempt 2)',
  'swap:1': 'USDC → EURC swap (attempt 1)',
  'swap:2': 'USDC → EURC swap (attempt 2)',
  'pay:1': 'EURC → recipient transfer',
};

const stepLabel = (step: string) => stepLabels[step] ?? step.replaceAll('_', ' ').replace(/:\d+$/, '');

const chainLabel = (chain: string) => chain === 'arc' ? 'Arc Testnet' : 'Base Sepolia';

const short = (hash: string) => `${hash.slice(0, 10)}…${hash.slice(-8)}`;
const shortAddr = (addr: string) => `${addr.slice(0, 10)}…${addr.slice(-8)}`;

// Proof data — baked in from docs/TESTNET_PROOF.json (read-only, no private data)
const PROOF: { verifiedAt: string; payments: PaymentProof[] } = {
  verifiedAt: '2026-09-27T06:49:14.496Z',
  payments: [
    {
      reference: 'ARC-PROOF-001',
      status: 'reconciled',
      source: 'arc',
      sender: '0x4a10873399f19F43Fc7fa02C8Ddc83FbFBFAeB34',
      recipient: '0xcD407427098Cc241708cF348456FCE0997d8de20',
      sourceUSDC: '1',
      minimumEURC: '0.813844',
      paidEURC: '0.822060',
      transactions: [
        { step: 'swap_approve:1', chain: 'arc', hash: '0x62a5e81310fa78fee3c7cc1604ef54a37f9545d5875386c79b1de6ddfab6cddf', status: 'success', blockNumber: '64221611' },
        { step: 'swap_approve:2', chain: 'arc', hash: '0x0572a0e841c4dd22cb0f172fa1dc6027b61986f0c47b3a8f0b09cd6b880983f5', status: 'success', blockNumber: '64222073' },
        { step: 'swap:2', chain: 'arc', hash: '0x9d84d0576c190534b46f2b256f9ad883e3faab28584bd809e2c74f209083183b', status: 'success', blockNumber: '64222086' },
        { step: 'pay:1', chain: 'arc', hash: '0xb557b9a922edfd1ca267246bba9083083399a4d43bee010f22e64d33750bb30a', status: 'success', blockNumber: '64222453' },
      ],
    },
    {
      reference: 'CCTP-PROOF-001',
      status: 'reconciled',
      source: 'base',
      sender: '0x4a10873399f19F43Fc7fa02C8Ddc83FbFBFAeB34',
      recipient: '0xcD407427098Cc241708cF348456FCE0997d8de20',
      sourceUSDC: '1',
      fundedUSDC: '1',
      minimumEURC: '0.813463',
      paidEURC: '0.822252',
      transactions: [
        { step: 'bridge_approve', chain: 'base', hash: '0xd3e77ac3e92bb2a5f4803c7fff05e7b9c14be1b2f9de4d215e80190450d3f24f', status: 'success', blockNumber: '47360896' },
        { step: 'burn', chain: 'base', hash: '0x1b5e955ed53db1d408fa2a85cb703f0bc3e92d8c5e1c390b6ef749d4c26021ee', status: 'success', blockNumber: '47360897' },
        { step: 'mint', chain: 'arc', hash: '0x923c36c1350cc7f5ad9c37d286ac18164cc9fd1ab8dd397faca09f95e456bc17', status: 'success', blockNumber: '64229038' },
        { step: 'swap_approve:1', chain: 'arc', hash: '0x4e5a59c10be7d1bd3677f62b9b1738c7e7e50171b9fcdaa62c605961b989ef61', status: 'success', blockNumber: '64229214' },
        { step: 'swap:1', chain: 'arc', hash: '0x651c524597c6eb10dbb4a33bd0cdf39668d62ee28b430aca44875b791983c89a', status: 'success', blockNumber: '64229219' },
        { step: 'pay:1', chain: 'arc', hash: '0xd205320e3092980f42dfe5dfb884fccd3468db3084b9f99883237d9f189f50d3', status: 'success', blockNumber: '64229271' },
      ],
    },
  ],
};

const routeLabel = (source: string) =>
  source === 'base' ? 'Base Sepolia → CCTP → Arc Testnet' : 'Direct · Arc Testnet';

export function ProofPage({ onBack }: { onBack: () => void }) {
  const verifiedDate = new Date(PROOF.verifiedAt).toLocaleString('en', {
    dateStyle: 'long', timeStyle: 'short',
  });

  return (
    <div className="proof-page">
      {/* Nav */}
      <header className="landing-nav">
        <Brand />
        <nav className="landing-nav-links">
          <ThemeToggle />
          <button className="landing-link" onClick={onBack}>← Back</button>
          <button className="button primary" onClick={onBack}>Try the demo</button>
        </nav>
      </header>

      <div className="proof-page-content">
        <div className="proof-page-header">
          <span className="landing-section-label">VERIFIED ONCHAIN TRANSACTIONS</span>
          <h1 className="proof-page-h1">Two reconciled testnet payments</h1>
          <p className="proof-page-sub">
            All receipts independently verified by reading public Arc Testnet and Base Sepolia RPC endpoints.
            These are real transactions — not simulated. Tokens are test assets with no monetary value.
          </p>
          <div className="proof-verified-at">
            <Shield size={15} />
            <span>Last verified: {verifiedDate} · <code>node scripts/verify-testnet.mjs</code></span>
          </div>
        </div>

        {PROOF.payments.map(payment => (
          <section key={payment.reference} className="proof-payment-section">
            <div className="proof-payment-header">
              <div className="proof-payment-title">
                <span className="proof-ref-badge">{payment.reference}</span>
                <span className="proof-status-badge"><CheckCheck size={13} /> Reconciled</span>
              </div>
              <span className="proof-route">{routeLabel(payment.source)}</span>
            </div>

            <dl className="proof-summary-grid">
              <div className="proof-summary-item">
                <dt>Source input</dt>
                <dd>{payment.sourceUSDC} USDC</dd>
              </div>
              {payment.fundedUSDC && (
                <div className="proof-summary-item">
                  <dt>Arrived after bridge</dt>
                  <dd>{payment.fundedUSDC} USDC</dd>
                </div>
              )}
              <div className="proof-summary-item">
                <dt>Minimum approved</dt>
                <dd>{payment.minimumEURC} EURC</dd>
              </div>
              <div className="proof-summary-item highlight">
                <dt>Recipient received</dt>
                <dd>{payment.paidEURC} EURC</dd>
              </div>
              <div className="proof-summary-item full">
                <dt>Sender</dt>
                <dd className="proof-addr">{shortAddr(payment.sender)}</dd>
              </div>
              <div className="proof-summary-item full">
                <dt>Recipient</dt>
                <dd className="proof-addr">{shortAddr(payment.recipient)}</dd>
              </div>
            </dl>

            <h3 className="proof-tx-heading">Transaction receipts</h3>
            <div className="proof-tx-list">
              {payment.transactions.map(tx => (
                <a
                  key={tx.hash}
                  className="proof-tx-row"
                  href={`${explorerBase[tx.chain]}${tx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="proof-tx-left">
                    <span className={`proof-tx-chain ${tx.chain}`}>{chainLabel(tx.chain)}</span>
                    <span className="proof-tx-step">{stepLabel(tx.step)}</span>
                  </div>
                  <div className="proof-tx-right">
                    <code className="proof-tx-hash">{short(tx.hash)}</code>
                    {tx.blockNumber && <span className="proof-tx-block">block {parseInt(tx.blockNumber).toLocaleString()}</span>}
                    <span className={`proof-tx-status ${tx.status}`}>{tx.status}</span>
                    <ExternalLink size={14} className="proof-tx-icon" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <div className="proof-note">
          <Shield size={16} />
          <div>
            <strong>About these transactions</strong>
            <p>
              <code>ARC-PROOF-001</code> funded directly on Arc Testnet. <code>CCTP-PROOF-001</code> burned on Base Sepolia and minted on Arc — standard attestation took approximately 24 minutes.
              Both payments used 1 USDC input and paid the variable EURC output to a local test recipient wallet.
              Rates reflect test-pool liquidity, not market FX. CCTP charged zero token fee for the bridge; network gas and the swap provider fee were separate.
            </p>
            <div className="proof-note-links">
              <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer">Arc Testnet explorer <ArrowUpRight size={13} /></a>
              <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer">Base Sepolia explorer <ArrowUpRight size={13} /></a>
              <a href="https://docs.arc.io/app-kit/swap" target="_blank" rel="noreferrer">Arc Swap Kit docs <ArrowUpRight size={13} /></a>
              <a href="https://developers.circle.com/cctp" target="_blank" rel="noreferrer">CCTP docs <ArrowUpRight size={13} /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
