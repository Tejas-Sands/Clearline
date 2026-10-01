# Graph Report - arc  (2026-10-01)

## Corpus Check
- Corpus is ~33,692 words - fits in a single context window. You may not need a graph.

## Summary
- 426 nodes · 900 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.86)
- Token cost: host-agent semantic extraction usage not exposed; not measured.

## Community Hubs (Navigation)
- Simulation workspace and money
- Browser verification scripts
- Chain execution and validation
- Simulation UI components
- Hosted API and database
- Local signer and recovery
- Testnet UI and responses
- TypeScript configuration
- Package integration references
- Documented local execution boundaries
- Historical testnet evidence
- Product and workspace boundaries
- Public transaction proof UI
- Current handoff and quote recovery
- Runtime dependencies
- Development and test commands
- Historical business positioning
- Historical crosschain proof
- Documented testnet UI and verification
- Hosted execution safety gaps
- Build tool dependencies
- React HTML entry point
- Vercel function configuration
- Dependency compatibility overrides
- Node runtime requirement

## God Nodes (most connected - your core abstractions)
1. `makeChain()` - 22 edges
2. `displayMoney()` - 15 edges
3. `compilerOptions` - 15 edges
4. `handler()` - 14 edges
5. `App()` - 14 edges
6. `handler()` - 13 edges
7. `publicPayment()` - 13 edges
8. `getDb()` - 12 edges
9. `transition()` - 12 edges
10. `handler()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried` --semantically_similar_to--> `One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `2026-10-01: 67/67 unit tests, frontend build and synthetic testnet UI checks passed; no new chain transactions approved` --semantically_similar_to--> `2026-10-01: 67 unit tests, frontend build and synthetic testnet UI smoke passed; September transaction proofs not rerun`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `handler()` --indirect_call--> `publicPayment()`  [INFERRED]
  api/testnet.mjs → server/model.mjs
- `Clearline README: current MVP and historical simulation framing` --references--> `Clearline project map: October update and dated September proof`  [EXTRACTED]
  README.md → docs/PROJECT_MAP.md
- `Payment limits: >0 and <=100 USDC; Base bridge >0.01 USDC` --references--> `Testnet payments workspace`  [EXTRACTED]
  AGENTS.md → docs/PROJECT_MAP.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Historical 2026-09-27 distinct funding, conversion, payout and reconciliation proof** — docs_project_map_arc_cctp_mint, docs_project_map_arc_usdc_eurc_conversion, docs_project_map_eurc_recipient_transfer, docs_project_map_reconciliation [EXTRACTED 1.00]

## Communities (25 total, 1 thin omitted)

### Community 0 - "Simulation workspace and money"
Cohesion: 0.09
Nodes (43): exportCsv(), FundingForm(), ImportForm(), PaymentForm(), csvCell(), downloadFile(), exportPayments(), IMPORT_TEMPLATE (+35 more)

### Community 1 - "Browser verification scripts"
Cohesion: 0.07
Nodes (36): Historical simulator browser smoke, Historical simulation build evidence, Completed simulation implementation plan, Historical deterministic settlement design, Historical local simulation design, ref_node_assert, ref_node_child_process, ref_node_fs (+28 more)

### Community 2 - "Chain execution and validation"
Cohesion: 0.11
Nodes (36): @circle-fin/swap-kit, viem, balances, clients, payments, BASE_USDC, cctpAbi, EURC (+28 more)

### Community 3 - "Simulation UI components"
Cohesion: 0.13
Nodes (30): lucide-react, react, App(), act(), FullPage, Overlay, Page, pageFromHash() (+22 more)

### Community 4 - "Hosted API and database"
Cohesion: 0.22
Nodes (23): authorizeVercelRequest(), defaultRecipient(), getAccount(), getSessionId(), fetchBalances(), handler(), handler(), handler() (+15 more)

### Community 5 - "Local signer and recovery"
Cohesion: 0.11
Nodes (24): ref_node_crypto, ref_node_http, ref_node_test, body(), chain, dir, fd, lock (+16 more)

### Community 6 - "Testnet UI and responses"
Cohesion: 0.12
Nodes (15): explorer(), guidance, labels, LivePayment, short(), Snapshot, stage, steps (+7 more)

### Community 7 - "TypeScript configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 8 - "Package integration references"
Cohesion: 0.15
Nodes (12): name, private, type, version, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @libsql/client, @types/react (+4 more)

### Community 9 - "Documented local execution boundaries"
Cohesion: 0.19
Nodes (13): Persist signed transaction bytes and hash before broadcast; recover original submission, Resolved viem adapter mismatch: use chain.id rather than chain.chainId, Arc USDC/EURC conversion with verified minimum output, Circle Swap Kit with viem adapter, Separate Arc EURC recipient transfer with exact transfer log, Reconciliation and export: no additional funds movement, Recovery: preserve successful burns; confirmed-revert retries tested; batch path unverified, server/chain.mjs: CCTP, Swap Kit and receipt execution (+5 more)

### Community 10 - "Historical testnet evidence"
Cohesion: 0.19
Nodes (13): Generated graph is source-derived navigation, not runtime proof, Sensitive runtime state and secrets must be excluded from graphs and outputs, Historical 2026-09-27 ARC-PROOF-001: 1 USDC to 0.822060 EURC paid, Historical 2026-09-27 CCTP-PROOF-001: verified and reconciled; attestation completed, Historical 2026-09-27 independent public receipt proof for local signer, scripts/verify-testnet.mjs: read-only public RPC receipt verification, docs/TESTNET_PROOF.json: dated independent receipt evidence, Testnet implementation plan completed (+5 more)

### Community 11 - "Product and workspace boundaries"
Cohesion: 0.17
Nodes (12): Browser localStorage: simulation persistence, Clearline stablecoin payment operations desk, Exact EURC invoices require target amount, spend and fee policy, Simulation workspace: synthetic balances, no chain proof, src/App.tsx: workspace navigation, src/domain.ts: exact money and simulator transitions, src/storage.ts: simulation saved-state validation, src/useWorkspace.ts: simulation mutation and persistence (+4 more)

### Community 12 - "Public transaction proof UI"
Cohesion: 0.24
Nodes (11): chainLabel(), explorerBase, PaymentProof, PROOF, ProofPage(), routeLabel(), short(), shortAddr() (+3 more)

### Community 13 - "Current handoff and quote recovery"
Cohesion: 0.27
Nodes (11): Clearline agent handoff: updated 2026-10-01, Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried, 2026-10-01: 67/67 unit tests, frontend build and synthetic testnet UI checks passed; no new chain transactions approved, Baseline hosted deployment 8a5f400: isolated 3-USDC diagnostic quoted 2.473494 EURC expected, 2.448759 minimum; persisted on reload with zero transactions; no proof of new retry deployment or conversion/payout execution, Clearline project map: October update and dated September proof, One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry, Read-only 3-USDC Circle quote: two HTTP 404 No route available responses, then success with identical 100-bps parameters; 2.480473 EURC estimate, 2.455668 minimum, Installed SDK HTTP-fixture tests exercise real wire requests, base-unit conversion and Circle error parsing (+3 more)

### Community 14 - "Runtime dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, @libsql/client, lucide-react, react (+2 more)

### Community 15 - "Development and test commands"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:api, dev:ui, preview, setup-db, test (+2 more)

### Community 16 - "Historical business positioning"
Cohesion: 0.25
Nodes (8): Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist, Multicurrency tokenized-fund subscriptions, Market-maker inventory and obligation controls, Historical StableFX settlement operations selection, Just-in-time multicurrency treasury funding, Clearline README: current MVP and historical simulation framing

### Community 17 - "Historical crosschain proof"
Cohesion: 0.33
Nodes (7): CCTP V2: immutable burn binding and nonce, finality, fee and expiry bounds, Payment limits: >0 and <=100 USDC; Base bridge >0.01 USDC, Arc Testnet USDC CCTP mint: chain 5042002, domain 26, Base Sepolia USDC CCTP burn: chain 84532, domain 6, Historical 2026-09-27 CCTP-PROOF-001: 1 bridged USDC to 0.822252 EURC paid, Circle sandbox CCTP V2 attestation, Bind attestation to original source transaction

### Community 18 - "Documented testnet UI and verification"
Cohesion: 0.29
Nodes (7): 2026-10-01 UI refresh: sage surfaces, larger controls, progress guidance, server/index.mjs: loopback API and process lock, server/security.mjs: Host, Origin and mutation-token checks, src/components/TestnetPayments.tsx: testnet actions and polling, src/testnet-api.ts: safe HTTP and non-JSON response failures, tests/testnet-api.test.ts: credential-free handler and parsing regressions, Vite /api/testnet proxy

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
- **117 isolated node(s):** `name`, `private`, `version`, `type`, `node` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 143 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Bind attestation to original source transaction` connect `Historical crosschain proof` to `Historical testnet evidence`, `Chain execution and validation`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Why does `Testnet implementation ledger` connect `Historical testnet evidence` to `Documented local execution boundaries`, `Current handoff and quote recovery`, `Historical crosschain proof`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **Why does `viem` connect `Chain execution and validation` to `Package integration references`, `Browser verification scripts`, `Hosted API and database`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `App()` (e.g. with `pageFromHash()` and `isFinal()`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Simulation workspace and money` be split into smaller, more focused modules?**
  _Cohesion score 0.08705882352941176 - nodes in this community are weakly interconnected._
## Evidence boundary

Generated code relationships are structural navigation; document relationships include historical and inferred claims. The October 1 checks use synthetic API responses and do not establish new onchain proof or hosted payout durability.

## Extraction integrity warnings

Raw extraction has 0 dangling endpoint edges, 1 self-loop, and 45 same-endpoint edges collapsed by the default undirected graph. Repeated call/contains relationships can collapse; this graph is navigation, not a lossless call trace.
