# Limer's Capital — Treasury & Key Management

**Last updated:** April 7, 2026

---

## 1. Multi-Sig Configuration

All treasury token wallets are managed by a **2-of-3 Squads Protocol multi-sig**.

| Role | Signer | Responsibility |
|------|--------|---------------|
| Signer 1 | Founder (Cuzo1Ace) | Day-to-day operations, deployment |
| Signer 2 | Advisor — Wam Partnership Contact | Strategic alignment, fiat bridge oversight |
| Signer 3 | Advisor — Legal Counsel | Regulatory compliance, fiduciary oversight |

**Squads Vault Address:** `<SQUADS_VAULT_ADDRESS>` *(to be populated after vault creation)*

**Squads Dashboard:** `https://v4.squads.so/squads/<VAULT>`

### Creating the Vault

1. Go to [Squads V4](https://v4.squads.so)
2. Connect Signer 1 wallet (Solflare)
3. Create new multisig with threshold 2-of-3
4. Add Signer 2 and Signer 3 wallet addresses
5. Fund the vault with initial SOL for rent
6. Record the vault address above

---

## 2. Shamir Secret Sharing — Deployment Key Distribution

The Solana deployment wallet (used for program deploys, future token minting authority) is protected by **Shamir Secret Sharing** with a **3-of-5 threshold**.

| Share # | Holder | Storage Method |
|---------|--------|---------------|
| 1 | Founder (Cuzo1Ace) | Hardware wallet (Ledger) |
| 2 | Wam partnership contact | Encrypted USB, secure location |
| 3 | Legal counsel | Law firm safe |
| 4 | Family member | Sealed envelope, notarized |
| 5 | Cold storage | Bank safe deposit box |

### Tools

- CLI: `ssss-split -t 3 -n 5` / `ssss-combine -t 3` ([ssss](http://point-at-infinity.org/ssss/))
- Mobile: [Vault12](https://vault12.com) for distributed key backup

### Recovery Procedure

1. Contact any 3 of 5 share holders
2. Each provides their share via secure channel (in-person or end-to-end encrypted)
3. Run `ssss-combine -t 3` with the 3 shares
4. Reconstructed key imports into Solana CLI: `solana-keygen recover`
5. Verify against known public key before any transactions

---

## 3. Token Allocation Addresses

Each allocation from `src/data/tokenomics.js` → `DISTRIBUTION` maps to a controlled wallet:

### Community (50% — 500M tokens)

| Allocation | Tokens | % | Wallet Address | Multi-Sig? |
|-----------|--------|---|---------------|-----------|
| Airdrop (LP Holders) | 180,000,000 | 18% | `<AIRDROP_WALLET>` | Yes |
| Solflare Wallet Boost | 20,000,000 | 2% | `<SOLFLARE_BOOST_WALLET>` | Yes |
| Staking Rewards | 150,000,000 | 15% | `<STAKING_REWARDS_WALLET>` | Yes |
| Liquidity Mining | 100,000,000 | 10% | `<LIQUIDITY_WALLET>` | Yes |
| Community Grants | 50,000,000 | 5% | `<GRANTS_WALLET>` | Yes |

### Platform (50% — 500M tokens)

| Allocation | Tokens | % | Wallet Address | Vesting | Multi-Sig? |
|-----------|--------|---|---------------|---------|-----------|
| Team & Founders | 140,000,000 | 14% | `<TEAM_WALLET>` | 4yr linear, 1yr cliff | Yes |
| Solana Mobile Boost | 10,000,000 | 1% | `<MOBILE_BOOST_WALLET>` | None | Yes |
| Treasury | 150,000,000 | 15% | `<TREASURY_WALLET>` | None (operational) | Yes |
| Development Fund | 100,000,000 | 10% | `<DEV_FUND_WALLET>` | None (grant-based) | Yes |
| Strategic Partners | 100,000,000 | 10% | `<PARTNERS_WALLET>` | Per-partnership terms | Yes |

> All token wallets are controlled by the Squads multi-sig. No single signer can unilaterally move tokens.

---

## 4. Program Upgrade Authority

**Current Program:** `HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk`

**Status:** Immutable (no upgrade authority set after deployment)

This means:
- The deployed program cannot be modified
- To add functionality, a **successor program** must be deployed alongside the existing one
- The deployment wallet (protected by Shamir shares) is the only key that can deploy new programs under the Limer's namespace

### Succession Plan

If a new program version is needed:
1. Reconstruct deployment key (3-of-5 Shamir shares)
2. Build new program: `cd anchor && anchor build`
3. Deploy as new program ID: `anchor deploy`
4. Update `src/solana/program.js` with new program ID
5. Implement migration path in `src/solana/bridge.js` (read old PDAs, write new PDAs)
6. Old program remains accessible (users can close old accounts and reclaim rent)

---

## 5. Emergency Procedures

### If a Signer is Compromised

1. Remaining 2 signers use Squads to **remove the compromised signer**
2. Add a new signer (pre-identified backup: see Contact List)
3. Rotate any shared secrets the compromised signer had access to
4. Review all recent multi-sig transactions for unauthorized activity

### If Deployment Key is at Risk

1. Deploy a new program immediately with fresh keypair
2. Announce migration to new program ID
3. Old program remains functional but users should migrate
4. Generate new Shamir shares with new key, distribute to holders

### Contact List

> The full contact list with phone numbers and secure channels is stored in an encrypted document outside this repository. Share holders know how to reach each other.

| Role | Contact Method |
|------|---------------|
| Founder | Signal, Telegram |
| Wam Contact | Signal |
| Legal Counsel | Encrypted email |
| Family Member | Phone |
| Cold Storage | Physical visit required |

---

*This document is the canonical reference for treasury operations. All wallet addresses will be populated at token launch (Phase 2 of Governance Roadmap). See `src/data/tokenomics.js` for allocation data.*
