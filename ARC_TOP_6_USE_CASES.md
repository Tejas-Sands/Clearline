# Six product opportunities on Arc

Research date: September 27, 2026. Selected project: **Clearline — StableFX settlement operations**.

## Decision

Build settlement operations software for payment providers already adopting StableFX. Start with one currency pair, reconciliation, and exceptions. The defensibility must come from useful integrations and reliable operations, not a claim that another chain cannot perform stablecoin payments.

Only five candidates passed the original current-availability screen. To provide six useful options without misrepresenting the research, confidential payroll is included as a **future watchlist item**, not a sixth validated opportunity.

| Rank | Opportunity | Buyer | Weighted score / 5 | Decision |
| --- | --- | --- | --- | --- |
| 1 | StableFX settlement operations | Payment-provider operations teams | 3.80 | Build Clearline |
| 2 | Just-in-time multicurrency treasury funding | Corporate treasury teams | 3.55 | Validate with an existing treasury |
| 3 | Market-maker inventory and obligation controls | Existing StableFX liquidity providers | 3.40 | Requires a maker design partner |
| 4 | Multicurrency merchant-acquirer settlement | Acquirers with stablecoin receivables | 2.75 | Partner-led opportunity |
| 5 | Multicurrency tokenized-fund subscriptions | Fund administrators and distributors | 2.70 | Issuer access is the bottleneck |
| 6 | Confidential global payroll | Payroll providers and employers | Not scored | Wait for usable native privacy |

Scores are analyst judgments, not observed product-market fit. Weights: Arc dependence 30%, demand 20%, regulatory feasibility 15%, competitive room 15%, small-team feasibility 10%, funding alignment 10%. Higher is better in every column.

| Opportunity | Arc | Demand | Regulation | Competition | Team | Funding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Settlement operations | 4 | 4 | 4 | 2 | 4 | 5 |
| Treasury funding | 4 | 4 | 3 | 2 | 3 | 5 |
| Maker controls | 4 | 3 | 4 | 2 | 3 | 4 |
| Acquirer settlement | 3 | 4 | 2 | 1 | 2 | 4 |
| Fund subscriptions | 3 | 3 | 2 | 2 | 2 | 4 |

## 1. Clearline: StableFX settlement operations

**Problem:** A successful token transfer is not a reconciled payment. Operators must match obligations, quotes, approvals, funding, final settlement, and ledger records; unclear responses and duplicate submissions can be costly.

**Product:** A desk linking invoice obligations to FX trades, tracking settlement exceptions, and producing a reconciled export and activity history.

**Why Arc:** The workflow is specific to StableFX trade states and Arc settlement records. USDC gas simplifies fee accounting. Integrations and tested recovery procedures are the potential moat; the dashboard itself is copyable.

**Demand and competition:** B2B payments are an established stablecoin use case. BVNK and Bitwave already connect payments to finance operations, while Circle Managed Payments competes with broad payment orchestration. A narrow, repeatable operational gap must be proven.

**Feasibility:** A software-only local prototype is small-team feasible. A real deployment needs institutional access, secure signing, persistent server-side idempotency, provider-status verification, and a review of the actual regulatory perimeter.

**First prototype:** USDC/EURC, obligation entry/CSV import, expiring quotes, approval, simulated funding and settlement, exception recovery, reconciliation, CSV export. Clearly distinguish simulated data from actual Arc transactions.

**Business test:** Two design partners with the same problem and one paid pilot. Illustrative estimate only: 30 customers at $30,000/year is $900,000 ARR; this does not establish venture scale.

**Red team:** Circle or an incumbent may absorb the workflow. Custom integrations could become consulting work. There may be too few reachable customers. Permissioned-network or issuer restrictions cannot be repaired by this application.

## 2. Just-in-time multicurrency treasury funding

**Problem:** Working capital sits idle across currencies while treasury teams manually replenish accounts.

**Product:** Forecast a company's own obligations and request approved StableFX conversions into supported stablecoin balances.

**Why Arc:** Direct use of StableFX liquidity and Arc finality; forecasting itself is chain-independent.

**Demand:** BVNK describes Corpay using stablecoins in treasury operations. Savings must be measured after spreads, custody, redemption timing, and fallback liquidity.

**Competition and risk:** Circle and treasury vendors can supply scheduling. A small team needs customer data and realistic redemption constraints. Discretionary trading or third-party payouts broaden regulatory exposure. Keep alternate rails and reserves for network interruptions.

**First prototype:** Import cash obligations, forecast a one-pair shortfall, propose a conversion, require approval, and compare capital usage against a fixed-buffer policy.

## 3. Market-maker inventory and obligation controls

**Problem:** A maker can overcommit inventory across quotes and outstanding settlement obligations.

**Product:** Inventory reservations, exposure limits, and obligation reconciliation for an existing maker.

**Why Arc:** Controls reflect StableFX commitments and Arc settlement events; risk mathematics is not exclusive to the chain.

**Demand and competition:** The need is credible but the buyer population is unverified and narrow. Circle already documents Talos integration, and makers often build their own controls.

**Feasibility and risk:** A simulator is approachable; production risk software needs trading expertise and realistic data. Sell tooling rather than becoming a counterparty. Public positions, permissioned-network outages, and issuer restrictions complicate hedging.

**First prototype:** Import obligations, simulate competing quotes against finite balances, prevent overcommitment, and release reservations after terminal outcomes.

## 4. Multicurrency merchant-acquirer settlement

**Problem:** Acquirers need to convert aggregated receivables and reconcile merchant payouts across currencies.

**Product:** Settlement and reporting software for an acquirer that already has customers and regulatory infrastructure.

**Why Arc:** StableFX conversion matters for real multicurrency stablecoin flows. Ordinary QR checkout is not Arc-dependent.

**Demand and competition:** Stripe's Shopify rollout demonstrates interest but gives incumbents a substantial distribution advantage. Merchant refunds and disputes survive final onchain settlement.

**Feasibility and risk:** Custody, safeguarding, FX, and payout responsibilities make a standalone launch difficult. A partner's license does not automatically cover every startup activity.

**First prototype:** Aggregate synthetic merchant receivables, convert one pair, allocate net settlement to merchants, and export a reconciliation statement.

## 5. Multicurrency tokenized-fund subscriptions

**Problem:** Eligible investors holding local stablecoins must coordinate conversion, subscription, and ownership records.

**Product:** A subscription workflow for an existing fund administrator or distributor.

**Why Arc:** Fund activity and StableFX can share a settlement venue. An FX trade plus a subscription must not be described as one atomic transaction without proving that property.

**Demand and competition:** Tokenized funds exist, but demand for this particular workflow is unverified. Issuers and distributors already own the customer relationship.

**Feasibility and risk:** Investor eligibility, securities rules, allowlisting, and transfer-agent records remain necessary. USYC eligibility is restricted; redemption above instant capacity can take T+0 or T+1. Validator brands do not guarantee underlying asset redemption.

**First prototype:** An issuer-approved sandbox with simulated eligibility, FX conversion, fund subscription, and a reconciliation record for each stage.

## 6. Confidential global payroll — watchlist

**Problem:** Salaries, employee links, and treasury patterns should not be published on a public ledger.

**Product:** Bulk stablecoin payroll with selective auditor access, if Arc's native privacy becomes available and fit for purpose.

**Why Arc:** Confidential execution and controlled visibility could be meaningful advantages. USDC gas alone is insufficient.

**Why not now:** Arc's launch materials describe privacy as upcoming. Do not promise confidentiality or substitute ordinary public transfers. Wage, tax, employment, custody, and payout rules still apply.

**First prototype after the dependency is available:** Synthetic employee payments with demonstrable recipient confidentiality and scoped auditor access. Until then, only an offchain workflow mockup is appropriate.

## Evidence and constraints

- Mainnet launched September 16, 2026; eleven days of availability is not sustained PMF. Privacy remains upcoming and founding validators are rolling out in phases. [Arc launch and roadmap](https://www.arc.io/blog/arc-economic-os-internet).
- Native USDC uses 18 decimals; its ERC-20 interface uses 6 and exposes the same underlying balance. [Arc wallet guide](https://www.arc.io/blog/supporting-arc-in-wallets-one-balance-usdc-fees-and-complete-history).
- StableFX requires institutional screening. Local-currency fiat access and custody have additional dependencies; sub-second chain finality does not imply instant end-to-end payouts. [StableFX](https://www.circle.com/stablefx).
- McKinsey/Artemis estimate $390B annualized payments, including $226B B2B, based on December 2025 activity. These are market-wide payment flows, not Arc revenue or software TAM. [Research](https://www.mckinsey.com/industries/financial-services/our-insights/stablecoins-in-payments-what-the-raw-transaction-numbers-miss).
- [BVNK–Bitwave integration](https://www.bvnk.com/blog/bvnk-partners-with-bitwave), [BVNK treasury case study](https://www.bvnk.com/stablecoin-wallets), [Talos maker integration](https://developers.circle.com/stablefx/concepts/maker-talos-integration).
- [Stripe–Shopify stablecoin payments](https://stripe.com/newsroom/news/shopify-stripe-stablecoin-payments), [USYC eligibility and liquidity](https://www.circle.com/usyc).
- Circle looks for shipping ability, meaningful integrations, and traction. Funding fit is not a grant commitment. [Developer Grants](https://www.circle.com/grant), [Builders Fund](https://www.circle.com/blog/introducing-the-arc-builders-fund).
- Software-only delivery can reduce regulatory exposure; actual conduct and jurisdiction control the outcome. [FinCEN software ruling](https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/application-fincens-regulations-virtual), [MiCA Article 59](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-59-authorisation).

## Build decision

Clearline is implemented in this folder. Its current scope is a local, simulated product prototype. It uses no Circle credentials, does not sign transactions, and moves no real money. See [README.md](README.md) for setup, walkthrough, tests, and the real-integration boundary.
