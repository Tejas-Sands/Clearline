# Clearline testnet implementation ledger

Plan: docs/superpowers/plans/2026-09-27-clearline-testnet.md

- User authorized the full testnet route. Implementation proceeds inline without another design approval.
- Dedicated local test-only signer selected for a runnable prototype without browser wallet setup. Production custody is outside scope.
- Existing simulation remains separate. Native Arc USDC uses 18 decimal units; ERC-20 accounting uses 6 for the same balance.
- Preflight: SDK execution/recovery shapes must be probed before defining stage transitions. All signing paths must enforce the testnet chain allowlist.

## Status review — 2026-09-27

- Testnet UI, localhost API, model/service, disk store, durable transaction journal, CCTP contract adapter and Swap Kit integration now exist. See [PROJECT_MAP.md](PROJECT_MAP.md) for the current inventory and boundaries.
- Fresh `npm test`: 36/36 passed (23 simulation/IO, 13 testnet logic/security/journal/service). Fresh `npm run build`: passed. The frontend build does not typecheck server JavaScript; fake chain tests do not validate the live SDK path.
- Sanitized inspection of the local ledger found `ARC-PROOF-001` in `funded`, with a wallet-client initialization error and no recorded transactions. This is not proof of funding, conversion, bridging or payment.
- Installed adapter declarations and implementation pass a viem `Chain` (`id`) to client factories; current `server/chain.mjs` guards inspect `chain.chainId`. This mismatch is the immediate integration blocker to fix/test.
- Added `AGENTS.md`, the current architecture/status map and Graphify navigation artifacts. Runtime code and wallet state were not changed; no chain transactions were submitted in this review.
- Remaining acceptance: exercise actual SDK/receipt/recovery paths, run a testnet browser flow, and record verified end-to-end transaction evidence. Do not mark the original plan complete based on file presence alone.

## Funded testnet execution — 2026-09-27

- User authorized continuing the recommended MVP and using the existing 20 Arc testnet USDC. Execute the existing 1 USDC `ARC-PROOF-001` first, with the local generated recipient.
- Ruling: continue in this folder with this ledger, without Git/worktree scripts — no usable Git history exists and the testnet plan explicitly requires this workspace.
- Installed SDK probe confirmed the client factories receive `{ id: 5042002 }`, not `chainId`. New adapter tests reproduced the error; changed both guards to `chain.id`, retaining mainnet and RPC mismatch rejection.
- New tests reproduced conversion without a verified swap, and a quote adapter capable of starting submission. Added receipt/output gating before conversion and made quote adapters unable to submit.
- Fresh unit suite: 41/41 passed. Live API reported 20 Arc USDC, 0 EURC, 0 Base Sepolia USDC and 0 Base ETH. UI loaded without browser errors.
- Ruling: prove fixed-USDC-input payment first; exact-EURC invoice semantics remain a separate product increment. No mainnet configuration or signing is enabled.
- Live SDK execution used USDC `increaseAllowance` (selector `0x39509351`), not `approve`. The first attempt's successful allowance transaction was mislabeled `swap:1`, causing the old journal to reuse its hash for the swap request. Receipt verification prevented false conversion; no USDC principal moved.
- Reproduced approval classification and journal intent collision with failing tests. Added `increaseAllowance` recognition, transaction-intent matching for reused journal steps, and receipt/transaction-proven recovery of legacy mislabeled approvals. Suite passed 44/44.
- Restarted the server and recovered the original record through the UI. The same hash is retained as `swap_approve:1`; it returned to `funded` without another broadcast. Fresh quote requested for the original 1 USDC amount.
- Arc-only proof completed through browser controls: 1 USDC input, 0.813844 EURC minimum, 0.822060 EURC actual output, exact 0.822060 EURC recipient transfer, then invoice reconciliation. All four recorded transactions verified successful. Remaining Arc USDC: 18.982572; total source debit 1.017428 USDC including all four transaction fees and provider fee.
- Independent review found SDK-confirmed approvals remained locally submitted, and reverted CCTP stages lacked retry. Reproduced and fixed both with tests: approval receipt is checked before swap receipt/failure; payout revalidates conversion; explicit bridge retry rechecks a reverted receipt, retains prior hashes, and never repeats a successful burn when mint fails. Suite: 49/49.
- Added read-only `scripts/verify-testnet.mjs` to independently verify completed payment receipts and produce public `docs/TESTNET_PROOF.json`; it never loads the wallet or sends transactions.
- Both browser suites passed: nine simulator groups; testnet persisted/reconciled view, rejected duplicate payout and missing-token requests, real-record CSV, desktop/mobile rendering and reload. Independent receipt script passed.
- Review disposition: both concrete findings fixed with regressions. Ruling on review exclusions: parent verifies actual balances, receipts, browser and restarts; SDK atomic batch mode remains outside the exercised sequential prototype path, so no batch recovery guarantee is claimed. No production/mainnet readiness claim.
- Base Sepolia USDC funding arrived (20 USDC); ETH gas still pending. No CCTP burn submitted yet.

## CCTP proof execution — 2026-09-27

- User funded the project wallet with 0.001 Base Sepolia test ETH. Verified the balance before using the existing 1-USDC `CCTP-PROOF-001` record.
- Source approval and burn succeeded. Original burn: `0x1b5e955ed53db1d408fa2a85cb703f0bc3e92d8c5e1c390b6ef749d4c26021ee`, Base block 47360897. Circle first returned an indexing 404, then `pending_confirmations`. No second burn was submitted.
- Inspection of the public source message and Circle's [technical guide](https://developers.circle.com/cctp/references/technical-guide) found that exact message equality cannot match CCTP V2 attestations: Circle populates nonce, executed finality, executed fee and expiration offchain.
- Four regression tests failed before the fix. Recovery now compares all immutable message bytes, including hooks, and checks nonzero matching nonce, sufficient finality and fee bounds. Invalid completed messages raise an error; an indexing 404 or pending response leaves the original burn recoverable. Tests use a public onchain message fixture and mocked network responses, without accessing the local wallet.
- Fresh suite: 53/53 passed. Frontend build passed. API restarted with the original source burn preserved; attestation remains pending at this checkpoint.
- Focused review found that identical source burns can have identical immutable message bytes. Added required `sourceTxHash` binding to the recorded burn, with a wrong-hash regression that failed before the fix. Full suite now passes 54/54. No other issues were found in the focused review.
- Circle attestation completed after approximately 24 minutes with executed finality 2000, zero CCTP token fee, and the expected source transaction hash/nonce. Resumed the original burn through the UI; exactly 1 USDC minted on Arc.
- Full crosschain proof completed: 1 Base USDC → 1 Arc USDC → 0.822252 EURC output, above the 0.813463 minimum → exact recipient transfer → reconciliation. Original burn, mint and payment hashes remain unique. No new source burn was created during recovery.
- Independent RPC verification passed for all ten receipts across both proof payments. Final balances: 18.963038 Arc USDC, 19 Base USDC, 0.000998997742905892 Base ETH, zero Arc EURC. Public proof updated in `docs/TESTNET_PROOF.json`; screenshot at `artifacts/testnet-cctp-reconciled.png`.
