# Security & Abuse Prevention

Clearline operates a public demo environment on the Arc Testnet and Base Sepolia networks. Because testnet operations involve actual network gas and automated liquidity, there are security checks in place to prevent the primary testnet wallet from being drained by malicious actors, automated scripts, or runaway loops.

## Rate Limiting & Gating

The following safeguards are enforced server-side whenever a new payment is initiated:

### 1. Hard Amount Caps
- **Maximum Amount**: A single payment cannot exceed **100 USDC**.
- **Minimum Amount**: A single payment must be greater than **0 USDC**. (For CCTP bridges, an implicit floor is applied to cover protocol fees, requiring > 0.01 USDC).

### 2. Global Wallet Protections
- **Daily Global Limit**: The entire application is restricted to a maximum of **50 testnet payments per 24 hours**, globally across all users.
- *Impact*: Ensures the absolute worst-case scenario for testnet wallet drainage is capped at exactly 5,000 USDC per day globally.

### 3. IP-Based Abuse Prevention
- **Daily IP Limit**: A single IP address can initiate a maximum of **5 testnet payments per 24 hours**. 
- *Implementation*: IP addresses are extracted via the `X-Forwarded-For` header. The rate limit state is persisted across requests using the durable Turso key-value (`kv`) store.

### 4. Session Boundaries
- **Lifetime Session Limit**: A single browser session (identified by a persistent `X-Session-ID`) can create a maximum of **10 testnet payments** over its lifetime. 

## Architectural Safeguards

- **Private Keys stay hidden**: The `WALLET_PRIVATE_KEY` and `RECIPIENT_PRIVATE_KEY` are read exclusively from secure environment variables (`.env` in local development, Vercel secrets in production). They are never saved to the database, never embedded in the frontend bundle, and never returned in API payloads.
- **Server-Side Signing**: Transactions are always constructed and signed on the server. The client cannot inject arbitrary smart contract calldata.
- **Strict Network Isolation**: The server strictly validates network execution against Arc Testnet (5042002) and Base Sepolia (84532). If RPC points to an unapproved chain, all signing is automatically aborted.
- **Replay Protection**: The database maintains a `journal` of raw signed transactions. Duplicate submissions of a payment step safely replay the original signed bytes rather than signing a new payload, preventing duplicate deductions.
- **Token Authorization (POST)**: All mutating API calls (e.g., initiating a bridge, approving a swap) require a valid `X-Clearline-Token` matching the server's predefined secret, ensuring that state transitions are triggered via authorized sessions rather than arbitrary cURL scripts.
