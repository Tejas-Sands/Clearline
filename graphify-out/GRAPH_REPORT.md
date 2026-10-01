# Graph Report - arc  (2026-10-01)

## Corpus Check
- Corpus is ~34,086 words - fits in a single context window. You may not need a graph.

## Summary
- 448 nodes · 930 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.86)
- Token cost: host-agent semantic extraction usage not exposed; not measured.

## Community Hubs (Navigation)
- Chain execution and validation
- Simulation UI components
- Local journal and verification
- Simulation workspace and money
- Hosted API and database
- Testnet UI and responses
- Quote configuration boundaries
- Historical chain proof
- TypeScript configuration
- Documented local execution boundaries
- Simulator browser verification
- Package integration references
- Product and workspace boundaries
- Public transaction proof UI
- Runtime dependencies
- Development and test commands
- Agent handoff and invariants
- Historical business positioning
- Documented verification evidence
- Hosted execution safety gaps
- Build tool dependencies
- React HTML entry point
- Vercel function configuration
- Dependency compatibility overrides
- Node runtime requirement

## God Nodes (most connected - your core abstractions)
1. `Clearline project map: October update and dated September proof` - 23 edges
2. `makeChain()` - 22 edges
3. `displayMoney()` - 15 edges
4. `compilerOptions` - 15 edges
5. `Clearline agent handoff: updated 2026-10-01` - 15 edges
6. `handler()` - 14 edges
7. `App()` - 14 edges
8. `handler()` - 13 edges
9. `publicPayment()` - 13 edges
10. `getDb()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried` --semantically_similar_to--> `One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `Stored and Circle HTTP stop limits are base units; public SwapKit.swap/estimate stop limits are human-readable decimals` --semantically_similar_to--> `Public Swap Kit stopLimit uses human-readable EURC; stored minima and Circle HTTP stopLimit use integer base units`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `2026-10-01: 69/69 unit tests and frontend build passed; preceding UI/quote update passed synthetic testnet and simulator browser checks; no new chain transactions approved` --semantically_similar_to--> `2026-10-01: 69 unit tests and frontend build passed; preceding UI/quote update passed synthetic testnet and simulator browser checks; September transaction proofs not rerun`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `Clearline README: current MVP and historical simulation framing` --references--> `Clearline project map: October update and dated September proof`  [EXTRACTED]
  README.md → docs/PROJECT_MAP.md
- `handler()` --indirect_call--> `publicPayment()`  [INFERRED]
  api/testnet.mjs → server/model.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Approved minimum preserved across stored base units, public SDK decimal configuration, and Circle wire request; real SDK HTTP regressions** — docs_project_map_swap_stop_limit, docs_project_map_circle_swap_kit_viem, docs_project_map_quote_http_fixture_tests, docs_project_map_stop_limit_constrained_estimate [EXTRACTED 1.00]
- **Historical 2026-09-27 distinct funding, conversion, payout and reconciliation proof** — docs_project_map_arc_cctp_mint, docs_project_map_arc_usdc_eurc_conversion, docs_project_map_eurc_recipient_transfer, docs_project_map_reconciliation [EXTRACTED 1.00]

## Communities (25 total, 1 thin omitted)

### Community 0 - "Chain execution and validation"
Cohesion: 0.08
Nodes (47): @circle-fin/swap-kit, ref_node_assert, viem, balances, clients, payments, BASE_USDC, cctpAbi (+39 more)

### Community 1 - "Simulation UI components"
Cohesion: 0.09
Nodes (43): lucide-react, react, App(), act(), exportCsv(), FullPage, Overlay, Page (+35 more)

### Community 2 - "Local journal and verification"
Cohesion: 0.07
Nodes (35): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_http, ref_node_os, ref_node_path, children, artifacts (+27 more)

### Community 3 - "Simulation workspace and money"
Cohesion: 0.12
Nodes (32): ref_node_test, state(), Action, Activity, createInitialState(), FEE, MAX_AMOUNT, Quote (+24 more)

### Community 4 - "Hosted API and database"
Cohesion: 0.22
Nodes (24): authorizeVercelRequest(), defaultRecipient(), getAccount(), getSessionId(), fetchBalances(), handler(), handler(), handler() (+16 more)

### Community 5 - "Testnet UI and responses"
Cohesion: 0.12
Nodes (15): explorer(), guidance, labels, LivePayment, short(), Snapshot, stage, steps (+7 more)

### Community 6 - "Quote configuration boundaries"
Cohesion: 0.11
Nodes (21): Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried, Stored and Circle HTTP stop limits are base units; public SwapKit.swap/estimate stop limits are human-readable decimals, Baseline hosted deployment 8a5f400: isolated 3-USDC diagnostic quoted 2.473494 EURC expected, 2.448759 minimum; persisted on reload with zero transactions; no proof of new retry deployment or conversion/payout execution, CCTP USDC funding, Circle Swap Kit conversion, Clearline project map: October update and dated September proof, One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry, Exact EURC invoice settlement missing (+13 more)

### Community 7 - "Historical chain proof"
Cohesion: 0.13
Nodes (20): CCTP V2: immutable burn binding and nonce, finality, fee and expiry bounds, Generated graph is source-derived navigation, not runtime proof, Sensitive runtime state and secrets must be excluded from graphs and outputs, Arc Testnet USDC CCTP mint: chain 5042002, domain 26, Historical 2026-09-27 ARC-PROOF-001: 1 USDC to 0.822060 EURC paid, Base Sepolia USDC CCTP burn: chain 84532, domain 6, Historical 2026-09-27 CCTP-PROOF-001: verified and reconciled; attestation completed, Historical 2026-09-27 CCTP-PROOF-001: 1 bridged USDC to 0.822252 EURC paid (+12 more)

### Community 8 - "TypeScript configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 9 - "Documented local execution boundaries"
Cohesion: 0.16
Nodes (15): Persist signed transaction bytes and hash before broadcast; recover original submission, Resolved viem adapter mismatch: use chain.id rather than chain.chainId, Arc USDC/EURC conversion with verified minimum output, Circle Swap Kit with viem adapter, Separate Arc EURC recipient transfer with exact transfer log, Reconciliation and export: no additional funds movement, Recovery: preserve successful burns; confirmed-revert retries tested; batch path unverified, server/chain.mjs: CCTP, Swap Kit and receipt execution (+7 more)

### Community 10 - "Simulator browser verification"
Cohesion: 0.19
Nodes (11): Historical simulator browser smoke, Historical simulation build evidence, Completed simulation implementation plan, Historical deterministic settlement design, Historical local simulation design, artifacts, browser(), click() (+3 more)

### Community 11 - "Package integration references"
Cohesion: 0.15
Nodes (12): name, private, type, version, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @libsql/client, @types/react (+4 more)

### Community 12 - "Product and workspace boundaries"
Cohesion: 0.15
Nodes (13): Payment limits: >0 and <=100 USDC; Base bridge >0.01 USDC, Browser localStorage: simulation persistence, Clearline stablecoin payment operations desk, Exact EURC invoices require target amount, spend and fee policy, Simulation workspace: synthetic balances, no chain proof, src/App.tsx: workspace navigation, src/domain.ts: exact money and simulator transitions, src/storage.ts: simulation saved-state validation (+5 more)

### Community 13 - "Public transaction proof UI"
Cohesion: 0.24
Nodes (11): chainLabel(), explorerBase, PaymentProof, PROOF, ProofPage(), routeLabel(), short(), shortAddr() (+3 more)

### Community 14 - "Runtime dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, @libsql/client, lucide-react, react (+2 more)

### Community 15 - "Development and test commands"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:api, dev:ui, preview, setup-db, test (+2 more)

### Community 16 - "Agent handoff and invariants"
Cohesion: 0.22
Nodes (9): Clearline payment operations desk, Clearline agent handoff: updated 2026-10-01, Integer money and shared Arc USDC balance, Loopback signer request safeguards, Reconciliation changes accounting only, Exclude private runtime state and secrets, Small testnet payment limits, Testnet network allowlist (+1 more)

### Community 17 - "Historical business positioning"
Cohesion: 0.25
Nodes (8): Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist, Multicurrency tokenized-fund subscriptions, Market-maker inventory and obligation controls, Historical StableFX settlement operations selection, Just-in-time multicurrency treasury funding, Clearline README: current MVP and historical simulation framing

### Community 18 - "Documented verification evidence"
Cohesion: 0.38
Nodes (7): 2026-10-01 UI refresh: sage surfaces, larger controls, progress guidance, 2026-10-01: 69/69 unit tests and frontend build passed; preceding UI/quote update passed synthetic testnet and simulator browser checks; no new chain transactions approved, scripts/ui-refresh-smoke.mjs: intercepted synthetic UI checks, src/components/TestnetPayments.tsx: testnet actions and polling, src/testnet-api.ts: safe HTTP and non-JSON response failures, tests/testnet-api.test.ts: credential-free handler and parsing regressions, 2026-10-01: 69 unit tests and frontend build passed; preceding UI/quote update passed synthetic testnet and simulator browser checks; September transaction proofs not rerun

### Community 19 - "Hosted execution safety gaps"
Cohesion: 0.40
Nodes (6): api/testnet/payments/action.mjs: corrected auth and store imports, api/testnet/payments/_shared.mjs: asynchronous save adapter, Hosted gap: asynchronous durability, absent account lock, function budget, Hosted Vercel api/ handlers: separate execution boundary, server/db.mjs: Turso payment persistence, Security document claims: 50 daily global, 5 daily per IP, 10 lifetime per session

### Community 20 - "Build tool dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react

### Community 21 - "React HTML entry point"
Cohesion: 0.40
Nodes (3): Clearline HTML entry, @fontsource-variable/manrope, react-dom

### Community 22 - "Vercel function configuration"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/**/*.mjs, rewrites

### Community 23 - "Dependency compatibility overrides"
Cohesion: 0.67
Nodes (3): overrides, rpc-websockets, uuid

## Knowledge Gaps
- **130 isolated node(s):** `name`, `private`, `version`, `type`, `node` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 162 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Bind attestation to original source transaction` connect `Historical chain proof` to `Chain execution and validation`?**
  _High betweenness centrality (0.322) - this node is a cross-community bridge._
- **Why does `Testnet implementation ledger` connect `Historical chain proof` to `Documented local execution boundaries`, `Quote configuration boundaries`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `Clearline project map: October update and dated September proof` connect `Quote configuration boundaries` to `Historical chain proof`, `Agent handoff and invariants`, `Historical business positioning`, `Documented verification evidence`, `Hosted execution safety gaps`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Chain execution and validation` be split into smaller, more focused modules?**
  _Cohesion score 0.08348457350272233 - nodes in this community are weakly interconnected._
- **Should `Simulation UI components` be split into smaller, more focused modules?**
  _Cohesion score 0.09285714285714286 - nodes in this community are weakly interconnected._
## Evidence boundary

Generated code relationships are structural navigation; document relationships include historical and inferred claims. The latest October 1 checks passed 69 unit tests and the frontend build, verified exact approved stop-limit wire units through the installed SDK, and exercised read-only constrained estimates against Circle. Correctly formed requests remain intermittently unavailable. Earlier UI checks used synthetic API responses. None of these checks establish new onchain conversion/payout proof or hosted payout durability.

## Extraction integrity warnings

Raw extraction has 0 dangling endpoint edges, 1 self-loop, and 45 same-endpoint edges collapsed by the default undirected graph. Repeated call/contains relationships can collapse; this graph is navigation, not a lossless call trace.
