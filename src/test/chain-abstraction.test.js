import { describe, it, expect } from 'vitest';
import { validateAdapter } from '../chain/interface';
import { getChainAdapter, getAvailableChains, SolanaAdapter } from '../chain';

describe('Chain Interface - validateAdapter', () => {
  it('should validate the Solana adapter', () => {
    expect(validateAdapter(SolanaAdapter)).toBe(true);
  });

  it('should reject null', () => {
    expect(() => validateAdapter(null)).toThrow('non-null object');
  });

  it('should reject empty object', () => {
    expect(() => validateAdapter({})).toThrow('missing required members');
  });

  it('should reject adapter with missing methods', () => {
    const partial = {
      getChainId: () => 'test',
      getChainLabel: () => 'Test',
      clusters: {},
      defaultCluster: 'devnet',
      // Missing: createRpc, makeWallet, getProgramId, fetchProfile, fetchTradeLog, createMutations, getExplorerUrl
    };
    expect(() => validateAdapter(partial)).toThrow('missing required members');
  });
});

describe('Chain Registry - getChainAdapter', () => {
  it('should return SolanaAdapter for "solana"', () => {
    const adapter = getChainAdapter('solana');
    expect(adapter).toBe(SolanaAdapter);
  });

  it('should default to solana when no argument given', () => {
    const adapter = getChainAdapter();
    expect(adapter).toBe(SolanaAdapter);
  });

  it('should throw for unknown chain', () => {
    expect(() => getChainAdapter('nonexistent')).toThrow('Unknown chain');
    expect(() => getChainAdapter('nonexistent')).toThrow('nonexistent');
  });

  it('should include available chains in error message', () => {
    expect(() => getChainAdapter('ethereum')).toThrow('solana');
  });
});

describe('Chain Registry - getAvailableChains', () => {
  it('should return an array', () => {
    const chains = getAvailableChains();
    expect(Array.isArray(chains)).toBe(true);
  });

  it('should include solana', () => {
    const chains = getAvailableChains();
    const solana = chains.find(c => c.id === 'solana');
    expect(solana).toBeDefined();
    expect(solana.label).toBe('Solana');
  });

  it('each chain should have id and label', () => {
    const chains = getAvailableChains();
    chains.forEach(chain => {
      expect(chain).toHaveProperty('id');
      expect(chain).toHaveProperty('label');
      expect(typeof chain.id).toBe('string');
      expect(typeof chain.label).toBe('string');
    });
  });
});

describe('SolanaAdapter - Identity', () => {
  it('should return "solana" as chain ID', () => {
    expect(SolanaAdapter.getChainId()).toBe('solana');
  });

  it('should return "Solana" as chain label', () => {
    expect(SolanaAdapter.getChainLabel()).toBe('Solana');
  });

  it('should have clusters defined', () => {
    expect(SolanaAdapter.clusters).toBeDefined();
    expect(typeof SolanaAdapter.clusters).toBe('object');
  });

  it('should have a default cluster', () => {
    expect(SolanaAdapter.defaultCluster).toBeDefined();
    expect(typeof SolanaAdapter.defaultCluster).toBe('string');
  });

  it('should have all required methods as functions', () => {
    const methods = ['createRpc', 'makeWallet', 'getProgramId', 'fetchProfile', 'fetchTradeLog', 'createMutations', 'getExplorerUrl'];
    methods.forEach(method => {
      expect(typeof SolanaAdapter[method]).toBe('function');
    });
  });
});
