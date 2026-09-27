# Clearline testnet execution

User approved: CCTP funding from Base Sepolia to Arc testnet, USDC/EURC conversion, recipient payment, and invoice reconciliation using test assets only. No StableFX institutional access and no paid services.

Build a separate Testnet payments workspace in the existing app. Preserve the existing simulation and its data. A local-only Node server owns a freshly generated testnet signer and durable operation records. Keys never reach browser code, logs, or git. Bind localhost; validate Host, Origin and JSON mutation headers. Hard-code allowed test networks and validate RPC chain IDs. Cap each operation to a small test amount. No production signing configuration.

Use the published Circle Swap SDK with a viem adapter, public RPC, and optional server-side API key only if actually needed. Use CCTP via Bridge Kit or direct public contracts. Prove interfaces with a small integration script before assuming feasibility. Use Circle faucet test assets. If a faucet requires human interaction, provide the generated public address while continuing implementation.

Payments carry immutable reference, recipient, source amount and wallet. Request a fresh quote before approval; show minimum output and fees. Bridge, swap and recipient transfer are separate persisted stages. An operation is paid only after verifying the EURC transfer receipt and logs. A request timeout or restart never authorizes automatic duplicate submission. Save signed transaction hashes before broadcasting where possible; recover by receipt/status. Unknown SDK execution must block retry until verified. Matching an invoice changes accounting status only.

UI: wallet balances, faucet links, new payment form, explicit actions, stage progress, error/recovery controls, transaction explorer links, real-record CSV export. Labels say test tokens have no monetary value and live FX rates/fiat payouts are not demonstrated.

Acceptance: existing tests pass; tests cover validation, stage guards, persistence/replay, receipt checks and API origin guards. Production frontend builds. Browser flow works. Execute a real testnet transaction sequence if public faucet/provider access permits; record precise hashes and actual outcomes. Never report simulations as chain proof.
