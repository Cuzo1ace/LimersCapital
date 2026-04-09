/**
 * Chain Registry
 *
 * Central registry of all supported blockchain adapters.
 * Currently only Solana is supported. To add a new chain:
 *
 * 1. Create src/chain/<chainName>/adapter.js implementing the ChainAdapter interface
 * 2. Import and register it in the CHAINS object below
 * 3. The rest of the app (bridge, store, UI) automatically picks it up
 */

import { SolanaAdapter } from './solana/adapter';

const CHAINS = {
  solana: SolanaAdapter,
};

/**
 * Get a chain adapter by ID.
 *
 * @param {string} chainId - Chain identifier (default: 'solana')
 * @returns {ChainAdapter} The adapter for the specified chain
 * @throws {Error} If the chain is not registered
 */
export function getChainAdapter(chainId = 'solana') {
  const adapter = CHAINS[chainId];
  if (!adapter) {
    throw new Error(
      `Unknown chain: "${chainId}". Available chains: ${Object.keys(CHAINS).join(', ')}`
    );
  }
  return adapter;
}

/**
 * List all available chains.
 *
 * @returns {Array<{id: string, label: string}>} Available chains with human-readable labels
 */
export function getAvailableChains() {
  return Object.entries(CHAINS).map(([id, adapter]) => ({
    id,
    label: adapter.getChainLabel(),
  }));
}

export { SolanaAdapter } from './solana/adapter';
