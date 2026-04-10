# Solana Program

Limer's Capital on-chain program is built with Anchor and deployed on Solana.

## Program ID

```
HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk
```

## Account Structures

### UserProfile PDA (78 bytes)

| Field | Type | Size | Description |
|-------|------|------|-------------|
| xp | u32 | 4 | Total experience points |
| limer_points | u32 | 4 | Accumulated Limer Points |
| badges_earned | u32 | 4 | Bitmap of unlocked badges (up to 32) |
| trade_count | u16 | 2 | Total trades executed |
| daily_checkins | u16 | 2 | Lifetime daily check-ins |
| current_streak | u16 | 2 | Current consecutive-day streak |
| longest_streak | u16 | 2 | All-time longest streak |

PDA seed: `["user_profile", wallet_pubkey]`

### TradeLog PDA (53 bytes)

| Field | Type | Size | Description |
|-------|------|------|-------------|
| token | [u8; 32] | 32 | Token mint address |
| amount | u64 | 8 | Trade amount in base units |
| price | u64 | 8 | Execution price (scaled) |
| timestamp | i64 | 8 | Unix timestamp |
| pnl | i32 | 4 | Profit/loss in basis points |
| side | u8 | 1 | 0 = buy, 1 = sell |

PDA seed: `["trade_log", wallet_pubkey, trade_index]`

## Instructions

| Instruction | Description |
|-------------|-------------|
| `init_profile` | Create a new UserProfile PDA for a wallet |
| `award_xp` | Add XP to a user's profile |
| `award_lp` | Add Limer Points to a user's profile |
| `log_trade` | Record a trade in the TradeLog PDA |
| `set_badge` | Set a badge bit in the badges_earned bitmap |
| `daily_checkin` | Record a daily check-in, update streak counters |

[See the API Reference -->](api-reference.md)
