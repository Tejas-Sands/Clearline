# Graph Report - arc  (2026-09-27)

## Corpus Check
- 55 files · ~29,754 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 395 nodes · 840 edges · 11 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App.tsx
- Current architecture and evidence map
- server/index.mjs
- chain.mjs
- package.json
- domain.ts
- compilerOptions
- payments/index.mjs
- Historical six-opportunity shortlist
- ProofPage.tsx
- api/**/*.mjs

## God Nodes (most connected - your core abstractions)
1. `Current architecture and evidence map` - 38 edges
2. `makeChain()` - 22 edges
3. `displayMoney()` - 15 edges
4. `compilerOptions` - 15 edges
5. `App()` - 14 edges
6. `Testnet payments workspace` - 14 edges
7. `Current agent handoff` - 14 edges
8. `transition()` - 12 edges
9. `handler()` - 11 edges
10. `viem` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Simulation exactly-once recovery` --semantically_similar_to--> `Persist signature and hash before broadcast`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `handler()` --indirect_call--> `publicPayment()`  [INFERRED]
  api/testnet.mjs → server/model.mjs
- `Historical StableFX settlement operations selection` --conceptually_related_to--> `Clearline payment operations desk`  [INFERRED]
  ARC_TOP_6_USE_CASES.md → AGENTS.md
- `handler()` --calls--> `normalizePayment()`  [EXTRACTED]
  api/testnet/payments/index.mjs → server/model.mjs
- `handler()` --calls--> `publicPayment()`  [EXTRACTED]
  api/testnet/payments/index.mjs → server/model.mjs

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Distinct funding, conversion, payout and reconciliation stages verified on testnet** — docs_project_map_cctp_funding, docs_project_map_circle_swap_kit, docs_project_map_recipient_payout, agents_reconciliation [EXTRACTED 1.00]

## Communities (11 total, 0 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.07
Nodes (51): lucide-react, react, App(), act(), exportCsv(), FullPage, Overlay, Page (+43 more)

### Community 1 - "Current architecture and evidence map"
Cohesion: 0.06
Nodes (64): CCTP V2 immutable attestation validation, Clearline payment operations desk, Current agent handoff, Persist signature and hash before broadcast, Integer money and shared Arc USDC balance, Loopback signer request safeguards, Reconciliation changes accounting only, Exclude private runtime state and secrets (+56 more)

### Community 2 - "server/index.mjs"
Cohesion: 0.07
Nodes (35): ref_node_child_process, ref_node_crypto, ref_node_fs, ref_node_http, ref_node_os, ref_node_path, artifacts, browser() (+27 more)

### Community 3 - "chain.mjs"
Cohesion: 0.09
Nodes (48): @circle-fin/swap-kit, ref_node_assert, ref_node_test, viem, balances, clients, payments, BASE_USDC (+40 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, @circle-fin/adapter-viem-v2, @circle-fin/bridge-kit, @circle-fin/swap-kit, @fontsource-variable/manrope, @libsql/client, lucide-react, react (+35 more)

### Community 5 - "domain.ts"
Cohesion: 0.12
Nodes (30): Action, Activity, createInitialState(), FEE, MAX_AMOUNT, Quote, QUOTE_LIFETIME, RATE (+22 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleResolution, noEmit (+8 more)

### Community 7 - "payments/index.mjs"
Cohesion: 0.13
Nodes (26): authorizeVercelRequest(), defaultRecipient(), getAccount(), getSessionId(), getAccount(), handler(), handler(), handler() (+18 more)

### Community 8 - "Historical six-opportunity shortlist"
Cohesion: 0.29
Nodes (7): Multicurrency merchant-acquirer settlement, Confidential payroll watchlist, Historical six-opportunity shortlist, Multicurrency tokenized-fund subscriptions, Market-maker inventory and obligation controls, Historical StableFX settlement operations selection, Just-in-time multicurrency treasury funding

### Community 9 - "ProofPage.tsx"
Cohesion: 0.24
Nodes (11): chainLabel(), explorerBase, PaymentProof, PROOF, ProofPage(), routeLabel(), short(), shortAddr() (+3 more)

### Community 10 - "api/**/*.mjs"
Cohesion: 0.33
Nodes (5): maxDuration, runtime, functions, api/**/*.mjs, rewrites

## Knowledge Gaps
- **102 isolated node(s):** `name`, `private`, `version`, `type`, `node` (+97 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 5 inferred relationships involving `makeChain()` (e.g. with `bridge()` and `finishPay()`) actually correct?**
  _`makeChain()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `App()` (e.g. with `pageFromHash()` and `isFinal()`) actually correct?**
  _`App()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _102 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07289002557544758 - nodes in this community are weakly interconnected._
- **Should `Current architecture and evidence map` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._
- **Should `server/index.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._
- **Should `chain.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0853302162478083 - nodes in this community are weakly interconnected._