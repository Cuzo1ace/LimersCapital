# Anchor Program Deploy / Upgrade Log

**Append-only record of every on-chain program operation (initial deploy, upgrade, authority migration) for every Anchor program Limer's Capital ships.** Never edit a prior entry — add a new row below.

Referenced from `docs/SECURITY_MODEL.md §3` (Squads migration runbook) and `scripts/transfer-authority-to-squads.sh`.

---

## 2026-04-17 — `limer_amm` initial deploy + AMM bootstrap

**Program:** `limer_amm`
**Network:** devnet
**Program ID:** `FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo`
**Upgrade authority:** `3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` (founder EOA — same C-01 deferral as `limer` per `remediation-log.md`)
**Deploy tx:** `5oJm9g23YNDXeskUViWoUwfw5mNvhBuFtnUyaJ7yxdoeUQGQLXSj3fVMfATbYsNrBXa2bfuZZfnrU1ctRFZ3csNY`
**Binary size:** 409,536 bytes (~400 KB)
**Rent locked:** 2.85 SOL
**Source commit:** (to be filled in at commit time)
**Design doc:** `anchor/programs/limer_amm/DESIGN.md`

### Post-deploy initialization (same day)

| Step | Artifact | Address | Tx |
|---|---|---|---|
| AmmConfig singleton | `init_config(30 bps)` | `2zz2e5cejTKX7WBuE131m2J1v6VKNDwK3YxktogKNwtR` | `2e3rVYZvFjRPAD7JZJDn75icRXXE5W8rud2DARa2ybNmb8GsxAyUbYKyFnJQRJTTYAmw7uHmoZeFKe5MLmceoxFz` |
| Pool mTTDC/mWCO | `initialize_pool(30)` | `8UgFsCDjh12RncutLi2ff4egkj1yLiymJgM3Xs2qQPYT` | `5Gor189RpWjXzZVq59VgaTQTm6HWuRrccvmUfHr3L9BBgRyBxoCXPEXaSMqUs4rv4t57cxbCD9y7qtkbP6Gk9Suj` |
| Pool mTTDC/mNEL | `initialize_pool(30)` | `2ao9zgxmvqwk9VAnq2iKAjScqzb9dixNfgBm6zF4YLHU` | `3LohkzXvuwnUdWiKuL19eN4yK7kLXucwucBwQAXStR7FmFfMWegBt3AezYtAXQBBFdS5hnq1CbXbn5VfdriBZf1i` |
| Pool mTTDC/mRFHL | `initialize_pool(30)` | `BuVsBkaiJfBraN5oWvreL84i8L4mi57TFSxqRFkoNWKT` | `2wqP6H9GLWy24w4dCoGksS5G9ST5RroHxTQJH3Z6nGR8kEC7t96cvqf6CdjTPUiXFJT5KQKkJrDvMqrhZ9Qa7fUw` |
| Pool mGKC/mTTDC | `initialize_pool(30)` | `gK5buNbjxTC8PzxixLWWqQKrapoVj1c3T1nJnfmmdU9` | `zgq2dBJ7UncNKfi58F6cL2RVQRXjWrXEC8ktazmae15ipDdxq74hoXDwH2Sn7D7u48roGtgW8adYd9RySB2vR4U` |
| Pool mTTDC/mNGL | `initialize_pool(30)` | `5LJkM68A4ZqLHRoPzDcVvJrC4o8GWibMpCTB8mpC9wns` | `tsn2BtXkX2U6pHbenzJCh4C5wqXNzKac986CCFEQLV75AFp1L9huJjuVRJE84GFojk1PNgCv3X6vn42WkNKFeAK` |
| Pool wSOL/mTTDC | `initialize_pool(30)` | `9GWbFaC3a1wR1ff9x1a91rSqf1e82F5ykLfB6GMFcmcM` | `5xosXnXPFnhH7c8sn53ps18ThPksG7cUyWdmKJuVPrbqYvqE8xHJGZf7WDcoFysDuNPB3FqTBwkt6K2va8wQqd9y` |

### Initial liquidity seeds (reference-price matched to 24-Mar-2026 TTSE snapshot)

| Pool | Token A seed | Token B seed | Implied A/B price | Seed tx |
|---|---|---|---|---|
| mTTDC/mWCO | 48,200 mTTDC | 20,000 mWCO | 2.41 mTTDC/mWCO | `3DPqmnzXA4ZanWRjCa3VnctYzy5QdJZGQHBSSFGAHrFNxbChujd5RpYN838LtdUoSuwnEXHPLtbdZRBss6zdBFiN` |
| mTTDC/mNEL | 74,000 mTTDC | 20,000 mNEL | 3.70 mTTDC/mNEL | `5L1mZgDpByHfB4Fyuw6Z6YW9EkNYGiDvjasTNGqS6gEBjSYnkEU46JuVbk4enb3KZ6cfBfKp9m31CJbTBCZBQTwm` |
| mTTDC/mRFHL | 2,122,200 mTTDC | 20,000 mRFHL | 106.11 mTTDC/mRFHL | `3icPn8zNQi16JSsJ8Uuse4kxKt1txPLLNgCgg75M5CWYZ8UgLuEETFF14UsZaTxCFPcg3mWz9nVNnaTmR3D6tVkN` |
| mGKC/mTTDC | 20,000 mGKC | 65,200 mTTDC | 3.26 mTTDC/mGKC (inverted A/B) | `4N7CGxk2zfnVBvCwMP1uvN3AbW5WL3CgX9btZCnDhWdg9Psdu3HhrnoMXeCPqo2qJs71oNR7mpzs89mhv2xusna8` |
| mTTDC/mNGL | 182,000 mTTDC | 20,000 mNGL | 9.10 mTTDC/mNGL | `m7dDCNR3sRXRcaiBGRPEfRHb3Kuk6rEwW2dqs6mASgAEJMDVzGRWuyUjPhznAm4fdEPyTN4MdJ2H6Y8gZ2Mspw2` |
| wSOL/mTTDC | 0.5 wSOL | 611 mTTDC | 1 wSOL ≈ 1222 mTTDC (bridge) | `4QG1ZLuE2Q6jr6XC85jq5c2fFcwzN4tMrXAvMEWtn862p4dD4CakrL1ScWPGPtaCDiD6WiUdNPxL6vZ4ZikuGZ92` |

### Budget consumed

- 2.85 SOL — program rent (irreversible until redeploy replaces it)
- ~0.55 SOL — pool init rent (~6 × 0.09 SOL) + seed transaction fees + wSOL wrap
- 2,492,211 mTTDC — seeded across 6 pools (out of 4,950,000 available after faucet seed)
- 20,000 of each mStock — 20% of the 100K supply minted in Phase A3

### Scripts used

- `scripts/amm/init-config.ts` — creates AmmConfig PDA (idempotent)
- `scripts/amm/init-pools.ts` — creates all 6 Pool + vault + LP-mint PDAs (idempotent)
- `scripts/amm/seed-pools.ts` — deposits first-time liquidity per plan (idempotent)

### Frontend registration

Pool addresses + LP mints captured at `src/solana/generated/amm-pools.json`. Frontend should import this for future AMM quote + swap UI.

### Authority caveats (not yet remediated)

- Program upgrade authority = founder EOA → will migrate to devnet Squads vault when that multisig is mirrored from mainnet (A1.5 resumption).
- AmmConfig admin = founder EOA → same migration path; `init-config` will be re-run with new admin after multisig deploys. A `migrate_admin` instruction is Phase 2 (currently requires program upgrade to change).

---
