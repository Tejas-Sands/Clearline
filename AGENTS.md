# Clearline: agent handoff

Last reviewed: 2026-10-01. Read this first, then [the project map](docs/PROJECT_MAP.md). Treat this as a dated handoff; verify code and current evidence before updating status.

## Product and current direction

Clearline is a stablecoin payment operations desk: invoice/reference → funding → approved conversion → recipient payment → reconciliation/export. The current direction drops StableFX as an MVP dependency. The executable route is Base Sepolia USDC → CCTP → Arc Testnet USDC → Circle Swap Kit USDC/EURC conversion → EURC recipient transfer. Direct Arc funding skips CCTP.

There are **two separate workspaces**:

- **Simulation:** complete local demo, synthetic balances, browser persistence, fixed illustrative FX rate. No chain proof.
- **Testnet payments:** Both direct-Arc and Base Sepolia → CCTP → Arc → swap → recipient payment → reconciliation are **verified onchain**. Original burns survive server restarts; reverted-stage retries are regression tested.

Snapshot evidence (2026-09-27): **54/54 tests**, frontend build, simulator browser checks and testnet browser checks passed. `ARC-PROOF-001` is reconciled: 1 USDC input → 0.822060 EURC paid to the local test recipient. `CCTP-PROOF-001` also reconciled: 1 USDC burned on Base → 1 USDC minted on Arc → 0.822252 EURC paid. All ten recorded transaction receipts independently verified in `docs/TESTNET_PROOF.json`. Current balances: 18.963038 Arc USDC, 19 Base USDC, 0.000998997742905892 Base ETH. Initial SDK and approval-journal bugs are fixed. `funded` on direct-Arc records is still a workflow state, not proof of sufficient wallet funds.

2026-10-01 update: the UI uses warmer sage surfaces, larger controls, separated workspace navigation, and a testnet progress/next-action guide. Fixed two broken imports that prevented `api/testnet/payments/action.mjs` from loading on Vercel. The frontend handles non-JSON API failures without showing a JSON parser exception; action buttons expose consistent animated loading feedback with reduced-motion support. A read-only 3-USDC quote probe reproduced two Circle “No route available” responses followed by success with identical parameters. Quotes retry that specific failure once after the SDK exhausts its own retries, preserving the amount and 100-bps slippage; persistent failures offer recovery guidance. Signing/conversion/payout are not automatically retried. The earlier stop-limit change in `8a5f400` was incorrect: public Swap Kit accepts human-readable output amounts and converts them internally, whereas Circle's HTTP API and stored quotes use integer base units. Passing stored integers directly scaled the approved minimum a second time. Corrected that boundary and replaced the mocked test with installed-SDK HTTP regressions. **69/69 unit tests** and frontend build passed; a read-only 3-USDC constrained estimate accepted the exact approved minimum at the unchanged 100 bps. Correctly formed requests can still encounter intermittent Circle route/slippage failures. No new chain transactions were approved. Synthetic testnet and simulator browser checks passed for the preceding UI/quote update. The September proof and balances above are historical snapshots, not newly checked balances.

Hosted conversion checkpoint fix (2026-10-01): the journal passed `_shared.mjs`'s `save` method unbound, losing `this` and producing the user's `Cannot read properties of undefined (reading 'state')` error. The callback now uses its store closure and returns a serialized, immutable Turso checkpoint promise. The journal awaits persistence before broadcast and after submission, retains the original signature on persistence errors, and re-checkpoints it on recovery. Receipt/retry checkpoints and the action handler's final save also await the same ordered persistence boundary. **76/76 tests** and frontend build passed. An authenticated hosted-handler fixture exercised recovery through the real chain adapter with mocked DB/RPC, verified original-byte broadcast ordering and EURC receipt output, and checked public serialization. Restoring the old callback reproduced the exact error; restoring the fix passed. No live conversion/payout was authorized.

The repository now also has `api/` Vercel handlers and `server/db.mjs` Turso persistence. Their execution guarantees are not covered by the original local onchain proof. The per-store save ordering is regression tested, but the hosted action handler still has no enforced account-wide operation lock. Cross-request concurrency, hosted function timeout/crash recovery, and actual database fault outcomes need dedicated validation before treating hosted payouts as equivalent to the verified local signer.

## Read next / navigate

1. [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md): architecture, file map, evidence, gaps, and CCTP/DEX decision.
2. [docs/superpowers/specs/2026-09-27-clearline-testnet.md](docs/superpowers/specs/2026-09-27-clearline-testnet.md): testnet scope and acceptance criteria.
3. `server/chain.mjs`, then `server/service.mjs`: actual execution and lifecycle.
4. `src/components/TestnetPayments.tsx`: testnet user flow.
5. `src/domain.ts`, `src/useWorkspace.ts`: separate simulation logic.
6. `tests/`: regression evidence. Adapter tests exercise installed SDK factories with mocked RPC; live proof is separately recorded in `docs/TESTNET_PROOF.json`.

The original design, shortlist, and simulation build log retain historical StableFX framing. The testnet plan now records implemented steps and completed CCTP proof. Current code + fresh checks outrank historical plans.

## Commands

```sh
npm ci                     # install locked dependencies if needed
npm run dev                # UI :5173 + local signing API :8787, loopback only
npm run dev:ui             # UI only; testnet page needs API separately
npm run dev:api            # starts local test signer; creates wallet if absent
npm test                   # Node tests; requires Node >=22.18
npm run build              # frontend TypeScript + Vite build
npm run test:e2e           # existing simulator smoke; requires agent-browser + Chrome + running UI
node scripts/testnet-browser-smoke.mjs  # existing reconciled records; no new transfer approvals
node scripts/ui-refresh-smoke.mjs      # synthetic API/UI checks; no signer or chain transactions
node scripts/verify-testnet.mjs         # independent read-only RPC proof; prints public JSON
```

`npm run build` does **not** typecheck `server/*.mjs` or `api/*.mjs`; `tsconfig.json` includes `src` and `vite.config.ts`. `test:e2e` covers the simulator; the separate testnet script checks completed records, export, persistence and duplicate rejection. `tests/testnet-api.test.ts` checks credential-free handler rejection and frontend response parsing; `tests/testnet-db-store.test.ts` checks ordered hosted checkpoints and authenticated handler recovery with mocked external boundaries. A Git repository and history are now available; verify its current status before editing or pushing.

## Invariants to preserve

- Only Arc Testnet chain ID `5042002` and Base Sepolia `84532` are authorized in the current implementation. CCTP domain IDs are different: Arc `26`, Base `6`.
- Money uses integer strings and `bigint`, six token decimals. Arc native USDC uses 18 decimals but shares the ERC-20 USDC balance; never add the two balances together.
- Testnet limit: >0 and ≤100 USDC per payment; Base bridge currently requires >0.01 USDC. Current fee cap is code configuration, not a universal protocol guarantee.
- Persist signed raw transaction bytes/hash **before** broadcast (`server/journal.mjs`). Recovery replays the same signed bytes or checks the original receipt; timeout never authorizes a fresh duplicate transfer.
- Await asynchronous persistence promises at transaction checkpoints. Keep the original signed entry on persistence errors; recovery must re-checkpoint those same bytes, not replace the signature. Hosted save queues order one store instance only, not concurrent requests/accounts.
- SDK viem factories receive `chain.id`, not `chain.chainId`. Recognize both USDC `approve` and `increaseAllowance`; quote adapters cannot submit. A reused journal step must match its original destination, calldata and value.
- Stored quote minima and Circle HTTP `stopLimit` use six-decimal integer base units. Public `SwapKit.swap`/`estimate` config `stopLimit` uses a human-readable decimal string and performs its own conversion. Never confuse these API layers or test only a mocked `SwapKit.swap` call.
- Confirm SDK approval receipts in our journal, too. Conversion requires verified output/minimum and a successful swap; payout rechecks conversion. Explicit CCTP retry requires a freshly verified reverted receipt, preserves earlier hashes, and retries mint without repeating a successful burn.
- CCTP V2 attestation changes nonce, executed finality, fee and expiration. Bind the response sourceTxHash to the recorded burn, match immutable message bytes, and validate nonce/finality/fee bounds; exact full-message equality is incorrect. Indexing 404 means pending.
- Bridge completion, conversion, recipient payment, and reconciliation are distinct stages. Reconciliation moves no funds.
- `paid` requires a successful expected transaction and exact EURC transfer log matching sender, recipient, and output amount.
- Keep simulation/localStorage records and testnet/disk records separate, including exports.
- Keep Host/Origin/session-token safeguards and loopback binding. This is not production identity/authentication.
- Never expose private keys, raw signed transactions, or server credentials in frontend bundles, logs, exports, docs, graphs, or responses. Never use `VITE_*` for secrets.
- `.clearline-testnet/` is sensitive operational state. Do not index it or read/print `wallet.json`. Do not delete the journal to retry an operation. Inspect only explicitly selected public payment fields when needed.

## Next engineering work

1. Both proof payments are complete; do not replay them or spend more tokens without a new test objective. Use the read-only proof script to recheck their receipts. Standard attestation took approximately 24 minutes in this run.
2. Extend recovery coverage for faults not live-exercised. Review covered the sequential SDK path; batch submission is not an established supported path. No mainnet readiness claim.
3. Define exact EURC invoice settlement: today users fix a USDC input and pay the variable EURC output. Exact euro obligations need target amounts, maximum source spend, fee handling, and under/overpayment rules.

## Knowledge graph

`graphify-out/graph.json` is a generated navigation aid; `graphify-out/graph.html` is interactive; `graphify-out/GRAPH_REPORT.md` contains extraction statistics. Code relationships are structurally extracted; document relationships can be inferred and are labeled. Generated edges are not runtime execution proof.

```sh
graphify query "How does a testnet payment reach reconciliation?" --budget 1500
graphify explain "makeService"
graphify affected "verifyPaymentReceipt" --depth 2
```

Respect `.graphifyignore` on rebuilds. After changes, refresh the graph with the Graphify skill/full workflow for both docs and code (`graphify update .` refreshes structural code but may need semantic document extraction). Refresh this handoff and `docs/PROJECT_MAP.md` when architecture, blockers, or verification evidence changes; never promote planned work to verified work without evidence.
