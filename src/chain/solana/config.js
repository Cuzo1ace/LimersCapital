/**
 * Solana Chain Configuration — Re-exports
 *
 * Single source of truth remains in src/solana/config.js.
 * This file provides chain-scoped imports for consumers that
 * prefer the src/chain/solana/ path.
 */
export {
  CLUSTERS,
  DEFAULT_CLUSTER,
  createRpc,
  isRpcUrlTrusted,
  getExplorerUrl,
  getAccountExplorerUrl,
  getTxExplorerUrl,
} from '../../solana/config';
