# Percolator + Arcium Integration Plan

## Vision

Upgrade Limer's Capital from paper perpetuals simulation to **real on-chain perpetual markets** using Percolator's permissionless perp launcher, with **user data protection** via Arcium's encrypted compute layer. This creates the Caribbean's first privacy-preserving derivatives platform.

---

## Phase 1: Percolator Local Integration (Devnet)

### What Percolator Gives Us

Percolator is a permissionless perpetual futures launcher — deploy a perp market for any Solana token in one click. Forked from Anatoly Yakovenko's original design.

- **Coin-margined perps** with formal Kani verification
- **Any token** — TTSE-wrapped stocks, SOL, vetted Solana tokens
- **Risk engine** — liquidation, funding rates, insurance fund, auto-deleveraging (ADL)
- **Matcher CPI model** — pluggable execution (we can build our own matcher or use defaults)
- **Position NFTs** — SPL Token-2022 NFTs wrapping perp positions (composable DeFi)
- **Insurance LP staking** — users can LP into the insurance fund

### SDK Installation

```bash
npm install @percolator/sdk
# peer dep: @solana/web3.js ^1.95
```

### Integration Steps

#### Step 1: Create a Perp Market (Admin)

```typescript
import { buildInitMarketIxData, getProgramId, deriveVaultAuthority } from "@percolator/sdk";

const programId = getProgramId("devnet");

const data = buildInitMarketIxData({
  admin: adminPubkey,
  collateralMint: USDC_MINT,        // or wrapped TTD
  indexFeedId: pythSolUsdFeedId,     // Pyth oracle for the asset
  maxStaleSecs: 60n,
  confFilterBps: 250,
  invert: false,
  unitScale: 1_000_000_000,
  riskParams: { /* margin, funding, liquidation thresholds */ },
});
```

#### Step 2: Wire Into Our Trade Page

Replace the paper perps engine with real Percolator calls:

| Current (Paper) | New (Percolator) |
|-----------------|------------------|
| `useStore.openPerpPosition()` | `buildTradeNoCpiIxData({ requestedSize, maxSlippage })` |
| `useStore.closePerpPosition()` | `buildTradeNoCpiIxData({ requestedSize: -posSize })` |
| `useStore.checkPerpLiquidations()` | `KeeperCrank` (permissionless, we run a crank) |
| Client-side funding rate | `KeeperCrank` accrues funding on-chain |
| `computePnL()` in store | `computeMarkPnl(posSize, entryE6, oracleE6)` from SDK |
| `computeLiqPrice()` in store | `computeLiqPrice(entryE6, capital, posSize, 500n)` from SDK |

#### Step 3: Oracle Price Router

```typescript
import { resolvePrice } from "@percolator/sdk";

// Automatically discovers best price source: Pyth, DexScreener, Jupiter
const result = await resolvePrice(tokenMint);
// result.bestSource — highest-confidence feed
```

This replaces our current CoinGecko/Jupiter price fetching for perp markets.

#### Step 4: Dual Mode Toggle

Keep paper perps alongside real perps:

```
[Paper Mode] ←→ [Live Mode]
     ↓                ↓
  Zustand store    Percolator SDK
  (current engine)  (on-chain)
```

Users graduate from paper to live when ready — this IS our education-to-real pipeline.

### Markets to Launch (Roadmap)

| Phase | Markets | Oracle Source |
|-------|---------|--------------|
| 1A (Devnet) | SOL-PERP, BTC-PERP, ETH-PERP | Pyth |
| 1B (Devnet) | Top vetted Solana tokens (JUP, BONK, RAY, etc.) | Pyth + DexScreener |
| 2 (Mainnet) | All Phase 1 tokens | Pyth |
| 3 (Mainnet) | TTSE-wrapped stocks (pending tokenization) | Custom oracle authority |

#### TTSE Perpetuals — The Killer Feature

This is the blue ocean: **perpetual futures on Caribbean stocks**.

Requirements:
- TTSE stocks must be tokenized as SPL tokens (RWA wrapper)
- Custom oracle authority pushes TTSE prices on-chain via `SetOracleAuthority` + `PushOraclePrice`
- Collateral in USDC or wrapped TTD

```typescript
// Set our price feed bot as oracle authority for TTSE markets
const data = encodeSetOracleAuthority({ newAuthority: ttsePriceBot.publicKey });
```

This means TTSE stock perps would be unique globally — no other platform offers leveraged exposure to Caribbean equities on-chain.

---

## Phase 2: Arcium Confidential Compute Layer

### What Arcium Gives Us

Arcium is the encrypted supercomputer on Solana — MPC (Multi-Party Computation) that processes data without ever decrypting it. No single node sees the raw data.

### Why It Matters for Limer's

1. **Order privacy** — Users' trade sizes and directions stay hidden (prevents front-running)
2. **Dark pool capability** — Institutional-grade order matching without information leakage
3. **Portfolio privacy** — User holdings and P&L are encrypted on-chain
4. **Regulatory compliance** — Data protection built into the protocol (T&T VASP Act alignment)
5. **User trust** — Caribbean users concerned about financial surveillance get cryptographic guarantees

### Architecture

```
User (Browser)
  │
  ├─ encrypt order data with x25519 → MXE cluster
  │
  ├─ submit encrypted tx to Solana program
  │
  └─ MXE nodes execute matching circuit on secret shares
       │
       ├─ Success callback → on-chain settlement (Percolator)
       └─ Failure callback → order rejected (no data leaked)
```

### Integration Points

#### A. Confidential Order Submission

```rust
// Arcis circuit: encrypted order matching
#[instruction]
pub fn submit_order(
    order: Enc<Shared, Order>,
    book: Enc<Mxe, OrderBook>
) -> Enc<Mxe, OrderBook> {
    let order_data = order.to_arcis();
    let mut book_data = book.to_arcis();
    // Match against existing orders — all encrypted
    // Neither the platform nor any single node sees the order
    book.owner.from_arcis(book_data)
}
```

#### B. Client-Side Encryption

```typescript
import { RescueCipher } from '@arcium-hq/client';

// Encrypt trade before submitting
const cipher = new RescueCipher(sharedSecret);
const packed = circuits.Order.pack({
    size: 1000,
    bid: true,
    price: 50000
});
const encrypted = cipher.encrypt(packed, randomBytes(16));
```

#### C. Confidential Portfolio Viewing

Users see their own positions (they hold the decryption key), but no one else — not even the platform — can see another user's portfolio.

### Arcium Installation

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

Prerequisites: Rust, Solana CLI 2.3.0, Anchor 0.32.1, Docker

TypeScript SDK:
```bash
npm install @arcium-hq/client @arcium-hq/reader
```

---

## Phase 3: Combined Architecture

```
┌──────────────────────────────────────────────────────┐
│                    LIMER'S CAPITAL                     │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Education │  │  Paper   │  │    Live Trading       │ │
│  │ Modules  │  │ Trading  │  │                        │ │
│  │ (Learn)  │  │ (Sim)    │  │  ┌─────────────────┐  │ │
│  └──────────┘  └──────────┘  │  │   Jupiter V6    │  │ │
│                              │  │   (Spot Swaps)   │  │ │
│       Graduation Path ──────►│  ├─────────────────┤  │ │
│       (XP gated)             │  │   Percolator    │  │ │
│                              │  │   (Perpetuals)   │  │ │
│                              │  ├─────────────────┤  │ │
│                              │  │    Arcium MXE    │  │ │
│                              │  │  (Encrypted      │  │ │
│                              │  │   Order Flow)    │  │ │
│                              │  └─────────────────┘  │ │
│                              └──────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              On-Chain Layer (Solana)              │  │
│  │  Limer Profile Program │ Percolator Markets      │  │
│  │  (badges, XP, trades)  │ (perp state, funding)   │  │
│  │                        │                          │  │
│  │  Arcium Circuits       │ Insurance Fund           │  │
│  │  (encrypted matching)  │ (LP staking)             │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### User Journey (Full Loop)

1. **Learn** → Complete 8 modules, pass quizzes, earn XP
2. **Practice** → Paper trade with zero risk (current system)
3. **Graduate** → XP threshold unlocks live trading
4. **Swap** → Jupiter V6 for spot trades
5. **Perps** → Percolator for leveraged positions (SOL, BTC, ETH, vetted tokens)
6. **TTSE Perps** → Caribbean stock perpetuals (unique globally)
7. **Privacy** → Arcium encrypts order flow, portfolio data
8. **Earn** → LP into insurance fund, earn $LIMER, compete in tournaments

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Install `@percolator/sdk`, connect to devnet | 1 day | Foundation |
| P1 | Create SOL-PERP market on devnet | 2 days | Proof of concept |
| P2 | Wire TradePage perps tab to Percolator (dual mode toggle) | 3 days | Core feature |
| P3 | Run keeper crank bot (funding + liquidation) | 2 days | Market health |
| P4 | Add BTC-PERP, ETH-PERP markets | 1 day | Market breadth |
| P5 | Install Arcium toolchain, write hello-world circuit | 2 days | Privacy foundation |
| P6 | Build confidential order submission circuit | 5 days | Privacy trading |
| P7 | Deploy to mainnet (Percolator audit is complete) | 2 days | Production |
| P8 | TTSE tokenization + custom oracle for TTSE-PERP | 10 days | Killer feature |
| P9 | Insurance fund LP staking integration | 3 days | Revenue stream |

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Percolator SDK is RC (not final release) | Medium | Audit is complete; stick to devnet first |
| Arcium MPC adds latency to order execution | Medium | Use for dark pool orders only; standard orders go direct |
| TTSE tokenization requires legal framework | High | Partner with WAM and T&T regulators under VASP Act |
| Custom oracle for TTSE needs reliable price feed | Medium | Build redundant feed from TTSE API + manual oversight |
| Insurance fund bootstrapping (new markets need LPs) | Medium | Seed with platform treasury; incentivize with $LIMER |

---

## Competitive Moat (Post-Integration)

After Percolator + Arcium:

- **Only platform** offering perpetual futures on Caribbean stocks
- **Only platform** with privacy-preserving order flow on Solana perps
- **Only platform** combining education → paper trading → real perps → dark pool
- **Regulatory alignment** — Arcium's encrypted compute satisfies data protection requirements
- **Position NFTs** — Percolator's Token-2022 NFTs make perp positions composable (could be used as collateral, traded, or displayed as achievements)

This is no longer just "Caribbean's Robinhood" — it's **Caribbean's Robinhood + dYdX + dark pool**, with an education moat that no trading platform can replicate quickly.
