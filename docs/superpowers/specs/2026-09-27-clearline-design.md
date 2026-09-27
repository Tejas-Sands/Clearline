# Clearline design

## Intent and authorization

The user requested the best six ideas as Markdown and directed us to select and build the best project in this folder. The previous recommendation supplies the scope: settlement operations for payment providers. Proceed inline under that authorization. This is a new architectural project. There is no existing application or usable Git repository to preserve.

## Approach

1. **Selected:** local React/TypeScript operations desk with a deterministic settlement simulator. Immediately usable without credentials; honest about what is demonstrated.
2. Real StableFX server integration: stronger institutional pilot, but needs account access, signing policies, persistence, and review of current provider contracts.
3. Documentation-only project: insufficient for the requested build.

## Product

Clearline provides an overview, payment queue, reconciliation workspace, activity history, and settings. Import obligations from CSV or enter one payment. Inspect a payment in a drawer, request an expiring USDC/EURC quote, approve a simulated trade, recover supported exceptions, and reconcile settled payments. Export accounting CSV and download an import template. Local data persists across reloads and can be reset explicitly. Demo funding is clearly labeled. All figures and operational histories are synthetic.

## Architecture and constraints

- React + TypeScript + Vite; Node 22.18+ for native TypeScript unit tests.
- No backend, real wallet connection, API credential input, network signing, or actual fund movement.
- `src/domain.ts`: pure money, obligation, quote, and state-transition logic; bigint calculations and integer strings at persistence boundaries.
- `src/csv.ts`: strict CSV validation and safe exports.
- `src/storage.ts`: versioned local persistence, recoverable errors; no silent replacement of unreadable saved data.
- `src/components/`: accessible interface, dialogs, payment forms, details, and tables.
- Native dialog for focus trapping and Escape; responsive desktop and mobile layouts; reduced-motion support.
- Only USDC → EURC. Simulated quote rate is 0.915000 EURC per USDC; simulated fee is 0.25 USDC, explicitly not current market pricing or Arc gas.
- Amounts positive, at most six fractional digits, max 1,000,000,000 USDC per obligation. No floating point in ledger calculations.
- A quote lasts 60 seconds. Approval requires an unexpired quote and adequate available funds.
- Execution debits once. Pending and unknown outcomes must be checked, not resubmitted. Settled payments can be reconciled once; reconcile does not change balances.
- Unknown outcome remains unresolved until a simulated status check, which credits the receiving balance exactly once.
- Imports are all-or-nothing; duplicate invoice references, invalid amounts, unsupported currency, and malformed CSV are rejected before mutation.
- Payment beneficiary is descriptive counterparty information in this prototype; no purported recipient payout is executed.

## Design

Calm financial workspace: dark forest sidebar, warm neutral canvas, white surfaces, emerald accents, tabular figures, compact status badges, and generous spacing. Overview prioritizes the queue and exceptions; no fabricated live-network badge or onchain transaction link. Simulation labeling remains visible.

## Verification

Node tests cover exact amount parsing, quote expiry, duplicate executions, insufficient funds, uncertain outcomes, reconciliation, imports, exports, and corrupt persistence. Type-check and production build. Browser verification covers creating and settling a payment, reconciliation, CSV import, persistence, navigation, export, dialogs, and mobile layout.
