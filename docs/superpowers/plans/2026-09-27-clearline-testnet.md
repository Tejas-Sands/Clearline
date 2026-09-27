# Clearline Testnet Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Check off evidence-backed tasks.

**Goal:** Add a real, recoverable testnet payment route to Clearline.
**Architecture:** Existing React simulation plus separate testnet UI; local Node API with generated test-only signer, atomic disk records, Circle SDKs and verified receipts.
**Tech Stack:** Node 24 native TypeScript, React, viem, Circle Swap/Bridge kits.
**Spec:** ../specs/2026-09-27-clearline-testnet.md

## Constraints
- Test assets only; no paid infrastructure or institutional onboarding.
- Work in the requested project folder; it has no usable git history, so do not invent commits/worktree setup.
- No private keys in responses, client bundles, logs, documentation or exports.
- Mainnet networks are rejected, operations serialized, uncertain submissions cannot be retried blindly.

## Tasks
- [x] 1. Probe SDKs/RPC, generate isolated test wallet, obtain test assets, and document verified interfaces. Arc execution proved; 20 Base USDC and 0.001 Base test ETH received.
- [x] 2. Add tested payment model, durable store, signer/provider integration and receipt recovery. Files: `server/`, `tests/testnet*.test.ts`. 54 tests pass; actual approval recovery and restart verified; reverted CCTP retry covered with mocked receipts.
- [x] 3. Add localhost API with origin safeguards and reproducible start/check scripts. Test validation and routes. Unit guards and browser duplicate-payout/missing-token rejection pass.
- [x] 4. Add Testnet payments page and export, preserving simulator; verify browser behavior. Both browser suites pass, including testnet CSV/reload/desktop/mobile.
- [x] 5. Execute available public testnet route; record proof, limitations and run instructions. Run unit tests, build and independent review.

Task 5 completed evidence: `ARC-PROOF-001` reconciled after 1 USDC → 0.822060 EURC payment. `CCTP-PROOF-001` reconciled after one 1-USDC Base burn, one 1-USDC Arc mint, and 0.822252 EURC conversion/payment. `docs/TESTNET_PROOF.json` independently verifies all ten receipts. Standard attestation took approximately 24 minutes; the pending burn survived server restarts without duplication. CCTP V2 message matching and source transaction binding were corrected with five failing-then-passing regressions. Full suite 54/54, frontend build, browser checks, and independent reviews passed; review findings are fixed.

## Review focus
- Timeout/restart between signature, broadcast and persistence cannot duplicate payment.
- A receipt must prove the expected token, sender, recipient and amount before paid status.
- Malicious browser requests cannot invoke the local signer; API never accepts arbitrary network/call data.
- Unsupported pools, unavailable faucets and RPC failures are reported honestly without fabricated balances.
- Simulated and actual testnet records remain distinct through export and reload.
