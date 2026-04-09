/**
 * ChainAdapter Interface
 *
 * Any blockchain implementation must export an object conforming to this shape.
 * The interface isolates chain-specific code so the app can support multiple
 * chains by swapping adapters without modifying business logic.
 *
 * Current implementation: Solana (src/chain/solana/adapter.js)
 * Future: Sui, Ethereum, or any chain with smart contract support
 *
 * @typedef {Object} ChainAdapter
 * @property {() => string} getChainId - Unique chain identifier ('solana', 'sui', 'ethereum')
 * @property {() => string} getChainLabel - Human-readable chain name ('Solana', 'Sui', 'Ethereum')
 * @property {(cluster: string) => object} createRpc - Create an RPC client for the given cluster
 * @property {(account: object) => object} makeWallet - Convert wallet-standard account to chain-compatible wallet
 * @property {() => string} getProgramId - Get the on-chain program address
 * @property {(rpc: object, address: string) => Promise<object|null>} fetchProfile - Fetch user profile from chain
 * @property {(rpc: object, address: string) => Promise<object|null>} fetchTradeLog - Fetch trade log from chain
 * @property {(wallet: object, cluster: string, queryClient: object) => object} createMutations - Create mutation hooks
 * @property {(type: string, id: string, cluster: string) => string} getExplorerUrl - Build explorer URL
 * @property {object} clusters - Available clusters/networks
 * @property {string} defaultCluster - Default cluster to connect to
 */

/**
 * Required methods every ChainAdapter must implement.
 */
const REQUIRED_METHODS = [
  'getChainId',
  'getChainLabel',
  'createRpc',
  'makeWallet',
  'getProgramId',
  'fetchProfile',
  'fetchTradeLog',
  'createMutations',
  'getExplorerUrl',
];

const REQUIRED_PROPERTIES = ['clusters', 'defaultCluster'];

/**
 * Validates that an adapter implements the ChainAdapter interface.
 *
 * @param {object} adapter - The adapter to validate
 * @returns {boolean} true if valid
 * @throws {Error} if validation fails with details about missing methods/properties
 */
export function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('ChainAdapter must be a non-null object');
  }

  const missingMethods = REQUIRED_METHODS.filter(
    method => typeof adapter[method] !== 'function'
  );

  const missingProps = REQUIRED_PROPERTIES.filter(
    prop => adapter[prop] === undefined
  );

  const missing = [...missingMethods, ...missingProps];

  if (missing.length > 0) {
    throw new Error(
      `ChainAdapter is missing required members: ${missing.join(', ')}`
    );
  }

  // Verify getChainId returns a non-empty string
  const chainId = adapter.getChainId();
  if (typeof chainId !== 'string' || chainId.length === 0) {
    throw new Error('getChainId() must return a non-empty string');
  }

  return true;
}
