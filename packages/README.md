# packages/ — Limer's Open SDK suite

This folder is the extraction staging area for the public-good SDKs that Limer's Capital is publishing alongside the flagship app. Each package here is the seam along which a piece of the flagship can be lifted out and dropped into any other Solana retail app.

## Published (alpha)

| Package | What it does |
|---|---|
| [`@limers/curriculum`](./limers-curriculum) | 8 modules · 37+ lessons · 8 quizzes — a retail-friendly crypto/DeFi learning curriculum |
| [`@limers/gamification`](./limers-gamification) | XP, tiers, badges, LP multipliers, leaderboard — a production-tested reward loop |

## Planned (next in the sprint)

| Package | What it will do |
|---|---|
| `@limers/blinks-trading` | React hook so any Solana Blink can execute a paper trade against a shared leaderboard |
| `@limers/stablecoin-onramp` | Pluggable local-stablecoin → Solana bridges (ViFi/TTDC reference adapter) |
| `@limers/exchange-rwa` | Token-2022 + SAS + Squads turnkey issuance kit for emerging-market stock exchanges |
| `@limers/compliance-sas` | React SDK + Anchor transfer-hook around Solana Attestation Service |

## Extraction posture

During the 4–6 week extraction sprint, the flagship's `src/data/` files remain the working copies; package files are thin re-exports. This lets us:

1. Ship working npm alphas without cutting the flagship.
2. Prove the seams hold (package imports resolve, data shapes are stable).
3. Flip to self-contained publication via `git mv` when the SDK APIs settle.

The package.json files are real, the READMEs are real, the exports are real — only the data lives one directory over during this staging phase.

## License

Apache-2.0 across all published packages.
