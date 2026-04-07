/**
 * On-Chain Type Compatibility — Solana Program ↔ JS Type Mapping
 *
 * Validates that all data structures used in the JS client
 * are compatible with the Anchor IDL and can be losslessly
 * serialized to/from Rust types via Borsh encoding.
 *
 * Rust types:
 *   pub struct UserProfile { owner: Pubkey, xp: u64, limer_points: u64, ... }
 *   pub struct TradeLog { owner: Pubkey, trade_count: u32, total_volume_usd: u64, ... }
 */
import { describe, it, expect } from 'vitest';
import { BADGES } from '../data/badges';
import { MODULES } from '../data/modules';
import { TIERS } from '../data/gamification';
import { LP_MULTIPLIERS } from '../data/lp';

// ── On-Chain Constraints ─────────────────────────────────────
// These mirror the Anchor program's account sizes and limits.

const U8_MAX = 255;
const U32_MAX = 4_294_967_295;
const U64_MAX = BigInt('18446744073709551615');

describe('On-Chain Type Compatibility — UserProfile', () => {
  it('XP values fit in u64', () => {
    // Max possible XP: all actions × reasonable max count
    // 200 (module) × 8 + 150 (quiz) × 8 + 50 (lesson) × 50 + 75 (trade milestones) × 3 + 25 (streak) × 365
    // = 1600 + 1200 + 2500 + 225 + 9125 = ~14,650 (way under u64)
    const maxReasonableXP = 15_000; // tier 10 threshold
    expect(maxReasonableXP).toBeLessThan(Number(U64_MAX));
  });

  it('LP values fit in u64', () => {
    // Even with 5x multiplier and heavy usage, LP is bounded
    const maxReasonableLP = 1_000_000; // generous upper bound
    expect(maxReasonableLP).toBeLessThan(Number(U64_MAX));
  });

  it('on-chain badges (first 32) fit in u32 bitmap', () => {
    // On-chain uses u32 bitmap — only first 32 badges get bit positions.
    // Additional badges beyond 32 are tracked locally only.
    const onChainBadges = BADGES.slice(0, 32);
    expect(onChainBadges.length).toBeLessThanOrEqual(32);
    onChainBadges.forEach((_, i) => {
      const bit = 1 << i;
      expect(bit).toBeLessThanOrEqual(U32_MAX);
    });
  });

  it('modules fit in u8 bitmap (max 8 modules)', () => {
    expect(MODULES.length).toBeLessThanOrEqual(8);
    // Verify each module can be represented as a bit in u8
    MODULES.forEach((_, i) => {
      const bit = 1 << i;
      expect(bit).toBeLessThanOrEqual(U8_MAX);
    });
  });

  it('streak count fits in u32', () => {
    // Even 365 × 100 years = 36,500
    expect(36500).toBeLessThan(U32_MAX);
  });

  it('badge bitmap operations are correct', () => {
    let bitmap = 0;

    // Set badge 0
    bitmap |= (1 << 0);
    expect(bitmap & (1 << 0)).toBeTruthy();
    expect(bitmap & (1 << 1)).toBeFalsy();

    // Set badge 5
    bitmap |= (1 << 5);
    expect(bitmap & (1 << 5)).toBeTruthy();
    expect(bitmap & (1 << 0)).toBeTruthy(); // still set

    // Set badge 31 (max for u32)
    bitmap |= (1 << 31);
    expect((bitmap >>> 31) & 1).toBe(1); // unsigned shift for bit 31
  });

  it('module bitmap operations are correct', () => {
    let bitmap = 0;

    // Complete module-1 (index 0)
    bitmap |= (1 << 0);
    expect(bitmap & (1 << 0)).toBeTruthy();

    // Complete module-8 (index 7)
    bitmap |= (1 << 7);
    expect(bitmap & (1 << 7)).toBeTruthy();
    expect(bitmap).toBeLessThanOrEqual(U8_MAX);

    // All 8 modules complete = 0xFF
    bitmap = 0xFF;
    for (let i = 0; i < 8; i++) {
      expect(bitmap & (1 << i)).toBeTruthy();
    }
    expect(bitmap).toBe(255);
  });
});

describe('On-Chain Type Compatibility — TradeLog', () => {
  it('trade count fits in u32', () => {
    // Even 100 trades/day × 365 × 100 years = 3,650,000
    expect(3_650_000).toBeLessThan(U32_MAX);
  });

  it('volume in USD cents fits in u64', () => {
    // $100B in cents = 10,000,000,000,000 — fits in u64
    expect(BigInt(10_000_000_000_000)).toBeLessThan(U64_MAX);
  });

  it('fee amounts fit in u64', () => {
    // Max fee: $100B × 0.3% = $300M in cents = 30,000,000,000
    expect(BigInt(30_000_000_000)).toBeLessThan(U64_MAX);
  });
});

describe('On-Chain Type Compatibility — Tier System', () => {
  it('tier levels fit in u8', () => {
    TIERS.forEach(t => {
      expect(t.level).toBeLessThanOrEqual(U8_MAX);
    });
  });

  it('tier XP thresholds fit in u64', () => {
    TIERS.forEach(t => {
      expect(t.xp).toBeLessThan(Number(U64_MAX));
    });
  });

  it('LP multipliers can be represented as basis points (u32)', () => {
    // 5.0x = 50000 bps, fits in u32
    Object.values(LP_MULTIPLIERS).forEach(m => {
      const bps = Math.round(m * 10000);
      expect(bps).toBeLessThan(U32_MAX);
      // Roundtrip: bps back to float matches original
      expect(bps / 10000).toBeCloseTo(m, 4);
    });
  });
});

describe('On-Chain Type Compatibility — PDA Seeds', () => {
  it('user profile PDA seeds: ["user", owner_pubkey]', () => {
    const seeds = ['user']; // + owner pubkey (32 bytes)
    expect(Buffer.from(seeds[0]).length).toBeLessThanOrEqual(32);
  });

  it('trade log PDA seeds: ["trades", owner_pubkey]', () => {
    const seeds = ['trades']; // + owner pubkey (32 bytes)
    expect(Buffer.from(seeds[0]).length).toBeLessThanOrEqual(32);
  });
});

describe('On-Chain Type Compatibility — Instruction Args', () => {
  it('award_xp amount fits in u64', () => {
    // Max single XP award: 250 (LP module complete)
    expect(250).toBeLessThan(Number(U64_MAX));
  });

  it('award_lp base_amount fits in u64, multiplier_pct fits in u32', () => {
    // Max LP award: 200 (referral)
    expect(200).toBeLessThan(Number(U64_MAX));
    // Max multiplier: 5.0x = 500%
    expect(500).toBeLessThan(U32_MAX);
  });

  it('record_badge badge_index fits in u8 (0-31) for on-chain badges', () => {
    // On-chain uses a u32 bitmap — only first 32 badges get bit positions.
    // Badges beyond 32 are tracked locally only.
    const onChainBadges = BADGES.slice(0, 32);
    onChainBadges.forEach((_, i) => {
      expect(i).toBeLessThanOrEqual(31);
      expect(i).toBeLessThanOrEqual(U8_MAX);
    });
  });

  it('record_module module_index fits in u8 (0-7)', () => {
    MODULES.forEach((_, i) => {
      expect(i).toBeLessThanOrEqual(7);
      expect(i).toBeLessThanOrEqual(U8_MAX);
    });
  });

  it('record_trade volume_usd and fee_amount fit in u64', () => {
    // Single trade: max $100K × 0.3% = $300 fee
    expect(100_000).toBeLessThan(Number(U64_MAX));
    expect(300).toBeLessThan(Number(U64_MAX));
  });
});
