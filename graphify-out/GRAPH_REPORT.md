# Graph Report - arc  (2026-10-01)

## Corpus Check
- Corpus is ~32,482 words - fits in a single context window. You may not need a graph.

## Summary
- 416 nodes · 875 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: host-agent semantic extraction usage not exposed; not measured.

## Community Hubs (Navigation)
- Simulation workspace and money
- Chain execution and validation
- Historical plans and proof
- Local signer and recovery
- Hosted API and database
- Current architecture and boundaries
- Testnet UI and responses
- TypeScript configuration
- Simulator browser checks
- Package integration references
- Public transaction proof UI
- Runtime dependencies
- Development and test scripts
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
- `handler()` --indirect_call--> `publicPayment()`  [INFERRED]
  api/testnet.mjs → server/model.mjs
- `handler()` --calls--> `assertAction()`  [EXTRACTED]
  api/testnet/payments/action.mjs → server/model.mjs
- `handler()` --calls--> `normalizePayment()`  [EXTRACTED]
  api/testnet/payments/index.mjs → server/model.mjs
- `fixture()` --calls--> `makeChain()`  [EXTRACTED]
  tests/testnet-chain.test.ts → server/chain.mjs
- `fixture()` --calls--> `makeService()`  [EXTRACTED]
  tests/testnet-service.test.ts → server/service.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Historical 2026-09-27 distinct funding, conversion, payout and reconciliation proof** — docs_project_map_arc_cctp_mint, docs_project_map_arc_usdc_eurc_conversion, docs_project_map_eurc_recipient_transfer, docs_project_map_reconciliation [EXTRACTED 1.00]

## Communities (18 total, 1 thin omitted)

### Community 0 - "Simulation workspace and money"
Cohesion: 0.06
Nodes (73): lucide-react, react, App(), act(), exportCsv(), FullPage, Overlay, Page (+65 more)

### Community 1 - "Chain execution and validation"
Cohesion: 0.08
Nodes (47): @circle-fin/swap-kit, ref_node_assert, ref_node_test, viem, balances, clients, payments, BASE_USDC (+39 more)

### Community 2 - "Historical plans and proof"
Cohesion: 0.06
Nodes (44): CCTP V2: immutable burn binding and nonce, finality, fee and expiry bounds, Persist signed transaction bytes and hash before broadcast; recover original submission, Generated graph is source-derived navigation, not runtime proof, Sensitive runtime state and secrets must be excluded from graphs and outputs, Payment limits: >0 and <=100 USDC; Base bridge >0.01 USDC, Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist (+36 more)

### Community 3 - "Local signer and recovery"
Cohesion: 0.07
Nodes (34): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_http, ref_node_os, ref_node_path, children, artifacts (+26 more)

### Community 4 - "Hosted API and database"
Cohesion: 0.22
Nodes (24): authorizeVercelRequest(), defaultRecipient(), getAccount(), getSessionId(), fetchBalances(), handler(), handler(), handler() (+16 more)

### Community 5 - "Current architecture and boundaries"
Cohesion: 0.09
Nodes (25): 2026-10-01 UI refresh: sage surfaces, larger controls, progress guidance, 2026-10-01: 60 unit tests, build and browser checks; no new chain actions, api/testnet/payments/action.mjs: corrected auth and store imports, api/testnet/payments/_shared.mjs: asynchronous save adapter, Browser localStorage: simulation persistence, Clearline stablecoin payment operations desk, Exact EURC invoices require target amount, spend and fee policy, Hosted gap: asynchronous durability, absent account lock, function budget (+17 more)

### Community 6 - "Testnet UI and responses"
Cohesion: 0.11
Nodes (15): body(), explorer(), guidance, labels, LivePayment, short(), Snapshot, stage (+7 more)

### Community 7 - "TypeScript configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 8 - "Simulator browser checks"
Cohesion: 0.18
Nodes (12): Historical simulator browser smoke, Historical simulation build evidence, Completed simulation implementation plan, Historical deterministic settlement design, Historical local simulation design, artifacts, browser(), click() (+4 more)

### Community 9 - "Package integration references"
Cohesion: 0.15
Nodes (12): name, private, type, version, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @libsql/client, @types/react (+4 more)

### Community 10 - "Public transaction proof UI"
Cohesion: 0.24
Nodes (11): chainLabel(), explorerBase, PaymentProof, PROOF, ProofPage(), routeLabel(), short(), shortAddr() (+3 more)

### Community 11 - "Runtime dependencies"
Cohesion: 0.20
Nodes (10): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, @libsql/client, lucide-react, react (+2 more)

### Community 12 - "Development and test scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:api, dev:ui, preview, setup-db, test (+2 more)

### Community 13 - "Build tool dependencies"
Cohesion: 0.33
Nodes (6): devDependencies, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react

### Community 14 - "React HTML entry point"
Cohesion: 0.40
Nodes (3): Clearline HTML entry, @fontsource-variable/manrope, react-dom

### Community 15 - "Vercel function configuration"
Cohesion: 0.40
Nodes (4): maxDuration, functions, api/**/*.mjs, rewrites

### Community 16 - "Dependency compatibility overrides"
Cohesion: 0.67
Nodes (3): overrides, rpc-websockets, uuid

## Knowledge Gaps
- **118 isolated node(s):** `name`, `private`, `version`, `type`, `node` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 141 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Bind attestation to original source transaction` connect `Historical plans and proof` to `Chain execution and validation`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `viem` connect `Chain execution and validation` to `Package integration references`, `Local signer and recovery`, `Hosted API and database`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `App()` (e.g. with `pageFromHash()` and `isFinal()`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Simulation workspace and money` be split into smaller, more focused modules?**
  _Cohesion score 0.060805860805860805 - nodes in this community are weakly interconnected._
- **Should `Chain execution and validation` be split into smaller, more focused modules?**
  _Cohesion score 0.08469449485783424 - nodes in this community are weakly interconnected._
## Evidence boundary

Generated code relationships are structural navigation; document relationships include historical and inferred claims. The October 1 checks use synthetic API responses and do not establish new onchain proof or hosted payout durability.

## Extraction integrity warnings

Raw extraction has 0 dangling endpoint edges, 1 self-loop, and 44 same-endpoint edges collapsed by the default undirected graph. Repeated call/contains relationships can collapse; this graph is navigation, not a lossless call trace.
