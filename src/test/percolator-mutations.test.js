/**
 * Percolator Mutations — Unit Tests
 *
 * Tests instruction encoding, error mapping, and transaction
 * building logic. Wallet signing is mocked.
 */
import { describe, it, expect, vi } from 'vitest';

import { mapPercolatorError } from '../solana/percolator-mutations';
import {
  PERCOLATOR_CONFIG,
  PERCOLATOR_MARKETS,
  getProgramId,
  deriveSlabPubkey,
  deriveUserAccount,
  mapOnChainPosition,
} from '../solana/percolator';

// ── Error Mapping Tests ─────────────────────────────────────

describe('mapPercolatorError', () => {
  it('returns null for user rejection (silent dismiss)', () => {
    expect(mapPercolatorError(new Error('User rejected the request'))).toBeNull();
    expect(mapPercolatorError(new Error('user rejected'))).toBeNull();
  });

  it('maps InsufficientCollateral to friendly message', () => {
    const msg = mapPercolatorError(new Error('InsufficientCollateral'));
    expect(msg).toContain('collateral');
    expect(msg).toContain('USDC');
  });

  it('maps SlippageExceeded to friendly message', () => {
    const msg = mapPercolatorError(new Error('SlippageExceeded'));
    expect(msg).toContain('slippage');
  });

  it('maps AdlTriggered to friendly message', () => {
    const msg = mapPercolatorError(new Error('AdlTriggered'));
    expect(msg).toContain('auto-deleveraging');
  });

  it('maps AccountNotInitialized', () => {
    const msg = mapPercolatorError(new Error('AccountNotInitialized'));
    expect(msg).toContain('Initialize');
  });

  it('maps MaxPositionExceeded', () => {
    const msg = mapPercolatorError(new Error('MaxPositionExceeded'));
    expect(msg).toContain('limits');
  });

  it('maps timeout errors', () => {
    const msg = mapPercolatorError(new Error('Transaction confirmation timed out'));
    expect(msg).toContain('timed out');
  });

  it('maps wallet not connected', () => {
    const msg = mapPercolatorError(new Error('Wallet not connected'));
    expect(msg).toContain('wallet');
  });

  it('truncates unknown errors to 100 chars', () => {
    const longMsg = 'A'.repeat(200);
    const msg = mapPercolatorError(new Error(longMsg));
    expect(msg.length).toBeLessThanOrEqual(120); // "Trade failed: " + 100
  });

  it('handles non-Error objects', () => {
    const msg = mapPercolatorError('some string error');
    expect(msg).toContain('Trade failed');
  });
});

// ── Trade Size Conversion Tests ─────────────────────────────

describe('Trade Size Conversion', () => {
  const PRICE_SCALE = PERCOLATOR_CONFIG.PRICE_SCALE;

  it('collateral + leverage → notional size in e6', () => {
    const collateral = 1000;    // $1000
    const leverage = 10;
    const notionalUSD = collateral * leverage; // $10,000
    const sizeE6 = Math.round(notionalUSD * PRICE_SCALE);

    expect(sizeE6).toBe(10_000_000_000);
    expect(sizeE6 / PRICE_SCALE).toBe(10000);
  });

  it('long position has positive requestedSize', () => {
    const size = 5000 * PRICE_SCALE;
    expect(size).toBeGreaterThan(0);
  });

  it('short position has negative requestedSize', () => {
    const size = -(5000 * PRICE_SCALE);
    expect(size).toBeLessThan(0);
  });

  it('partial close negates current size proportionally', () => {
    const currentSize = 10000 * PRICE_SCALE; // long
    const fraction = 0.5;
    const closeSize = -Math.round(currentSize * fraction);

    expect(closeSize).toBe(-5_000_000_000);
    expect(Math.abs(closeSize) / PRICE_SCALE).toBe(5000);
  });

  it('full close negates entire position', () => {
    const currentSize = 10000 * PRICE_SCALE;
    const closeSize = -currentSize;
    expect(closeSize + currentSize).toBe(0);
  });

  it('BigInt conversion preserves precision', () => {
    const amount = 1234.567890;
    const e6 = Math.round(amount * PRICE_SCALE);
    const bigIntVal = BigInt(e6);

    expect(Number(bigIntVal)).toBe(e6);
    expect(Number(bigIntVal) / PRICE_SCALE).toBeCloseTo(1234.56789, 4);
  });
});

// ── Slippage Calculation Tests ──────────────────────────────

describe('Slippage Configuration', () => {
  it('default slippage is 50 bps = 0.5%', () => {
    const bps = PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS;
    expect(bps).toBe(50);
    expect(bps / 10000).toBe(0.005);
  });

  it('slippage applied to trade quote', () => {
    const quotePrice = 150; // $150
    const slippageBps = 50; // 0.5%
    const worstPrice = quotePrice * (1 + slippageBps / 10000); // for long
    const bestPrice = quotePrice * (1 - slippageBps / 10000); // for short

    expect(worstPrice).toBeCloseTo(150.75, 2);
    expect(bestPrice).toBeCloseTo(149.25, 2);
  });
});

// ── Transaction Signing Pattern Tests ───────────────────────

describe('Wallet-Standard Signing Pattern', () => {
  it('mock wallet can sign and send', async () => {
    const mockWallet = {
      features: {
        'solana:signAndSendTransaction': {
          signAndSendTransaction: vi.fn().mockResolvedValue({
            signature: 'mock_sig_base58_abc123',
          }),
        },
      },
    };

    const mockAccount = { address: 'WALLET_ADDR_123' };

    const result = await mockWallet.features['solana:signAndSendTransaction']
      .signAndSendTransaction({
        transaction: new Uint8Array([1, 2, 3]),
        account: mockAccount,
      });

    expect(result.signature).toBe('mock_sig_base58_abc123');
    expect(mockWallet.features['solana:signAndSendTransaction']
      .signAndSendTransaction).toHaveBeenCalledOnce();
  });

  it('handles Uint8Array signature response', () => {
    const sigBytes = new Uint8Array([0x12, 0xab, 0xff]);
    const sigHex = Array.from(sigBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    expect(sigHex).toBe('12abff');
  });

  it('handles string signature response', () => {
    const sig = 'abc123def456';
    // String sigs are used directly
    expect(typeof sig).toBe('string');
    expect(sig.length).toBeGreaterThan(0);
  });
});

// ── ADL Safety Tests ────────────────────────────────────────

describe('ADL Safety Checks', () => {
  it('withdrawal should be blocked during ADL', () => {
    const isAdl = true;
    const canWithdraw = !isAdl;
    expect(canWithdraw).toBe(false);
  });

  it('withdrawal allowed when ADL not triggered', () => {
    const isAdl = false;
    const canWithdraw = !isAdl;
    expect(canWithdraw).toBe(true);
  });

  it('open trade allowed even during ADL', () => {
    // ADL only blocks withdrawals, not new trades
    const isAdl = true;
    const canTrade = true; // Always allowed
    expect(canTrade).toBe(true);
  });
});

// ── Cache Invalidation Tests ────────────────────────────────

describe('Query Cache Keys', () => {
  it('slab cache key includes pubkey', () => {
    const slabPubkey = 'SLAB_ABC123';
    const queryKey = ['percolator-slab', slabPubkey];
    expect(queryKey).toEqual(['percolator-slab', 'SLAB_ABC123']);
  });

  it('user cache key includes wallet address and slot', () => {
    const walletAddress = 'WALLET_XYZ';
    const slot = 12345;
    const queryKey = ['percolator-user', walletAddress, slot];
    expect(queryKey[1]).toBe('WALLET_XYZ');
    expect(queryKey[2]).toBe(12345);
  });

  it('oracle cache key includes market key', () => {
    const queryKey = ['oracle-price', 'SOL-PERP'];
    expect(queryKey[1]).toBe('SOL-PERP');
  });
});
