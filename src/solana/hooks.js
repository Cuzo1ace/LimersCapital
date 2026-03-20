import { useQuery } from '@tanstack/react-query';
import { useSelectedWalletAccount } from '@solana/react';
import { useWallets } from '@wallet-standard/react';
import { useRpc } from './provider';
import { fetchSolBalance, fetchTokenAccounts } from './accounts';
import { fetchRecentTransactions } from './transactions';

// Re-export wallet hooks for convenience
export { useSelectedWalletAccount, useWallets };

// Get the currently selected wallet account
export function useWalletAddress() {
  const [selectedAccount] = useSelectedWalletAccount();
  return selectedAccount?.address || null;
}

// Get connection status
export function useWalletConnected() {
  const [selectedAccount] = useSelectedWalletAccount();
  return !!selectedAccount;
}

// Get the RPC client for the current cluster
export function useSolanaRpc() {
  return useRpc();
}

// ── On-chain data hooks (React Query) ────────────────────────

/**
 * Fetch real SOL balance for the connected wallet.
 * Auto-refreshes every 30 seconds.
 */
export function useWalletBalance(walletAddress) {
  const rpc = useRpc();

  return useQuery({
    queryKey: ['sol-balance', walletAddress],
    queryFn: () => fetchSolBalance(rpc, walletAddress),
    enabled: !!walletAddress && !!rpc,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: 2,
  });
}

/**
 * Fetch SPL token accounts for the connected wallet.
 * Auto-refreshes every 30 seconds.
 */
export function useTokenAccounts(walletAddress) {
  const rpc = useRpc();

  return useQuery({
    queryKey: ['token-accounts', walletAddress],
    queryFn: () => fetchTokenAccounts(rpc, walletAddress),
    enabled: !!walletAddress && !!rpc,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: 2,
  });
}

/**
 * Fetch recent on-chain transactions for the connected wallet.
 * Auto-refreshes every 30 seconds.
 */
export function useRecentTransactions(walletAddress) {
  const rpc = useRpc();

  return useQuery({
    queryKey: ['recent-txns', walletAddress],
    queryFn: () => fetchRecentTransactions(rpc, walletAddress),
    enabled: !!walletAddress && !!rpc,
    refetchInterval: 30_000,
    staleTime: 10_000,
    retry: 2,
  });
}

// ── Limer Program PDA hooks ─────────────────────────────────

import { getLimerProgramReadOnly, getUserProfilePDA, getTradeLogPDA } from './program';
import { PublicKey } from '@solana/web3.js';
import useStore from '../store/useStore';

/**
 * Fetch user's on-chain Limer profile (XP, LP, badges, streaks).
 * Uses Anchor's IDL-based deserializer — no hardcoded byte offsets.
 * Returns null if profile not yet initialized.
 */
export function useUserProfile(walletAddress) {
  const cluster = useStore((s) => s.cluster);

  return useQuery({
    queryKey: ['user-profile', walletAddress, cluster],
    queryFn: async () => {
      if (!walletAddress) return null;

      const program = await getLimerProgramReadOnly(cluster);
      if (!program) return null;

      const owner = new PublicKey(walletAddress);
      const [pda] = getUserProfilePDA(owner);

      try {
        const account = await program.account.userProfile.fetch(pda);
        return {
          address: pda.toBase58(),
          owner: account.owner.toBase58(),
          xp: account.xp.toNumber(),
          limerPoints: account.limerPoints.toNumber(),
          currentStreak: account.currentStreak,
          longestStreak: account.longestStreak,
          lastLogin: account.lastLogin.toNumber(),
          badgesEarned: account.badgesEarned,
          modulesCompleted: account.modulesCompleted,
          createdAt: account.createdAt.toNumber(),
          bump: account.bump,
          initialized: true,
        };
      } catch (e) {
        // Account does not exist = profile not yet initialized
        if (e?.message?.includes('Account does not exist') ||
            e?.message?.includes('could not find account')) {
          return null;
        }
        throw e;
      }
    },
    enabled: !!walletAddress,
    refetchInterval: 15_000,
    staleTime: 5_000,
    retry: 1,
  });
}

/**
 * Fetch user's on-chain trade log (count, volume, fees).
 * Uses Anchor's IDL-based deserializer — no hardcoded byte offsets.
 * Returns null if not yet initialized.
 */
export function useTradeLog(walletAddress) {
  const cluster = useStore((s) => s.cluster);

  return useQuery({
    queryKey: ['trade-log', walletAddress, cluster],
    queryFn: async () => {
      if (!walletAddress) return null;

      const program = await getLimerProgramReadOnly(cluster);
      if (!program) return null;

      const owner = new PublicKey(walletAddress);
      const [pda] = getTradeLogPDA(owner);

      try {
        const account = await program.account.tradeLog.fetch(pda);
        return {
          address: pda.toBase58(),
          owner: account.owner.toBase58(),
          tradeCount: account.tradeCount,
          totalVolumeUsd: account.totalVolumeUsd.toNumber(),
          totalFees: account.totalFees.toNumber(),
          bump: account.bump,
          initialized: true,
        };
      } catch (e) {
        if (e?.message?.includes('Account does not exist') ||
            e?.message?.includes('could not find account')) {
          return null;
        }
        throw e;
      }
    },
    enabled: !!walletAddress,
    refetchInterval: 15_000,
    staleTime: 5_000,
    retry: 1,
  });
}
