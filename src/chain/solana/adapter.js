/**
 * Solana Chain Adapter
 *
 * Implements the ChainAdapter interface by wrapping existing src/solana/ files.
 * This is a thin wrapper — all logic remains in the original files.
 *
 * No code was moved or deleted from src/solana/. This adapter provides a
 * chain-agnostic facade that the bridge and store can use, enabling future
 * multi-chain support by adding new adapters (e.g., src/chain/sui/adapter.js).
 */

import {
  CLUSTERS,
  DEFAULT_CLUSTER,
  createRpc,
  getExplorerUrl as getSolanaExplorerUrl,
  getAccountExplorerUrl,
  getTxExplorerUrl,
} from '../../solana/config';

import {
  getLimerProgramId,
  getLimerProgramReadOnly,
  getUserProfilePDA,
  getTradeLogPDA,
} from '../../solana/program';

import { makeAnchorWallet } from '../../solana/wallet-adapter';

export const SolanaAdapter = {
  // ── Identity ────────────────────────────────────────────
  getChainId: () => 'solana',
  getChainLabel: () => 'Solana',

  // ── Network ─────────────────────────────────────────────
  clusters: CLUSTERS,
  defaultCluster: DEFAULT_CLUSTER,

  createRpc: (cluster) => createRpc(cluster),

  // ── Wallet ──────────────────────────────────────────────
  makeWallet: (account) => makeAnchorWallet(account),

  // ── Program ─────────────────────────────────────────────
  getProgramId: () => getLimerProgramId(),

  // ── Data Fetching ───────────────────────────────────────
  fetchProfile: async (rpc, address) => {
    try {
      const program = await getLimerProgramReadOnly(rpc);
      if (!program) return null;
      // PDA derivation: seeds = ["user", owner_pubkey]
      const [pda] = getUserProfilePDA(address);
      const profile = await program.account.userProfile.fetchNullable(pda);
      return profile;
    } catch {
      return null;
    }
  },

  fetchTradeLog: async (rpc, address) => {
    try {
      const program = await getLimerProgramReadOnly(rpc);
      if (!program) return null;
      const [pda] = getTradeLogPDA(address);
      const tradeLog = await program.account.tradeLog.fetchNullable(pda);
      return tradeLog;
    } catch {
      return null;
    }
  },

  // ── Mutations ───────────────────────────────────────────
  createMutations: (wallet, cluster, queryClient) => {
    // Lazy import to avoid circular dependencies
    // The actual mutation hooks are in src/solana/mutations.js
    const { useLimerMutations } = require('../../solana/mutations');
    return useLimerMutations(wallet, cluster, queryClient);
  },

  // ── Explorer URLs ───────────────────────────────────────
  getExplorerUrl: (type, id, cluster) => {
    switch (type) {
      case 'account':
        return getAccountExplorerUrl(id, cluster);
      case 'tx':
      case 'transaction':
        return getTxExplorerUrl(id, cluster);
      default:
        return getSolanaExplorerUrl(cluster);
    }
  },
};
