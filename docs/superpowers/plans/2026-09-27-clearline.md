# Clearline Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking. User already authorized implementation.

**Goal:** Deliver the six-option shortlist and a usable local settlement-operations prototype.

**Architecture:** Pure settlement state machine drives a browser-only React app. Integer strings persist financial values; bigint performs arithmetic. Simulation status is explicit throughout.

**Tech Stack:** React, TypeScript, Vite, Lucide, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-27-clearline-design.md`

## Global Constraints

- Node 22.18+; no real transactions or provider secrets.
- USDC → EURC only; rate 0.915000; simulated fee 0.25 USDC; 60-second quotes.
- Positive amounts, six decimal precision, maximum 1,000,000,000 USDC.
- Atomic imports, unique invoice references, exactly-once local balance transitions.
- No real confidentiality claims; local demo persistence only.

## Review Focus

- Duplicate clicks and unresolved outcomes must never debit twice (Task 1).
- Decimal rounding and invalid input must never silently alter an obligation (Task 1).
- CSV quotations, duplicate references, and spreadsheet formula injection (Task 2).
- Corrupt or unavailable local storage must preserve an explicit recovery choice (Task 2).
- Keyboard dialogs and 375px layouts must remain operable (Task 3).

## Task 1: Settlement engine

**Files:** `src/domain.ts`, `tests/domain.test.ts`, `package.json`, `tsconfig.json`.
**Produces:** State, Payment, Action types; parseUnits(string), formatUnits(string), createInitialState(now), transition(state, action, now).

- [x] Write behavior tests for exact arithmetic, quote expiry, balance conservation, duplicate approval, unknown-outcome checking, and reconciliation.
- [x] Run `npm test` and confirm missing implementation fails.
- [x] Implement the state machine and representative synthetic data.
- [x] Run `npm test`; expect all domain cases green.

## Task 2: Import, export, and persistence

**Files:** `src/csv.ts`, `src/storage.ts`, `tests/io.test.ts`.
**Consumes:** Payment/State and exact money functions from Task 1.
**Produces:** parseImport(text, existing), exportPayments(payments), decodeState(raw).

- [x] Write failing tests for quoted CSV, invalid/duplicate obligations, atomic rejection, formula-safe exports, and malformed saved state.
- [x] Implement strict boundaries and versioned local storage.
- [x] Run `npm test`; expect all cases green.

## Task 3: Operations desk

**Files:** `src/App.tsx`, `src/components/*`, `src/styles.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `README.md`, `public/*`.
**Consumes:** Tasks 1 and 2 exports; UI never implements independent financial arithmetic.

- [x] Build the responsive overview, queue, reconciliation, activity, and settings pages.
- [x] Add working entry/import/export, payment details, expiring quotes, recovery, funding, and reset controls.
- [x] Run `npm test` and `npm run build`; expect zero failures.
- [x] Exercise browser flows and 375px layout; inspect console and screenshot.
- [x] Write setup and real-integration limitations in README; record verification.

## Execution notes

Pre-flight: Tasks 2/3 consume the same State and Payment shapes from Task 1. Financial calculations remain in domain.ts; IO returns validated obligations before the state machine mutates them. No interface conflict.

Git metadata is an empty read-only directory, so Git commits/worktrees are unavailable. Work directly in the authorized empty workspace without modifying that metadata.
