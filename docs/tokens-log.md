# Token Issuance Log

**Append-only record of every SPL token and NFT collection issued by Limer's Capital.**

Each entry must include: cluster, mint pubkey, decimals, initial supply, mint authority, create tx signature, supply-mint tx signature (if separate), Solscan link, and rationale. Never edit a prior entry — append a new one documenting the change.

---

## 2026-04-17 — mTTDC (Mock TTDC) — devnet

**Purpose:** Test-net stablecoin for AMM liquidity, Jupiter routing, and Kamino / DFlow / Solflare integration testing. Pegged conceptually 1:1 to TTD (Trinidad and Tobago Dollar) but carries no monetary claim.

| Field | Value |
|---|---|
| Cluster | devnet |
| Standard | SPL-Token (Tokenkeg) + Metaplex Token Metadata v1.14+ |
| Mint | `BScyHpzzSC4UoUysx7XUqCpSaKdcgjqvNMjpZcXFTxUM` |
| Metadata PDA | `A1oeHLYq6LR9iVfe3gCCvs3pVAmwNMgRXao68usEpwUm` |
| Decimals | 6 (USDC-compatible — diverges from IRL TTD's 2, chosen for Jupiter/Kamino convention) |
| Initial supply | 1,000,000 mTTDC (on-chain: 1,000,000,000,000 base units) |
| Mint authority | `3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` (founder EOA — will migrate to Squads PDA before mainnet) |
| Freeze authority | founder (same — devnet only, review before mainnet) |
| Metadata URI | https://limerscapital.com/metadata/mttdc.json |
| Create tx | `49XWeoMWijjpag3NH59ZeLWtqiU2XmaaN6XC9KuvQykcfPx3Rz7rmw95qbMNrwbs7Z5JakeEsqepkM185EBtK2Qh` |
| Supply-mint tx | `3v4jNo6ZMt47txi9MARssiuxUk1QwMMtpox3LHRf9dRqr6FGL8rrWLndGFRuvfKns9mmQqKcBPZmFVLSKyuajEK6` |
| Founder ATA | `ENAQWbcsvhpgSeNKyTpVNRduJ3CFAupeXkRnQHRencer` |
| Solscan (mint) | https://solscan.io/token/BScyHpzzSC4UoUysx7XUqCpSaKdcgjqvNMjpZcXFTxUM?cluster=devnet |
| Solscan (ATA) | https://solscan.io/account/ENAQWbcsvhpgSeNKyTpVNRduJ3CFAupeXkRnQHRencer?cluster=devnet |

**Scripts:**
- Create + metadata: `scripts/tokens/mint-mock-ttdc.ts`
- Supply mint: `scripts/tokens/mint-ttdc-supply.ts`

**Registered in frontend:** `src/solana/tokens.js` → `TOKENS_BY_CLUSTER.devnet.mTTDC`

**Known issues at creation:**
- First run of `mint-mock-ttdc.ts` errored at the `mintV1` supply step with mpl-token-metadata error `0x39` (`IncorrectOwner`) — the metadata program's Mint IX does not auto-create the ATA for plain Fungible tokens. Workaround: `mint-ttdc-supply.ts` uses SPL-Token's `mintTo` with `createAssociatedTokenAccountIdempotentInstruction`. Future token scripts should use the direct SPL path for supply minting (pattern established in `mint-ttdc-supply.ts`).

---

## 2026-04-17 — mWCO, mNEL, mRFHL, mGKC, mNGL (5 tokenized TTSE stocks) — devnet

**Purpose:** Tokenized representations of the top-5 TTSE stocks by volume (24 Mar 2026 snapshot). Pair with mTTDC in the Phase B AMM. Demonstrate the Solana-native "buy local equity with local stablecoin" narrative for Colosseum + Kamino bounty.

Minted as a single batch via `scripts/tokens/mint-mock-stocks.ts`. Every entry below uses the same parameters: SPL-Token + Metaplex metadata, 6 decimals, 100,000 initial supply (100,000,000,000 base units) to founder ATA, freeze authority revoked at creation, mint authority held by founder EOA pending A1.5 resumption.

| Symbol | TTSE | Name | Mint | ATA (founder) | Sector | Ref TTD |
|---|---|---|---|---|---|---:|
| mWCO | WCO | West Indian Tobacco Company | `EDdvrQtvXAwZSF1U9AY6P3oifUucSCnca7zrMQnEoc35` | `8VZzUxMZhCCwSC7uBH9jnsJkoHYDsDRGk7CBynDkQk7K` | Conglomerate | 2.41 |
| mNEL | NEL | National Enterprises Limited | `E8vBDjp4MYq9ujvzsFSvyxd748nSJUEE8rmjP3JGn8mK` | `CG623JtqhexXmL3xg1wq8j8zEB9aZpUeF8nY4c5Je8ia` | Energy | 3.70 |
| mRFHL | RFHL | Republic Financial Holdings Limited | `J6n8pY7Gjjg781gS7hW1d1HbVuJRjhrCzLd7b8Fn3LyF` | `2Wkum45nzTQZEwHmfx8RLC2bs629BSqP4qSZY9cMEcNm` | Banking | 106.11 |
| mGKC | GKC | GraceKennedy Limited | `4MkSSW4AMrstCpL7BFbNk1gbG8WJNrFne2YXncUF4RkM` | `G69zwRWA8mG6sQcByu89dGGKFfCfBsSvU7uispJ14gvx` | Conglomerate | 3.26 |
| mNGL | NGL | Trinidad & Tobago NGL Limited | `D9CeouuQ2B4yRYa8LqXxubHutg23UCZ7aPb5nnQivLS1` | `3tHH2uHP5e9SrdKGYkHD7zHY5iGvXRbZT62vNeaZidJV` | Energy | 9.10 |

**Tx signatures** (per stock, in order: createFungible → mintTo → revoke freeze):

| Symbol | Create mint + metadata | Supply mint | Revoke freeze authority |
|---|---|---|---|
| mWCO | `Fz3JvfShxl8fPY0MHQe8N/IifxQmjlcUaYKArm+p4D2A3B0yWub4WJL1Nj2tATt9NySEKl9YwMhpsVY+Rw4sBA==` (base64) | `TiRxiLA4XCizjnpMzPCKH9fcTtZMP9ZJnbLRUTWQ9Yb61m4EMbPuGRsb32dLKyMfiKsTfrw3v5WZwMyppGMNHaZ` | `5gngS1DS5eYwMzsXm7xn7Kt88pDCreEq6EgEQtAQMaMaoeBUH5Mpyuc7RKtiu61hvzcbvipJaUFDsCBWQkdWLBK5` |
| mNEL | `t6i6oA4wNB3zqr44Q0vjSoCTYb7Hm2Bexxm+lam8CGmPLS27Hx0Fo4TrJ0/nQ0DWAjjNO+qVDhYOhKxOC6DZBQ==` (base64) | `3iGkv8H6bq7HVi7Y9QuB4GNGbTZoLRC92rzuCg3Zs5Tfa4MMxqAPwhJ6b8Y7M4DWm5xgJNzeACV1fcYfqpbnqYQg` | `53y5vHQNVp7cdUFzJAW2ttBU4hxx5LDdRvtta4TxBE9Kvyse3BRB5FH7k62TVEyDG1kTKSpRarrYp9KABtMD5wkM` |
| mRFHL | `7J27tB0xr4L/uH9aVVrTyqkD5YnO9bnpBKpHIQD2hyPvRXjigPwY7CuQHW6ZymH15+iV6woDNN6C0MLpH69jCg==` (base64) | `4d99QdaaQYjhejMpRL1A8gDqAhE5Ec2q181Hy2paCqhiZbww4tHmymm8W1TxRz1m1xPdK7XN2zNzcRPptm3XWU1Q` | `2oBzFvcHjjsUgDX7YH2FamDXq5n17yrXpxcZum14kZ1L84gpY1jLUq3vRsQHqLuLd8oVUaTifDpgCyNn5WxfEdE4` |
| mGKC | `AxSlx2gWRQ5iyGKaBT5KnW+BojGefyvXk4qZKHNjomKKBOH8aHT0XibBS0ObjXVuzH02RPWX5bSevI39EEvvBg==` (base64) | `2LXePyUkyyPiqZfJu3PiCANqzcdorTV7nusQUtcr25W2yjbEnsjLPEyy1p8tGv9NqKJRGMS8VcquTrarX8juoh9d` | `3Pu3BWfXfpkaPYtLjB14NFYWa1WuyiKgpEHjaRv4Nfc4PNP25CfAKBYHRansf5wkaBtRavWtuqiX4yoATCfxxrf4` |
| mNGL | `OtR9hWdgk6r0WH8okX2TqhFeyc7tiLq4ZzVg+CM0P8CE008LoRD8J7YfM+4lh3m74PrUpZk7n9SQ9bbqgndWBQ==` (base64) | `3teb91vvwVCMbrR14yYex1ocYDAyaXdvL3Z2Q9nn1cGACpDxGXFNf4hHH3yk9NAjrqJGp4j9KasTu9aywG2hX3hT` | `3eASC2CXgQQuWVYymYQwYJ85nkMQ3p4pW75zgKMnJ3PjfTgLp4cJ8nzZuLRhMeA1eGwLkpTqJeNboUJjNCZFGT9T` |

**On-chain parameters** (same for all 5):

| Field | Value |
|---|---|
| Standard | SPL-Token (Tokenkeg) + Metaplex Token Metadata v1.x |
| Decimals | 6 |
| Initial supply | 100,000 (raw: 100,000,000,000) |
| Mint authority | `3wvJe17zVfFm48DHVYGfShNg2p9r8C2ijgyZiXQcPkgd` — founder EOA (migrates to devnet multisig vault at A1.5 resumption) |
| Freeze authority | **None** (Kamino/DFlow composability) |
| Metadata URI | `https://limerscapital.com/metadata/m<ticker>.json` — served via Cloudflare Pages from `public/metadata/` |

**Scripts:**
- Batch mint: `scripts/tokens/mint-mock-stocks.ts` (idempotent — skips already-minted tickers on re-run)

**Registered in frontend:** `src/solana/tokens.js` — spread from `src/solana/generated/mock-stocks.json` into `TOKENS_BY_CLUSTER.devnet`.

**Metadata JSON hosted at:** `public/metadata/{mwco,mnel,mrfhl,mgkc,mngl}.json` — will resolve publicly after the next Cloudflare Pages deploy.

**Known issues at creation:**
- First attempt errored with `NameTooLong` (mpl-token-metadata 0xb) because on-chain `name` exceeded the 32-byte cap. Fixed by shortening on-chain names to ≤ 32 chars while keeping descriptive names in the metadata JSON. Guard added to the script to assert length caps before any tx is sent. Documented in `docs/devnet-dev-notes.md`.

**What this unblocks:**
- Phase B1: AMM design doc can reference concrete mint pubkeys for the 6 pools (5 × mStock/mTTDC + 1 × mTTDC/SOL).
- User demo flow: "Connect Solflare → Claim mTTDC → Swap for mNEL → see mNEL in wallet."
- Kamino bounty: 5 equity tokens with Metaplex metadata and no freeze authority — eligible for permissionless market listing once AMM liquidity exists.

---

## 2026-04-17 — 6 LP tokens (Phase B4 pool seeding) — devnet

**Purpose:** LP tokens emitted at AMM pool initialization. One LP mint per pool, owned by the pool-authority PDA, freeze authority = PDA (effectively unrevokable by design — see `anchor/programs/limer_amm/DESIGN.md §6`), 9 decimals (LP convention).

All 6 were auto-minted by the Anchor `initialize_pool` instruction. LP token balances are held in the founder's ATAs as the sole LP provider at T=0.

| Pool pair | Pool PDA | LP mint | Founder LP balance (raw, 9-decimal) |
|---|---|---|---|
| mTTDC/mWCO | `8UgFsCDjh12RncutLi2ff4egkj1yLiymJgM3Xs2qQPYT` | `FonVcbh3ZS3pQ1XVucQ6fmeSs2fKyNV4xnF6GuDuDDAr` | sqrt(48,200e6 × 20,000e6) − 1000 |
| mTTDC/mNEL | `2ao9zgxmvqwk9VAnq2iKAjScqzb9dixNfgBm6zF4YLHU` | `EgbpaXzQE2YdEEvwND6x4ZNa6VYHPYFgdLbYPFNuit7G` | sqrt(74,000e6 × 20,000e6) − 1000 |
| mTTDC/mRFHL | `BuVsBkaiJfBraN5oWvreL84i8L4mi57TFSxqRFkoNWKT` | `H1SDmfKNZicLB39hZk48vhxNVs9QaSSEcRh4KmKPTq2R` | sqrt(2,122,200e6 × 20,000e6) − 1000 |
| mGKC/mTTDC | `gK5buNbjxTC8PzxixLWWqQKrapoVj1c3T1nJnfmmdU9` | `ECmcQxPMH99uq75Ke1VP5WDQCZt1Br8UBaLGMhDgDGTv` | sqrt(20,000e6 × 65,200e6) − 1000 |
| mTTDC/mNGL | `5LJkM68A4ZqLHRoPzDcVvJrC4o8GWibMpCTB8mpC9wns` | `7868PV8efjRL1Qub2vU87jws2nyHrHmWunR3HY7u3gnS` | sqrt(182,000e6 × 20,000e6) − 1000 |
| wSOL/mTTDC | `9GWbFaC3a1wR1ff9x1a91rSqf1e82F5ykLfB6GMFcmcM` | `7HWNUjkadVojgxtDt6Qfj2yYe6nfxP95GW1B3NwWxxFF` | sqrt(0.5e9 × 611e6) − 1000 |

**Deploy + init tx signatures and full record:** see `docs/program-upgrade-log.md` (2026-04-17 entry for `limer_amm`).

**LP metadata (pre-staged, blocked on program upgrade):** LP mints currently have no Metaplex Token Metadata attached because the `mint_authority` is a `pool_authority` PDA that only the program itself can sign for. Adding metadata requires a new admin-gated `create_lp_metadata` instruction on `limer_amm`.

Status (April 17, 2026):
- Metadata JSONs written: `public/metadata/lp-{wco,nel,rfhl,gkc,ngl,sol}.json` — all 6 ready.
- Instruction design: `anchor/programs/limer_amm/B3_LP_METADATA_DESIGN.md` — full Rust skeleton, CPI plan, upgrade procedure.
- TS attach script: `scripts/amm/attach-lp-metadata.ts` — pre-staged, aborts early if the upgraded IDL isn't present. Idempotent (skips pools that already have metadata PDAs).

Blocker: `anchor upgrade` of `limer_amm` to add the new instruction. Deferred to post-Colosseum because a mid-sprint program upgrade carries regression risk in the working swap/deposit paths. Full upgrade-and-ship runbook in the design doc above.

Effect on users today: LP balances show as "Unknown Token" in Solflare. Doesn't affect swaps, deposits, withdrawals — LP math is unchanged. Does affect Kamino permissionless listing eligibility (they require Metaplex metadata on collateral tokens), but Kamino mainnet integration is a post-Colosseum goal anyway.

**Liquidity-scheme rationale (reference-price matching):** AMM-implied price at T=0 matches the real TTSE quote for each stock (24 Mar 2026 snapshot). 20K shares per pool keeps us at 20% of each mStock supply, leaving 80% headroom for future pool expansion, Mock-NEL-like secondary pools, and demo airdrops.

---

## Template for new entries

```
## YYYY-MM-DD — <SYMBOL> (<Full Name>) — <cluster>

**Purpose:** <what problem this token solves and why it needs to be on-chain>

| Field | Value |
|---|---|
| Cluster | devnet | mainnet-beta |
| Standard | SPL-Token | Token-2022 | Metaplex Core Asset |
| Mint | <pubkey> |
| Decimals | <n> |
| Initial supply | <human>  (on-chain: <n>) |
| Mint authority | <pubkey> (role) |
| Freeze authority | <pubkey> |
| Metadata URI | <url> |
| Create tx | <sig> |
| Supply-mint tx | <sig> |
| Solscan | <url> |

**Scripts:** <paths>
**Registered in frontend:** <file path + identifier>
**Known issues at creation:** <if any>
```
