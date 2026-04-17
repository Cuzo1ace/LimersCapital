# Devnet Development Notes

Collected references + gotchas for working against Solana devnet while building Limer's Capital. Appended to as we discover new tooling or hit new friction.

## Canonical references

- **Metaplex — Working with Devnet and Testnet:** https://www.metaplex.com/docs/ko/solana/working-with-devnet-and-testnet — covers airdrop flow, rate limits, and points at Amman (local validator tool).
- **Solana CLI Install:** https://docs.solana.com/cli/install-solana-cli-tools
- **Circle USDC devnet faucet:** https://faucet.circle.com (if we ever need real devnet USDC; rate-limited)
- **Helius devnet RPC:** `https://devnet.helius-rpc.com/?api-key=<KEY>` — faster than the public endpoint; useful if `api.devnet.solana.com` gets flaky during demos
- **Solscan devnet explorer:** https://solscan.io/?cluster=devnet

## Devnet SOL — airdrop rules

- **Public faucet:** `solana airdrop <amount>` — max **2 SOL per request** per the Metaplex docs (historically also 1 SOL; use 2 and retry if rejected).
- **Rate limit workarounds:**
  - Wait and retry (rate limits reset in minutes)
  - Use a web faucet (e.g., https://faucet.solana.com)
  - Switch to localnet (`solana-test-validator`) for unlimited SOL during dev-loop work
- **Alternative tool:** `Amman` (Metaplex's local validator wrapper) — clones mainnet programs, includes an explorer and mock storage. Useful for Phase B Anchor iteration if public devnet gets unreliable before Colosseum.

## Token Metadata on devnet

- **Metaplex Token Metadata program ID** is the same on devnet and mainnet: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`.
- **Metaplex Core program ID** same across networks: `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d`.
- **Metadata URI resolution:** wallets (Solflare, Phantom) and explorers fetch metadata from any HTTPS URL listed in the `uri` field. No Arweave/IPFS requirement. Cloudflare Pages hosting works.
- **Timing:** after a `createFungible` tx, Solscan typically shows name/symbol within 10–30s. Solflare can take longer (it caches aggressively). If a wallet still shows "Unknown Token" after a minute, force-refresh the tokens list.

## Known bugs / workarounds encountered

### `mintV1` from `mpl-token-metadata` errors `IncorrectOwner` (0x39) on Fungibles

**Seen:** Phase A1 mTTDC mint (April 17, 2026). First attempt errored at supply-mint step despite mint + metadata creation succeeding.

**Cause:** `mintV1` expects the recipient's associated token account (ATA) to exist. For plain Fungible mints, the metadata program does not auto-create ATAs — it tries to mint into a non-existent account, which fails the owner check.

**Workaround:** Use SPL-Token's `createMintToInstruction` with `createAssociatedTokenAccountIdempotentInstruction` as a preceding IX. Pattern proven in `scripts/tokens/mint-ttdc-supply.ts` and reused in `scripts/tokens/mint-mock-stocks.ts`. Do **not** use `mintV1` for supply minting on plain Fungibles.

### `createFungible` errors `NameTooLong` (0xb) when name exceeds 32 chars

**Seen:** Phase A3 mStock mint (April 17, 2026). First batch errored with "Name too long" before any mint landed.

**Cause:** Metaplex Token Metadata enforces hard caps on the on-chain struct:
- `name`: ≤ **32 bytes**
- `symbol`: ≤ **10 bytes**
- `uri`: ≤ **200 bytes**

These apply only to the on-chain `DataV2` struct. The metadata JSON at the URI has no such caps — full descriptive names belong there.

**Workaround:** Keep on-chain `name` under 32 chars (e.g. "Mock NEL / Natl Enterprises" = 27 chars). Put the full descriptive name in the metadata JSON's `name` field. Explorers and wallets read both; most prefer the on-chain name for ticker displays and the URI name for full views.

**Prevention:** `mint-mock-stocks.ts` asserts length caps at startup for every entry in the `STOCKS` array. Copy that pattern for any future token-batch script.

## Running scripts against devnet

All project scripts default to `https://api.devnet.solana.com` and error if pointed elsewhere. To change the RPC (e.g., to Helius), edit the `RPC_URL` constant at the top of the script. None of the current scripts support env var override yet — add that in Phase B if needed.

## Tokens currently deployed (devnet)

See `docs/tokens-log.md` for the append-only record. Quick index:

- mTTDC: `BScyHpzzSC4UoUysx7XUqCpSaKdcgjqvNMjpZcXFTxUM` (stablecoin, 5M supply)
- mWCO, mNEL, mRFHL, mGKC, mNGL: see log after Phase A3 completes

## Programs currently deployed (devnet)

- `limer` (XP + badges + trades): `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk` — single-signer upgrade authority (audit C-01, deferred per `remediation-log.md`)
- `limer_amm` (Phase B2): not yet deployed
