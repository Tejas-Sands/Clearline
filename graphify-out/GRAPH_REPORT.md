# Graph Report - arc  (2026-10-01)

## Corpus Check
- Corpus is ~35,595 words - fits in a single context window. You may not need a graph.

## Summary
- 465 nodes · 980 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.87)
- Token cost: host-agent semantic extraction usage not exposed; not measured.

## Community Hubs (Navigation)
- Simulation UI and money
- Chain execution and validation
- Hosted API and database
- Browser and journal verification
- Local lifecycle and locking
- Testnet UI and responses
- Quote configuration boundaries
- TypeScript configuration
- Package integration references
- Documented execution invariants
- Historical chain proof
- Testnet plan and proof
- Public transaction proof UI
- Agent handoff and invariants
- Hosted checkpoints and safety gaps
- Documented verification evidence
- Product and workspace boundaries
- Runtime dependencies
- Development and test commands
- Historical business positioning
- Build tool dependencies
- React HTML entry point
- Vercel function configuration
- Dependency compatibility overrides
- Node runtime requirement

## God Nodes (most connected - your core abstractions)
1. `Clearline project map: October update and dated September proof` - 33 edges
2. `makeChain()` - 22 edges
3. `Clearline agent handoff: updated 2026-10-01` - 17 edges
4. `displayMoney()` - 15 edges
5. `compilerOptions` - 15 edges
6. `handler()` - 14 edges
7. `getDb()` - 14 edges
8. `App()` - 14 edges
9. `handler()` - 13 edges
10. `publicPayment()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried` --semantically_similar_to--> `One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `Stored and Circle HTTP stop limits are base units; public SwapKit.swap/estimate stop limits are human-readable decimals` --semantically_similar_to--> `Public Swap Kit stopLimit uses human-readable EURC; stored minima and Circle HTTP stopLimit use integer base units`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `2026-10-01: 76/76 unit tests and frontend build passed; authenticated hosted recovery tested with mocked DB/RPC; preceding UI/quote update passed synthetic testnet and simulator browser checks; no live conversion/payout authorized` --semantically_similar_to--> `2026-10-01: 76 unit tests and frontend build passed; authenticated hosted-handler recovery and ordered checkpoints tested with mocked DB/RPC; preceding UI/quote browser checks passed; September transaction proofs not rerun`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `2026-10-01 hosted conversion checkpoint fix: closure-bound save, immutable ordered checkpoints, original signature recovery` --semantically_similar_to--> `Hosted persistence fix: store closure, immutable checkpoint snapshots, serialized Turso writes, returned promise`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md
- `Await asynchronous checkpoint promises and preserve original signed entry on persistence failure` --semantically_similar_to--> `Signature-preserving recovery re-checkpoints original bytes before broadcast`  [INFERRED] [semantically similar]
  AGENTS.md → docs/PROJECT_MAP.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Approved minimum preserved across stored base units, public SDK decimal configuration, and Circle wire request; real SDK HTTP regressions** — docs_project_map_swap_stop_limit, docs_project_map_circle_swap_kit_viem, docs_project_map_quote_http_fixture_tests, docs_project_map_stop_limit_constrained_estimate [EXTRACTED 1.00]
- **Shared ordered persistence boundary for immutable Turso snapshots, journal broadcast/recovery and final hosted handler save** — docs_project_map_api_testnet_payments_shared_mjs, docs_project_map_server_db_mjs, docs_project_map_server_journal_mjs, docs_project_map_api_testnet_payments_action_mjs, docs_project_map_tests_testnet_db_store_test_ts [EXTRACTED 1.00]
- **Historical 2026-09-27 distinct funding, conversion, payout and reconciliation proof** — docs_project_map_arc_cctp_mint, docs_project_map_arc_usdc_eurc_conversion, docs_project_map_eurc_recipient_transfer, docs_project_map_reconciliation [EXTRACTED 1.00]

## Communities (25 total, 1 thin omitted)

### Community 0 - "Simulation UI and money"
Cohesion: 0.06
Nodes (73): lucide-react, react, App(), act(), exportCsv(), FullPage, Overlay, Page (+65 more)

### Community 1 - "Chain execution and validation"
Cohesion: 0.09
Nodes (44): @circle-fin/swap-kit, ref_node_assert, ref_node_test, viem, balances, clients, payments, BASE_USDC (+36 more)

### Community 2 - "Hosted API and database"
Cohesion: 0.18
Nodes (25): authorizeVercelRequest(), defaultRecipient(), getAccount(), getSessionId(), fetchBalances(), handler(), handler(), handler() (+17 more)

### Community 3 - "Browser and journal verification"
Cohesion: 0.08
Nodes (29): Historical simulator browser smoke, Historical simulation build evidence, Completed simulation implementation plan, Historical deterministic settlement design, Historical local simulation design, ref_node_child_process, ref_node_fs, ref_node_os (+21 more)

### Community 4 - "Local lifecycle and locking"
Cohesion: 0.12
Nodes (21): ref_node_crypto, ref_node_http, chain, dir, fd, lock, refreshBalances(), send() (+13 more)

### Community 5 - "Testnet UI and responses"
Cohesion: 0.11
Nodes (15): body(), explorer(), guidance, labels, LivePayment, short(), Snapshot, stage (+7 more)

### Community 6 - "Quote configuration boundaries"
Cohesion: 0.12
Nodes (21): Baseline hosted deployment 8a5f400: isolated 3-USDC diagnostic quoted 2.473494 EURC expected, 2.448759 minimum; persisted on reload with zero transactions; no proof of new retry deployment or conversion/payout execution, CCTP USDC funding, Circle Swap Kit conversion, Clearline project map: October update and dated September proof, One additional estimate-only retry after SDK three HTTP attempts for error 1003 No route available; same amount and 100-bps slippage; no signing, conversion or payout retry, Exact EURC invoice settlement missing, Callback mutation reproduced Cannot read properties of undefined (reading 'state'); restored fix passed, Resolved unbound store.save failure: this.state was undefined after signing and before journal broadcast (+13 more)

### Community 7 - "TypeScript configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 8 - "Package integration references"
Cohesion: 0.15
Nodes (12): name, private, type, version, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @libsql/client, @types/react (+4 more)

### Community 9 - "Documented execution invariants"
Cohesion: 0.21
Nodes (13): Await asynchronous checkpoint promises and preserve original signed entry on persistence failure, Resolved viem adapter mismatch: use chain.id rather than chain.chainId, Arc USDC/EURC conversion with verified minimum output, Circle Swap Kit with viem adapter, Separate Arc EURC recipient transfer with exact transfer log, Signature-preserving recovery re-checkpoints original bytes before broadcast, Reconciliation and export: no additional funds movement, Recovery: preserve successful burns; confirmed-revert retries tested; batch path unverified (+5 more)

### Community 10 - "Historical chain proof"
Cohesion: 0.18
Nodes (13): CCTP V2: immutable burn binding and nonce, finality, fee and expiry bounds, Payment limits: >0 and <=100 USDC; Base bridge >0.01 USDC, Arc Testnet USDC CCTP mint: chain 5042002, domain 26, Base Sepolia USDC CCTP burn: chain 84532, domain 6, Historical 2026-09-27 CCTP-PROOF-001: verified and reconciled; attestation completed, Historical 2026-09-27 CCTP-PROOF-001: 1 bridged USDC to 0.822252 EURC paid, Circle sandbox CCTP V2 attestation, Testnet payments workspace (+5 more)

### Community 11 - "Testnet plan and proof"
Cohesion: 0.18
Nodes (13): Persist signed transaction bytes/hash and await checkpoint before broadcast; preserve signature on errors; recover original submission, Generated graph is source-derived navigation, not runtime proof, Sensitive runtime state and secrets must be excluded from graphs and outputs, Historical 2026-09-27 ARC-PROOF-001: 1 USDC to 0.822060 EURC paid, Synthetic boundary checks verify ordering, receipt-derived EURC, converted persistence and public raw-byte stripping; no live payout or DB fault proof, Authenticated hosted handler → real chain adapter → mocked DB/RPC recovery fixture, Historical 2026-09-27 independent public receipt proof for local signer, scripts/verify-testnet.mjs: read-only public RPC receipt verification (+5 more)

### Community 12 - "Public transaction proof UI"
Cohesion: 0.24
Nodes (11): chainLabel(), explorerBase, PaymentProof, PROOF, ProofPage(), routeLabel(), short(), shortAddr() (+3 more)

### Community 13 - "Agent handoff and invariants"
Cohesion: 0.18
Nodes (11): Clearline payment operations desk, Clearline agent handoff: updated 2026-10-01, Integer money and shared Arc USDC balance, Loopback signer request safeguards, Intermittent 3-USDC quote recovery preserves amount and 100 bps; one additional estimate retry; signing/conversion/payout are not automatically retried, Reconciliation changes accounting only, Exclude private runtime state and secrets, Stored and Circle HTTP stop limits are base units; public SwapKit.swap/estimate stop limits are human-readable decimals (+3 more)

### Community 14 - "Hosted checkpoints and safety gaps"
Cohesion: 0.25
Nodes (11): 2026-10-01 hosted conversion checkpoint fix: closure-bound save, immutable ordered checkpoints, original signature recovery, Account-wide operation locking absent; checkUnresolved helper unused, api/testnet/payments/action.mjs: corrected imports, awaited final queued persistence; account-wide operation lock remains unenforced, api/testnet/payments/_shared.mjs: closure-bound save with immutable snapshots, serialized Turso writes and returned persistence promises, Hosted persistence fix: store closure, immutable checkpoint snapshots, serialized Turso writes, returned promise, Hosted gaps: absent account-wide operation lock, cross-request concurrency, actual database commit/fault outcomes, 30-second function budget and timeout/crash recovery, Hosted 30-second function budget and timeout/crash recovery require dedicated validation, Hosted Vercel api/ handlers: separate execution boundary (+3 more)

### Community 15 - "Documented verification evidence"
Cohesion: 0.24
Nodes (11): 2026-10-01 UI refresh: sage surfaces, larger controls, progress guidance, 2026-10-01: 76/76 unit tests and frontend build passed; authenticated hosted recovery tested with mocked DB/RPC; preceding UI/quote update passed synthetic testnet and simulator browser checks; no live conversion/payout authorized, scripts/ui-refresh-smoke.mjs: intercepted synthetic UI checks, server/index.mjs: loopback API and process lock, server/security.mjs: Host, Origin and mutation-token checks, src/components/TestnetPayments.tsx: testnet actions and polling, src/testnet-api.ts: safe HTTP and non-JSON response failures, tests/testnet-api.test.ts: credential-free handler and parsing regressions (+3 more)

### Community 16 - "Product and workspace boundaries"
Cohesion: 0.20
Nodes (10): Browser localStorage: simulation persistence, Clearline stablecoin payment operations desk, Exact EURC invoices require target amount, spend and fee policy, Simulation workspace: synthetic balances, no chain proof, src/App.tsx: workspace navigation, src/domain.ts: exact money and simulator transitions, src/storage.ts: simulation saved-state validation, src/useWorkspace.ts: simulation mutation and persistence (+2 more)

### Community 17 - "Runtime dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, @libsql/client, lucide-react, react (+2 more)

### Community 18 - "Development and test commands"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:api, dev:ui, preview, setup-db, test (+2 more)

### Community 19 - "Historical business positioning"
Cohesion: 0.25
Nodes (8): Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist, Multicurrency tokenized-fund subscriptions, Market-maker inventory and obligation controls, Historical StableFX settlement operations selection, Just-in-time multicurrency treasury funding, Clearline README: current MVP and historical simulation framing

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 166 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Bind attestation to original source transaction` connect `Historical chain proof` to `Chain execution and validation`, `Testnet plan and proof`?**
  _High betweenness centrality (0.340) - this node is a cross-community bridge._
- **Why does `Testnet implementation ledger` connect `Testnet plan and proof` to `Documented execution invariants`, `Historical chain proof`, `Quote configuration boundaries`?**
  _High betweenness centrality (0.272) - this node is a cross-community bridge._
- **Why does `Clearline project map: October update and dated September proof` connect `Quote configuration boundaries` to `Documented execution invariants`, `Testnet plan and proof`, `Agent handoff and invariants`, `Hosted checkpoints and safety gaps`, `Documented verification evidence`, `Historical business positioning`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Simulation UI and money` be split into smaller, more focused modules?**
  _Cohesion score 0.060805860805860805 - nodes in this community are weakly interconnected._
- **Should `Chain execution and validation` be split into smaller, more focused modules?**
  _Cohesion score 0.09351432880844646 - nodes in this community are weakly interconnected._
## Evidence boundary

Generated code relationships are structural navigation; document relationships include historical and inferred claims. The latest October 1 checks passed 76 tests and the frontend build. The hosted callback and per-store checkpoint ordering are corrected; authenticated handler recovery was exercised through the real chain adapter with mocked DB/RPC. Earlier installed-SDK checks verified approved stop-limit wire units, and read-only constrained estimates succeeded intermittently. Earlier UI checks used synthetic API responses. These checks do not establish new onchain conversion/payout proof, actual database fault guarantees, cross-request hosted locking, or hosted timeout/crash safety.

## Extraction integrity warnings

Raw extraction has 0 dangling endpoint edges, 1 self-loop, and 48 same-endpoint edges collapsed by the default undirected graph. Repeated call/contains relationships can collapse; this graph is navigation, not a lossless call trace.
