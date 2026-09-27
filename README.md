# Clearline

**A stablecoin payment operations desk on Arc.**

Turn a payment obligation into an approved conversion, a tracked payment, and a reconciled ledger entry. Originally selected from [the six-use-case shortlist](ARC_TOP_6_USE_CASES.md), the current MVP direction uses CCTP funding and Circle Swap Kit rather than requiring StableFX.

**Current status (2026-09-27):** the simulator works, and both testnet routes are proven. Direct Arc funding: 1 USDC → 0.822060 EURC paid and reconciled. Crosschain: 1 Base Sepolia USDC → CCTP mint of 1 Arc USDC → 0.822252 EURC paid and reconciled. Fresh checks passed 54 tests, the frontend build, and both simulator/testnet browser checks. See [public receipt evidence](docs/TESTNET_PROOF.json), [AGENTS.md](AGENTS.md), and [the project map](docs/PROJECT_MAP.md).

`npm run dev` now starts both the UI and the test-only signing API. The server keeps sensitive wallet/journal data in the ignored `.clearline-testnet/` directory. No API key is configured; real testnet operations need network access and faucet-funded test assets. The simulator works without funding. The walkthrough, financial model, and StableFX pilot notes below describe the **original simulation**, not completion of the testnet integration.

## Run locally

Requires **Node.js 22.18+** and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. No API key, wallet, database, or environment file is needed. The dev server binds to loopback by default.

```sh
npm test          # exact money, transitions, import/export, persistence validation
npm run build    # strict TypeScript check + production assets in dist/
npm run preview  # serve the production build locally
```

With the API running and a reconciled testnet payment present, `node scripts/verify-testnet.mjs` independently checks public RPC receipts and prints a proof report. `node scripts/testnet-browser-smoke.mjs` checks existing testnet records, CSV export, restart persistence, mobile layout and rejection of duplicate payouts. Neither script approves a new transfer.

For repeatable browser checks, install `agent-browser` and its Chrome browser separately, keep the dev server running, then run `npm run test:e2e`. Set `CLEARLINE_TEST_URL` to test another local URL. The script creates an isolated browser session, exercises synthetic records, closes its session, and saves screenshots/downloads in `artifacts/`.

## What works

- Overview with metrics and a seven-day chart derived from the local payment records.
- Payment entry and CSV import with validation and duplicate-reference protection.
- USDC → EURC quotes, a 60-second approval window, and explicit expiry recovery.
- Simulated successful settlement, counterparty delays, and uncertain outcomes.
- Source-fund reservation and exactly-once state transitions within the local state machine.
- Payment details with a timeline and exact six-decimal ledger values.
- Reconciliation and a matched-ledger CSV export.
- Search, filters, pagination, activity history, demo funding, backup download, and explicit reset.
- Browser persistence with corrupt-data warnings and stale-tab detection.
- Responsive layout, keyboard-operable dialogs, visible focus, and reduced-motion support.

## Five-minute walkthrough

1. Open **New payment**. Enter `Acme Europe`, `INV-2001`, and `2500.00`.
2. Keep **Successful settlement** and create the payment.
3. Request a demo quote. Review the rate, target amount, fee, and total source debit.
4. Approve the simulated settlement. USDC decreases by `2500.25`; EURC increases by `2287.50`.
5. Select **Reconcile payment**. Matching does not move money again.
6. Open **Reconciliation → Export matched ledger** to download matched records.
7. Open the seeded **Loom Technologies** payment to try an uncertain outcome. **Check simulated settlement** resolves the existing trade without a second debit.
8. Open **Aperture Group** to refresh an expired quote. Create a payment larger than the available balance to test insufficient funds, then use **Add demo funds** and request a fresh quote.

The synthetic names in the workspace are example counterparties, not customers or integrations.

## CSV format

Download the template from **Import CSV**, or use:

```csv
reference,counterparty,amount,currency
INV-2001,Acme Europe,2500.00,USDC
INV-2002,"Harbor, Ltd.",1250.50,USDC
```

- These four headers, in this order, are required.
- Amounts must be positive decimal strings, up to six fractional digits, without grouping commas or exponent notation. Maximum: 1,000,000,000 USDC per obligation.
- Up to 500 rows per import, 1 MB per file, 5,000 payments per workspace.
- Only USDC source obligations are supported; target is EURC.
- Invoice references are unique case-insensitively. Imports validate completely before any state change.
- Quoted commas, escaped quotes, CRLF, and UTF-8 BOM are supported. References and counterparty names must be single-line.
- Imported obligations use the successful-settlement scenario. Choose delay/uncertain scenarios through New payment.
- Exports include a `simulation` environment marker and spreadsheet-formula protection. A ledger export has a different schema from an obligation import.

## Financial model

The simulator uses a **fixed illustrative rate of 0.915000 EURC per USDC** and a **0.25 USDC service fee**. These are neither current market prices nor estimates of Arc gas.

Amounts are stored as integer strings in millionths and calculated with `bigint`. Target EURC rounds down to the nearest millionth. The smallest possible input that rounds to zero target units is rejected when requesting a quote. `number` is used for dates and chart proportions, never ledger arithmetic.

```text
ready → quoted → settled → reconciled
             ↘ needs_funds → fresh quote
             ↘ pending / unknown → status check → settled
```

Approvals debit source amount plus fee once. Pending/unknown outcomes reserve that debit, and a subsequent simulated status check credits EURC once. Reconciliation only changes status and records a matching event. Neither quote refresh nor reconciliation changes balances.

Arc's native USDC balance uses 18 decimals, while its ERC-20 interface uses 6; these expose one underlying balance. The prototype operates solely in six-decimal accounting units. Any future native RPC adapter must normalize the interfaces and avoid double-counting.

## Simulation boundary

**The simulation workspace does not connect to StableFX, Arc RPC, a wallet, or bank rails. It moves no real money.** The separate Testnet payments workspace has a local signer and chain adapter; its current implementation and verification gaps are documented in [the project map](docs/PROJECT_MAP.md).

The EURC output stays in the simulated treasury. Counterparties are obligation labels, not payout addresses. A matched record proves agreement inside the demo ledger, not a bank or beneficiary receipt. `SIM-*` receipts are local identifiers, not transaction hashes. All seeded records, balances, charts, and history are synthetic.

Browser storage is editable, not confidential, not shared, and not an immutable audit trail. Stale-tab detection helps avoid ordinary accidental overwrites but is not a transactional multi-user database. Do not use it for real funds or sensitive customer information. If storage is damaged, the app preserves the raw saved content for backup and requires explicit reset; normal operations are blocked. Downloaded backups are for inspection/recovery, and there is no backup-import feature.

## Path to a real pilot

1. Secure a screened StableFX design partner and verify current supported currencies, account access, liquidity, and commercial conditions.
2. Put a provider adapter and secrets behind an authenticated server. Keep customer-controlled signing and approval policies separate from the UI. Never expose a Circle API key or entity secret through a `VITE_*` variable.
3. Replace local storage with a transactional database, durable idempotency keys, account-level concurrency controls, and reconciliation of provider/chain events.
4. Implement the current RFQ, trade, funding, and status lifecycle from Circle's documentation. Unknown responses must be checked against provider state; the demo's deterministic successful check is not an acceptable real-world recovery policy.
5. Distinguish provider acceptance, funding, finalized chain settlement, token redemption, and beneficiary payout. Verify receipts and both legs before matching.
6. Add identity, authorization, custody policy, monitoring, incident recovery, backups, and a security review. Review the actual licensing and data obligations of the operating model.
7. Validate two design partners and one paid pilot before broadening currencies or building an entire payment network.

Native privacy was still upcoming in the research used for this project. Permissioned validators and USDC transfer restrictions are real operational dependencies; this app makes no censorship-resistance or confidential-payroll claim.

References: [StableFX taker guide](https://developers.circle.com/stablefx/quickstarts/fx-trade-taker), [testing guide](https://developers.circle.com/stablefx/tutorials/test-stablefx-integration-taker), [supported currencies](https://developers.circle.com/stablefx/references/supported-currencies), [Arc balance integration](https://www.arc.io/blog/supporting-arc-in-wallets-one-balance-usdc-fees-and-complete-history).

## Project structure

```text
ARC_TOP_6_USE_CASES.md   Ranked strategy shortlist with evidence
src/domain.ts           Exact money and pure settlement state transitions
src/csv.ts              Obligation import and accounting export
src/storage.ts          Saved-workspace schema validation
src/useWorkspace.ts     Persistence and mutation boundary
src/App.tsx             Navigation and workspace views
src/components/         Overview, queue, forms, dialogs, payment details
src/styles.css          Responsive visual system
tests/                  Node behavior tests
docs/                   Design, implementation plan, verification notes
```

Built with React, TypeScript, Vite, Lucide icons, and locally bundled Manrope. No external runtime API or font requests are required.
# Clearline
