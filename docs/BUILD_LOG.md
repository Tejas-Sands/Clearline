# Clearline build log

Plan: `docs/superpowers/plans/2026-09-27-clearline.md`.

- Shortlist and design written. Sixth opportunity is explicitly a privacy-dependent watchlist item.
- Settlement tests first failed against missing behavior. Domain implementation then passed 12/12 tests.
- Node test worker isolation is unavailable in this restricted environment; use the supported `--test-isolation=none` runner mode. Tests still execute the real implementation.
- Dependencies installed with a lockfile. No Git commits: the workspace contains empty read-only Git metadata.
- CSV/persistence tests written and observed failing before implementation.
- CSV/persistence implementation passed the combined 21-test suite.
- React interface and strict TypeScript/Vite production build completed.
- Independent read-only review identified lifecycle-invalid saved records, silently discarded blank CSV records, and hidden mobile navigation focus targets. Two new boundary tests reproduced the data bugs before fixes; the 23-test suite passed afterward.
- Reconciliation now has matched/unmatched filters. Oversized file selection clears an earlier valid preview, preventing unintended import of stale data.
- Browser smoke checks verified exact settlement/reconciliation amounts, unknown-outcome recovery, expired quote refresh, CSV import/export, search, and reconciliation filters.
- Mobile smoke testing caught an absolutely positioned screen-reader table heading escaping its scroll container. Giving the scroll container a positioning context reduced measured document width from 583px to the 375px viewport.
- Removed the mobile visibility transition so closed navigation immediately leaves keyboard navigation. The menu traps focus, closes with Escape, and restores the trigger focus.
- Final browser smoke run passed all nine groups, including local-data recovery; browser error log empty. Screenshots saved to `artifacts/overview-desktop.png`, `artifacts/reconciled-payment.png`, and `artifacts/overview-mobile.png`.

## Remaining product boundary

The deliverable is a functional local simulation, not a live StableFX integration. Institutional API access, real signing, bank payouts, durable multi-user persistence, and production authorization are explicitly deferred in README. No important review finding remains unresolved in the demo scope.
