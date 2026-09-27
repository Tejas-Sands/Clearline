# Graph Report - arc  (2026-09-27)

## Corpus Check
- Corpus is ~25,560 words - fits in a single context window. You may not need a graph.

## Summary
- 334 nodes · 711 edges · 10 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- React Workspace Interface
- Product Direction and Verified Evidence
- Local API Persistence and Browser Checks
- Testnet Chain Execution and Receipts
- Dependencies and Package Tooling
- Simulation Money and CSV
- TypeScript Build Configuration
- Development and Simulator Checks
- Historical Product Opportunities
- Historical Simulation Evidence

## God Nodes (most connected - your core abstractions)
1. `Current architecture and evidence map` - 38 edges
2. `makeChain()` - 22 edges
3. `displayMoney()` - 15 edges
4. `compilerOptions` - 15 edges
5. `App()` - 14 edges
6. `Testnet payments workspace` - 14 edges
7. `Current agent handoff` - 13 edges
8. `transition()` - 12 edges
9. `react` - 10 edges
10. `recoverBridge()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Simulation exactly-once recovery` --semantically_similar_to--> `Persist signature and hash before broadcast`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `fixture()` --calls--> `makeChain()`  [EXTRACTED]
  tests/testnet-chain.test.ts → server/chain.mjs
- `fixture()` --calls--> `makeService()`  [EXTRACTED]
  tests/testnet-service.test.ts → server/service.mjs
- `Historical six-opportunity shortlist` --references--> `Clearline README`  [EXTRACTED]
  ARC_TOP_6_USE_CASES.md → README.md
- `Historical StableFX settlement operations selection` --conceptually_related_to--> `Clearline payment operations desk`  [INFERRED]
  ARC_TOP_6_USE_CASES.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Distinct funding, conversion, payout and reconciliation stages verified on testnet** — docs_project_map_cctp_funding, docs_project_map_circle_swap_kit, docs_project_map_recipient_payout, agents_reconciliation [EXTRACTED 1.00]

## Communities (10 total, 0 thin omitted)

### Community 0 - "React Workspace Interface"
Cohesion: 0.08
Nodes (48): lucide-react, react, App(), act(), exportCsv(), Overlay, Page, pageFromHash() (+40 more)

### Community 1 - "Product Direction and Verified Evidence"
Cohesion: 0.07
Nodes (59): CCTP V2 immutable attestation validation, Clearline payment operations desk, Current agent handoff, Persist signature and hash before broadcast, Integer money and shared Arc USDC balance, Loopback signer request safeguards, Reconciliation changes accounting only, Exclude private runtime state and secrets (+51 more)

### Community 2 - "Local API Persistence and Browser Checks"
Cohesion: 0.08
Nodes (35): ref_node_assert, ref_node_crypto, ref_node_fs, ref_node_http, ref_node_os, ref_node_path, ref_node_test, artifacts (+27 more)

### Community 3 - "Testnet Chain Execution and Receipts"
Cohesion: 0.11
Nodes (39): @circle-fin/swap-kit, viem, balances, clients, payments, BASE_USDC, cctpAbi, EURC (+31 more)

### Community 4 - "Dependencies and Package Tooling"
Cohesion: 0.05
Nodes (40): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, lucide-react, react, react-dom (+32 more)

### Community 5 - "Simulation Money and CSV"
Cohesion: 0.13
Nodes (29): Activity, createInitialState(), FEE, MAX_AMOUNT, Quote, QUOTE_LIFETIME, RATE, record() (+21 more)

### Community 6 - "TypeScript Build Configuration"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 7 - "Development and Simulator Checks"
Cohesion: 0.20
Nodes (9): ref_node_child_process, artifacts, browser(), click(), close(), evaluate(), state(), waitText() (+1 more)

### Community 8 - "Historical Product Opportunities"
Cohesion: 0.33
Nodes (6): Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist, Multicurrency tokenized-fund subscriptions, Market-maker inventory and obligation controls, Just-in-time multicurrency treasury funding

### Community 9 - "Historical Simulation Evidence"
Cohesion: 0.33
Nodes (6): Historical simulator browser smoke, Historical simulation build evidence, Completed simulation implementation plan, Historical deterministic settlement design, Historical local simulation design, Simulator browser checks

## Knowledge Gaps
- **89 isolated node(s):** `name`, `private`, `version`, `type`, `node` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Current architecture and evidence map` connect `Product Direction and Verified Evidence` to `Historical Simulation Evidence`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `App()` (e.g. with `pageFromHash()` and `isFinal()`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React Workspace Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.0798611111111111 - nodes in this community are weakly interconnected._
- **Should `Product Direction and Verified Evidence` be split into smaller, more focused modules?**
  _Cohesion score 0.07071887784921099 - nodes in this community are weakly interconnected._
- **Should `Local API Persistence and Browser Checks` be split into smaller, more focused modules?**
  _Cohesion score 0.08140610545790934 - nodes in this community are weakly interconnected._
## Review and extraction limits

Generated 2026-09-27. Read `../AGENTS.md` and `../docs/PROJECT_MAP.md` for current status; historical plan nodes are not proof of completion. Code extraction is static and document extraction was performed by a host-session agent. Host-agent token usage is not metered here: generated zero token counters mean unknown, not zero cost. No external semantic API was used.

The interactive graph collapses parallel relationships between the same nodes. `extraction.json` retains the full raw edge list; `GRAPH_DIAGNOSTICS.md` reports duplicate endpoints, unresolved references and self-loops. This graph is navigation assistance, not an exhaustive call graph or runtime verification. Private runtime state, credentials, dependencies, generated assets and the decorative favicon were excluded.
