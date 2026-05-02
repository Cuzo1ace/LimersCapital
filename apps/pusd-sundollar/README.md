# Send Juice — UAE ↔ Caribbean Stablecoin Corridor

A focused single-page Solana app for the Colosseum **Frontier** hackathon (Apr–May 2026), targeting a stack of Superteam Earn side tracks. The on-disk folder is still `apps/pusd-sundollar/` so the running dev server, `node_modules`, and `.claude/launch.json` keep working — the product/wordmark is **Send Juice**, the rails inside it are **Juice rails**.



- **Palm USD** — PUSD as the unit of account
- **Metaplex Core** — savings receipts as Core NFTs
- **Privy** — embedded-wallet onboarding for non-crypto-native diaspora users
- **Arcium** — confidential recipient handles + hidden savings amounts
- **MoonPay** — AED → PUSD on-ramp at the sender edge

The product narrative — programmable cross-border savings between the UAE and the Caribbean — does not depend on the Nov-2025 T&T ↔ UAE digital-government MOU; that bilateral channel is **atmospheric context only**. The wedge is a real diaspora corridor.

## Architecture notes

- **Vite + React 18, Tailwind v4.** Mirrors the Limer parent app for visual coherence.
- **Stablecoin-agnostic.** [`src/stablecoins.js`](src/stablecoins.js) is the single source of truth for rails — adding **Western Union USDPT** (or any future Solana-native stablecoin) is one config row.
- **Solana wiring forked from Limer.** [`src/solana/config.js`](src/solana/config.js), [`src/solana/wallet-adapter.js`](src/solana/wallet-adapter.js), [`src/solana/accounts.js`](src/solana/accounts.js) are intentionally close copies of `caribcryptomap/src/solana/*` so improvements can flow either direction.
- **Web3.js for transfers, Kit for reads.** `accounts.js` uses `@solana/kit` for balance reads (modern, typed) and `@solana/web3.js` + `@solana/spl-token` for the SPL transfer builder (most-documented copy-paste path).

## Run locally

```bash
cd apps/pusd-sundollar
npm install
npm run dev   # → http://localhost:3100
```

## Status (Week 1 scaffold)

- [x] Vite + React + Tailwind v4 shell
- [x] Stablecoin registry abstraction (PUSD / USDPT placeholder / USDC fallback)
- [x] Solana wiring (RPC config, wallet adapter, balance reads, transfer builder)
- [x] Corridor calculator (UAE → Caribbean, parameterised on the rail)
- [ ] Wallet connect via `@solana/react`
- [ ] PUSD mint addresses (pending sponsor confirmation)
- [ ] Send-flow UI wired to `buildStablecoinTransferTx`
- [ ] Savings PDA + Metaplex Core receipt
- [ ] Privy embedded-wallet onboarding
- [ ] Arcium confidential recipient handle
- [ ] MoonPay AED on-ramp embed
