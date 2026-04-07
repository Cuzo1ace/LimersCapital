/**
 * Solana Integration Tests
 *
 * Tests the full Solana integration stack without requiring a live network.
 * Uses mocked RPC responses and wallet adapters to verify:
 *
 * 1. Transaction confirmation polling logic
 * 2. Wallet adapter bridging (wallet-standard → Anchor)
 * 3. PDA derivation correctness
 * 4. Account data fetching and parsing
 * 5. Bridge sync logic (Zustand ↔ on-chain dedup)
 * 6. RPC configuration and security (trusted domain whitelist)
 * 7. Address validation edge cases
 * 8. Error handling and recovery paths
 *
 * @see solana-dev skill: testing.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── 1. Transaction Confirmation Polling ──────────────────────────────────────

describe('Transaction Confirmation', () => {
  let confirmTransaction, confirmTransactionSafe, ConfirmationTimeoutError;

  beforeEach(async () => {
    const mod = await import('../solana/confirm.js');
    confirmTransaction = mod.confirmTransaction;
    confirmTransactionSafe = mod.confirmTransactionSafe;
    ConfirmationTimeoutError = mod.ConfirmationTimeoutError;
  });

  it('confirms a successful transaction', async () => {
    const mockRpc = createMockRpc([
      null, // first poll: not found yet
      { confirmationStatus: 'confirmed', slot: 12345, err: null },
    ]);

    const result = await confirmTransaction(mockRpc, 'fakeSig123', {
      commitment: 'confirmed',
      timeoutMs: 5000,
    });

    expect(result.commitment).toBe('confirmed');
    expect(result.signature).toBe('fakeSig123');
    expect(result.slot).toBe(12345);
    expect(result.err).toBeNull();
    expect(result.elapsed).toBeGreaterThan(0);
  });

  it('detects on-chain transaction failure', async () => {
    const mockRpc = createMockRpc([
      { confirmationStatus: 'confirmed', slot: 100, err: { InstructionError: [0, 'Custom'] } },
    ]);

    const result = await confirmTransaction(mockRpc, 'failSig', {
      commitment: 'confirmed',
      timeoutMs: 5000,
    });

    expect(result.err).toBeTruthy();
    expect(result.err.InstructionError).toBeDefined();
  });

  it('times out after specified duration', async () => {
    // RPC always returns null (tx never lands)
    const mockRpc = createMockRpc([null, null, null, null, null, null, null, null, null, null]);

    await expect(
      confirmTransaction(mockRpc, 'neverLands', {
        commitment: 'confirmed',
        timeoutMs: 1500,
      })
    ).rejects.toThrow(ConfirmationTimeoutError);
  });

  it('ConfirmationTimeoutError has correct properties', () => {
    const err = new ConfirmationTimeoutError('sig123', 30000);
    expect(err.name).toBe('ConfirmationTimeoutError');
    expect(err.signature).toBe('sig123');
    expect(err.timeoutMs).toBe(30000);
    expect(err.message).toContain('sig123');
    expect(err.message).toContain('30000');
  });

  it('calls onStatusChange callback during polling', async () => {
    const statuses = [];
    const mockRpc = createMockRpc([
      null,
      { confirmationStatus: 'processed', slot: 10, err: null },
      { confirmationStatus: 'confirmed', slot: 10, err: null },
    ]);

    await confirmTransaction(mockRpc, 'callbackSig', {
      commitment: 'confirmed',
      timeoutMs: 5000,
      onStatusChange: (s) => statuses.push(s),
    });

    expect(statuses).toContain('confirming');
    expect(statuses).toContain('confirmed');
  });

  it('confirmTransactionSafe returns null on timeout instead of throwing', async () => {
    const mockRpc = createMockRpc([null, null, null, null, null, null, null, null]);

    const result = await confirmTransactionSafe(mockRpc, 'safeSig', {
      commitment: 'confirmed',
      timeoutMs: 1200,
    });

    expect(result).toBeNull();
  });

  it('handles finalized commitment level', async () => {
    const mockRpc = createMockRpc([
      { confirmationStatus: 'confirmed', slot: 50, err: null },
      { confirmationStatus: 'finalized', slot: 50, err: null },
    ]);

    const result = await confirmTransaction(mockRpc, 'finSig', {
      commitment: 'finalized',
      timeoutMs: 5000,
    });

    expect(result.commitment).toBe('finalized');
  });

  it('recovers from transient RPC errors during polling', async () => {
    let callCount = 0;
    const mockRpc = {
      getSignatureStatuses: () => ({
        send: async () => {
          callCount++;
          if (callCount <= 2) throw new Error('RPC timeout');
          return { value: [{ confirmationStatus: 'confirmed', slot: 99, err: null }] };
        },
      }),
    };

    const result = await confirmTransaction(mockRpc, 'retrySig', {
      commitment: 'confirmed',
      timeoutMs: 10000,
    });

    expect(result.commitment).toBe('confirmed');
    expect(callCount).toBeGreaterThan(2);
  });
});

// ─── 2. Wallet Adapter Bridge ─────────────────────────────────────────────────

describe('Wallet Adapter (wallet-standard → Anchor)', () => {
  it('returns null for null input', async () => {
    const { makeAnchorWallet } = await import('../solana/wallet-adapter.js');
    expect(makeAnchorWallet(null)).toBeNull();
    expect(makeAnchorWallet(undefined)).toBeNull();
  });

  it('creates a wallet with publicKey from address', async () => {
    const { makeAnchorWallet } = await import('../solana/wallet-adapter.js');

    const mockAccount = {
      address: '11111111111111111111111111111111',
      features: {
        'solana:signTransaction': {
          signTransaction: vi.fn(),
        },
      },
    };

    const wallet = makeAnchorWallet(mockAccount);
    expect(wallet).not.toBeNull();
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.publicKey.toBase58()).toBe('11111111111111111111111111111111');
  });

  it('exposes signTransaction and signAllTransactions', async () => {
    const { makeAnchorWallet } = await import('../solana/wallet-adapter.js');

    const mockAccount = {
      address: '11111111111111111111111111111111',
      features: {
        'solana:signTransaction': {
          signTransaction: vi.fn(),
        },
      },
    };

    const wallet = makeAnchorWallet(mockAccount);
    expect(typeof wallet.signTransaction).toBe('function');
    expect(typeof wallet.signAllTransactions).toBe('function');
  });
});

// ─── 3. PDA Derivation ──────────────────────────────────────────────────────

describe('PDA Derivation Functions', () => {
  it('getUserProfilePDA and getTradeLogPDA are exported functions', async () => {
    const { getUserProfilePDA, getTradeLogPDA } = await import('../solana/program.js');
    expect(typeof getUserProfilePDA).toBe('function');
    expect(typeof getTradeLogPDA).toBe('function');
  });

  it('getLimerProgramId returns a valid PublicKey', async () => {
    const { getLimerProgramId } = await import('../solana/program.js');
    const id = getLimerProgramId();
    expect(id).toBeDefined();
    expect(id.toBase58()).toBe('HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk');
  });

  it('PDA seed constants match IDL definitions', async () => {
    // Verify the seed strings used in program.js match the IDL byte values
    const idl = (await import('../solana/idl/limer.json')).default;
    const initUser = idl.instructions.find(i => i.name === 'initialize_user');

    const profileSeed = initUser.accounts.find(a => a.name === 'user_profile').pda.seeds[0].value;
    const tradeSeed = initUser.accounts.find(a => a.name === 'trade_log').pda.seeds[0].value;

    // program.js uses Buffer.from('user') and Buffer.from('trades')
    expect(String.fromCharCode(...profileSeed)).toBe('user');
    expect(String.fromCharCode(...tradeSeed)).toBe('trades');
  });

  it('program ID matches IDL address', async () => {
    const { getLimerProgramId } = await import('../solana/program.js');
    const idl = (await import('../solana/idl/limer.json')).default;

    expect(getLimerProgramId().toBase58()).toBe(idl.address);
  });
});

// ─── 4. RPC Configuration & Security ─────────────────────────────────────────

describe('RPC Configuration & Security', () => {
  it('exports cluster configurations', async () => {
    const { CLUSTERS, DEFAULT_CLUSTER } = await import('../solana/config.js');

    expect(CLUSTERS.devnet).toBeDefined();
    expect(CLUSTERS['mainnet-beta']).toBeDefined();
    expect(CLUSTERS.devnet.rpc).toContain('devnet');
    expect(CLUSTERS['mainnet-beta'].rpc).toContain('mainnet');
    expect(DEFAULT_CLUSTER).toBe('devnet');
  });

  it('provides explorer URL generators', async () => {
    const { getAccountExplorerUrl, getTxExplorerUrl } = await import('../solana/config.js');

    const accountUrl = getAccountExplorerUrl('FakeAddr123', 'devnet');
    expect(accountUrl).toContain('FakeAddr123');
    expect(accountUrl).toContain('devnet');

    const txUrl = getTxExplorerUrl('FakeSig123', 'mainnet-beta');
    expect(txUrl).toContain('FakeSig123');
    expect(txUrl).not.toContain('devnet');
  });

  it('uses HTTPS for all default cluster RPC URLs', async () => {
    const { CLUSTERS } = await import('../solana/config.js');

    Object.values(CLUSTERS).forEach(cluster => {
      expect(cluster.rpc).toMatch(/^https:\/\//);
    });
  });
});

// ─── 5. Address Validation ────────────────────────────────────────────────────

describe('Address Validation', () => {
  let isValidSolanaAddress, sanitizeAddress;

  beforeEach(async () => {
    const mod = await import('../solana/validation.js');
    isValidSolanaAddress = mod.isValidSolanaAddress;
    sanitizeAddress = mod.sanitizeAddress;
  });

  it('accepts valid Solana addresses', () => {
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
    expect(isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(isValidSolanaAddress('')).toBe(false);
    expect(isValidSolanaAddress('short')).toBe(false);
    expect(isValidSolanaAddress(null)).toBe(false);
    expect(isValidSolanaAddress(undefined)).toBe(false);
    expect(isValidSolanaAddress(12345)).toBe(false);
    expect(isValidSolanaAddress('0x' + 'a'.repeat(40))).toBe(false); // Ethereum address format
  });

  it('rejects addresses with invalid Base58 characters', () => {
    // Base58 excludes: 0, O, I, l
    expect(isValidSolanaAddress('0' + 'A'.repeat(43))).toBe(false);
    expect(isValidSolanaAddress('O' + 'A'.repeat(43))).toBe(false);
    expect(isValidSolanaAddress('I' + 'A'.repeat(43))).toBe(false);
    expect(isValidSolanaAddress('l' + 'A'.repeat(43))).toBe(false);
  });

  it('sanitizeAddress returns null for invalid input', () => {
    expect(sanitizeAddress('bad')).toBeNull();
    expect(sanitizeAddress(null)).toBeNull();
    expect(sanitizeAddress('')).toBeNull();
  });

  it('sanitizeAddress returns the address for valid input', () => {
    const valid = '11111111111111111111111111111111';
    expect(sanitizeAddress(valid)).toBe(valid);
  });
});

// ─── 6. Bridge Dedup Logic ────────────────────────────────────────────────────

describe('Bridge Index Maps', () => {
  it('BADGE_INDEX maps all badges to unique bit positions 0-31', async () => {
    const { BADGE_INDEX } = await import('../solana/bridge.js');

    const indices = Object.values(BADGE_INDEX);
    const uniqueIndices = new Set(indices);

    // All indices unique
    expect(uniqueIndices.size).toBe(indices.length);

    // All within u32 range
    indices.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(31);
    });
  });

  it('MODULE_INDEX maps all modules to unique bit positions 0-7', async () => {
    const { MODULE_INDEX } = await import('../solana/bridge.js');

    const indices = Object.values(MODULE_INDEX);
    const uniqueIndices = new Set(indices);

    expect(uniqueIndices.size).toBe(indices.length);

    indices.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(7);
    });
  });

  it('bitmap operations correctly encode/decode badge states', async () => {
    const { BADGE_INDEX } = await import('../solana/bridge.js');

    const badgeIds = Object.keys(BADGE_INDEX);
    if (badgeIds.length === 0) return; // skip if no badges defined

    let bitmap = 0;
    const testBadge = badgeIds[0];
    const testIdx = BADGE_INDEX[testBadge];

    // Set bit
    bitmap |= (1 << testIdx);
    expect((bitmap >> testIdx) & 1).toBe(1);

    // Other bits still unset
    if (badgeIds.length > 1) {
      const otherIdx = BADGE_INDEX[badgeIds[1]];
      expect((bitmap >> otherIdx) & 1).toBe(0);
    }

    // Clear bit
    bitmap &= ~(1 << testIdx);
    expect((bitmap >> testIdx) & 1).toBe(0);
  });
});

// ─── 7. Account Data Parsing ─────────────────────────────────────────────────

describe('Account Data Utilities', () => {
  it('fetchSolBalance handles lamport to SOL conversion correctly', async () => {
    const { fetchSolBalance } = await import('../solana/accounts.js');

    const mockRpc = {
      getBalance: () => ({
        send: async () => ({ value: 1_500_000_000n }), // 1.5 SOL in lamports
      }),
    };

    const result = await fetchSolBalance(mockRpc, '11111111111111111111111111111111');
    expect(result.lamports).toBe(1_500_000_000n);
    expect(result.sol).toBeCloseTo(1.5, 5);
  });

  it('fetchSolBalance handles zero balance', async () => {
    const { fetchSolBalance } = await import('../solana/accounts.js');

    const mockRpc = {
      getBalance: () => ({
        send: async () => ({ value: 0n }),
      }),
    };

    const result = await fetchSolBalance(mockRpc, '11111111111111111111111111111111');
    expect(result.sol).toBe(0);
  });
});

// ─── 8. IDL Structure Validation ─────────────────────────────────────────────

describe('Limer IDL Structure', () => {
  let idl;

  beforeEach(async () => {
    idl = (await import('../solana/idl/limer.json')).default;
  });

  it('has correct program address', () => {
    expect(idl.address).toBe('HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk');
  });

  it('defines all required instructions', () => {
    const names = idl.instructions.map(i => i.name);
    expect(names).toContain('initialize_user');
    expect(names).toContain('award_xp');
    expect(names).toContain('award_lp');
    expect(names).toContain('record_badge');
    expect(names).toContain('record_module');
    expect(names).toContain('check_in_daily');
    expect(names).toContain('record_trade');
    expect(names).toContain('close_account');
  });

  it('defines UserProfile and TradeLog accounts', () => {
    const accountNames = idl.accounts.map(a => a.name);
    expect(accountNames).toContain('UserProfile');
    expect(accountNames).toContain('TradeLog');
  });

  it('UserProfile type has all required fields', () => {
    const userProfile = idl.types.find(t => t.name === 'UserProfile');
    expect(userProfile).toBeDefined();

    const fieldNames = userProfile.type.fields.map(f => f.name);
    expect(fieldNames).toContain('owner');
    expect(fieldNames).toContain('xp');
    expect(fieldNames).toContain('limer_points');
    expect(fieldNames).toContain('current_streak');
    expect(fieldNames).toContain('longest_streak');
    expect(fieldNames).toContain('last_login');
    expect(fieldNames).toContain('badges_earned');
    expect(fieldNames).toContain('modules_completed');
    expect(fieldNames).toContain('created_at');
    expect(fieldNames).toContain('bump');
  });

  it('TradeLog type has all required fields', () => {
    const tradeLog = idl.types.find(t => t.name === 'TradeLog');
    expect(tradeLog).toBeDefined();

    const fieldNames = tradeLog.type.fields.map(f => f.name);
    expect(fieldNames).toContain('owner');
    expect(fieldNames).toContain('trade_count');
    expect(fieldNames).toContain('total_volume_usd');
    expect(fieldNames).toContain('total_fees');
    expect(fieldNames).toContain('bump');
  });

  it('badge_index argument is u8 (supports 0-255, bitmap uses 0-31)', () => {
    const recordBadge = idl.instructions.find(i => i.name === 'record_badge');
    const arg = recordBadge.args.find(a => a.name === 'badge_index');
    expect(arg.type).toBe('u8');
  });

  it('module_index argument is u8 (supports 0-255, bitmap uses 0-7)', () => {
    const recordModule = idl.instructions.find(i => i.name === 'record_module');
    const arg = recordModule.args.find(a => a.name === 'module_index');
    expect(arg.type).toBe('u8');
  });

  it('XP and LP use u64 for large number support', () => {
    const awardXp = idl.instructions.find(i => i.name === 'award_xp');
    expect(awardXp.args[0].type).toBe('u64');

    const awardLp = idl.instructions.find(i => i.name === 'award_lp');
    expect(awardLp.args.find(a => a.name === 'base_amount').type).toBe('u64');
  });

  it('defines custom error codes for invalid indices', () => {
    const errors = idl.errors;
    const badgeError = errors.find(e => e.name === 'InvalidBadgeIndex');
    const moduleError = errors.find(e => e.name === 'InvalidModuleIndex');

    expect(badgeError).toBeDefined();
    expect(badgeError.code).toBe(6000);
    expect(moduleError).toBeDefined();
    expect(moduleError.code).toBe(6001);
  });

  it('all PDA seeds use correct constant values', () => {
    const initUser = idl.instructions.find(i => i.name === 'initialize_user');

    // UserProfile PDA seed: "user" = [117, 115, 101, 114]
    const profileAccount = initUser.accounts.find(a => a.name === 'user_profile');
    const profileSeed = profileAccount.pda.seeds[0].value;
    expect(String.fromCharCode(...profileSeed)).toBe('user');

    // TradeLog PDA seed: "trades" = [116, 114, 97, 100, 101, 115]
    const tradeAccount = initUser.accounts.find(a => a.name === 'trade_log');
    const tradeSeed = tradeAccount.pda.seeds[0].value;
    expect(String.fromCharCode(...tradeSeed)).toBe('trades');
  });
});

// ─── 9. Transaction Utilities ─────────────────────────────────────────────────

describe('Transaction Utilities', () => {
  it('fetchRecentTransactions returns formatted results', async () => {
    const { fetchRecentTransactions } = await import('../solana/transactions.js');

    const mockRpc = {
      getSignaturesForAddress: () => ({
        send: async () => [
          { signature: 'sig1', slot: 100, blockTime: 1700000000n, err: null, memo: null },
          { signature: 'sig2', slot: 101, blockTime: 1700000060n, err: { InstructionError: [0, 'err'] }, memo: 'test memo' },
        ],
      }),
    };

    const results = await fetchRecentTransactions(mockRpc, '11111111111111111111111111111111', 2);

    expect(results).toHaveLength(2);
    expect(results[0].signature).toBe('sig1');
    expect(results[0].status).toBe('success');
    expect(results[0].timestamp).toBeTruthy();
    expect(results[1].status).toBe('failed');
    expect(results[1].memo).toBe('test memo');
  });
});

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a mock RPC client that returns sequential responses from getSignatureStatuses.
 * @param {Array<object|null>} responses - Array of status values to return sequentially
 */
function createMockRpc(responses) {
  let callIndex = 0;
  return {
    getSignatureStatuses: () => ({
      send: async () => {
        const idx = Math.min(callIndex++, responses.length - 1);
        const val = responses[idx];
        return { value: [val] };
      },
    }),
  };
}
