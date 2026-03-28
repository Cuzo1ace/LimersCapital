/**
 * Tokenomics — Distribution, Revenue, and Economic Model Tests
 *
 * Validates the token distribution math and revenue model invariants
 * that will be enforced on-chain via SPL Token + Metaplex dNFTs.
 *
 * Rust-portable:
 *   pub struct Distribution { pub label: String, pub pct: u8, pub side: Side }
 *   pub fn validate_distribution(dist: &[Distribution]) -> bool
 */
import { describe, it, expect } from 'vitest';
import {
  TOKEN,
  DISTRIBUTION,
  REVENUE_STREAMS,
  REVENUE_DISTRIBUTION,
  PREMIUM_BENEFITS,
  VALUE_PROPS,
} from '../data/tokenomics';

// ── Token Info ───────────────────────────────────────────────

describe('Token Info', () => {
  it('symbol is $LIMER (not $LIMERR)', () => {
    expect(TOKEN.symbol).toBe('$LIMER');
    expect(TOKEN.symbol).not.toContain('RR');
  });

  it('total supply is 1 billion', () => {
    expect(TOKEN.totalSupply).toBe(1_000_000_000);
  });

  it('chain is Solana', () => {
    expect(TOKEN.chain).toBe('Solana');
  });

  it('decimals is 9 (standard SPL)', () => {
    expect(TOKEN.decimals).toBe(9);
  });
});

// ── Distribution ─────────────────────────────────────────────

describe('Token Distribution', () => {
  it('community + platform pct sums to 100%', () => {
    expect(DISTRIBUTION.community.pct + DISTRIBUTION.platform.pct).toBe(100);
  });

  it('community side is 50%', () => {
    expect(DISTRIBUTION.community.pct).toBe(50);
  });

  it('platform side is 50%', () => {
    expect(DISTRIBUTION.platform.pct).toBe(50);
  });

  it('community breakdown sums to 50%', () => {
    const total = DISTRIBUTION.community.breakdown.reduce((s, d) => s + d.pct, 0);
    expect(total).toBe(50);
  });

  it('platform breakdown sums to 50%', () => {
    const total = DISTRIBUTION.platform.breakdown.reduce((s, d) => s + d.pct, 0);
    expect(total).toBe(50);
  });

  it('every allocation has label, pct, and tokens', () => {
    const all = [...DISTRIBUTION.community.breakdown, ...DISTRIBUTION.platform.breakdown];
    all.forEach(d => {
      expect(d).toHaveProperty('label');
      expect(d).toHaveProperty('pct');
      expect(d).toHaveProperty('tokens');
      expect(typeof d.label).toBe('string');
      expect(d.pct).toBeGreaterThan(0);
    });
  });

  it('token amounts match percentages of total supply', () => {
    const all = [...DISTRIBUTION.community.breakdown, ...DISTRIBUTION.platform.breakdown];
    all.forEach(d => {
      const expected = TOKEN.totalSupply * (d.pct / 100);
      expect(d.tokens).toBe(expected);
    });
  });

  it('Solflare Wallet Boost is 2%', () => {
    const solflare = DISTRIBUTION.community.breakdown.find(d => d.label.includes('Solflare'));
    expect(solflare).toBeDefined();
    expect(solflare.pct).toBe(2);
  });

  it('Solana Mobile Boost is 1%', () => {
    const mobile = DISTRIBUTION.platform.breakdown.find(d => d.label.includes('Mobile'));
    expect(mobile).toBeDefined();
    expect(mobile.pct).toBe(1);
  });

  it('airdrop allocation exists in community', () => {
    const airdrop = DISTRIBUTION.community.breakdown.find(d => d.label.toLowerCase().includes('airdrop'));
    expect(airdrop).toBeDefined();
    expect(airdrop.pct).toBeGreaterThan(0);
  });
});

// ── Revenue Streams ──────────────────────────────────────────

describe('Revenue Streams', () => {
  it('has multiple revenue streams', () => {
    expect(REVENUE_STREAMS.length).toBeGreaterThanOrEqual(5);
  });

  it('every stream has source, collected, and desc', () => {
    REVENUE_STREAMS.forEach(s => {
      expect(s).toHaveProperty('source');
      expect(s).toHaveProperty('collected');
      expect(s).toHaveProperty('desc');
      expect(typeof s.collected).toBe('string');
    });
  });

  it('collected currency includes USDC or SOL (real yield)', () => {
    REVENUE_STREAMS.forEach(s => {
      expect(s.collected).toMatch(/USDC|SOL/);
    });
  });

  it('no stream collects in $LIMER (anti sell-pressure)', () => {
    REVENUE_STREAMS.forEach(s => {
      expect(s.collected).not.toContain('LIMER');
    });
  });

  it('revenue percentages sum to 100%', () => {
    const total = REVENUE_STREAMS.reduce((s, r) => s + r.pct, 0);
    expect(total).toBe(100);
  });
});

// ── Revenue Distribution ─────────────────────────────────────

describe('Revenue Distribution', () => {
  it('community and platform shares sum to 100%', () => {
    expect(REVENUE_DISTRIBUTION.community.pct + REVENUE_DISTRIBUTION.platform.pct).toBe(100);
  });

  it('50/50 split between community and platform', () => {
    expect(REVENUE_DISTRIBUTION.community.pct).toBe(50);
    expect(REVENUE_DISTRIBUTION.platform.pct).toBe(50);
  });

  it('distribution specifies USDC and SOL', () => {
    expect(REVENUE_DISTRIBUTION.community.distributed).toMatch(/USDC/);
    expect(REVENUE_DISTRIBUTION.community.distributed).toMatch(/SOL/);
  });
});

// ── Premium Benefits ─────────────────────────────────────────

describe('Premium Benefits', () => {
  it('has multiple benefits', () => {
    expect(PREMIUM_BENEFITS.length).toBeGreaterThanOrEqual(4);
  });

  it('every benefit has title, desc, and icon', () => {
    PREMIUM_BENEFITS.forEach(b => {
      expect(b).toHaveProperty('title');
      expect(b).toHaveProperty('desc');
      expect(b).toHaveProperty('icon');
    });
  });

  it('includes Wam integration', () => {
    expect(PREMIUM_BENEFITS.some(b => b.title.toLowerCase().includes('wam'))).toBe(true);
  });

  it('includes ViFi yield', () => {
    expect(PREMIUM_BENEFITS.some(b => b.title.toLowerCase().includes('vifi'))).toBe(true);
  });
});

// ── Value Props ──────────────────────────────────────────────

describe('Value Props', () => {
  it('has multiple value propositions', () => {
    expect(VALUE_PROPS.length).toBeGreaterThanOrEqual(3);
  });

  it('every prop has title, desc, and icon', () => {
    VALUE_PROPS.forEach(p => {
      expect(p).toHaveProperty('title');
      expect(p).toHaveProperty('desc');
      expect(p).toHaveProperty('icon');
    });
  });
});
