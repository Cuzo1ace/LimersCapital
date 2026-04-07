import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BN } from '@anchor-lang/core';
import { PublicKey } from '@solana/web3.js';
import { getLimerProgram, getUserProfilePDA, getTradeLogPDA } from './program';
import { confirmTransactionSafe } from './confirm';
import { createRpc } from './config';

/**
 * Hook that provides all Limer program mutations.
 * Follows the Solana Journal dApp pattern — React Query mutations with wallet signing.
 * All mutations now include transaction confirmation polling for safety.
 *
 * @param {object|null} wallet  AnchorProvider-compatible wallet (from makeAnchorWallet)
 * @param {string}      cluster 'devnet' | 'mainnet-beta'
 *
 * Usage:
 *   const { initializeUser, awardXP, recordBadge, dailyCheckIn, recordTrade } = useLimerMutations(wallet, cluster);
 *   await initializeUser.mutateAsync();
 */
export function useLimerMutations(wallet, cluster) {
  const queryClient = useQueryClient();
  const owner = wallet?.publicKey;

  // Shared RPC for confirmation polling (read-only, no wallet needed)
  const rpc = createRpc(cluster);

  /**
   * Confirm a transaction after sending, then invalidate caches.
   * Returns the confirmation result for logging.
   */
  async function confirmAndInvalidate(signature, action) {
    const result = await confirmTransactionSafe(rpc, signature, {
      commitment: 'confirmed',
      timeoutMs: 30_000,
      onStatusChange: (status) => console.log(`[Limer] ${action}: ${status}`),
    });

    if (result?.err) {
      throw new Error(`[Limer] ${action} confirmed but failed on-chain: ${JSON.stringify(result.err)}`);
    }

    if (owner) {
      const key = owner.toBase58();
      queryClient.invalidateQueries({ queryKey: ['user-profile', key] });
      queryClient.invalidateQueries({ queryKey: ['trade-log', key] });
    }

    const elapsed = result?.elapsed ? ` (${result.elapsed}ms)` : '';
    console.log(`[Limer] ${action} confirmed${elapsed}:`, signature);
    return signature;
  }

  function onError(error, action) {
    console.warn(`[Limer] ${action} failed:`, error?.message || error);
  }

  // Helper: get program instance inside a mutationFn (getLimerProgram is async)
  async function getProgram() {
    if (!wallet || !owner) throw new Error('Wallet not connected');
    const program = await getLimerProgram(wallet, cluster);
    if (!program) throw new Error('Limer program unavailable — IDL not found');
    return program;
  }

  // ── Initialize User Profile + TradeLog ────────────────────

  const initializeUser = useMutation({
    mutationKey: ['limer', 'initializeUser', owner?.toBase58()],
    mutationFn: async () => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);
      const [tradeLogPDA] = getTradeLogPDA(owner);

      const sig = await program.methods
        .initializeUser()
        .accounts({
          userProfile: userProfilePDA,
          tradeLog: tradeLogPDA,
          owner,
          systemProgram: PublicKey.default,
        })
        .rpc();
      return confirmAndInvalidate(sig, 'initializeUser');
    },
    onError: (e) => onError(e, 'initializeUser'),
  });

  // ── Award XP ──────────────────────────────────────────────

  const awardXP = useMutation({
    mutationKey: ['limer', 'awardXP', owner?.toBase58()],
    mutationFn: async (amount) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      const sig = await program.methods
        .awardXp(new BN(amount))
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'awardXP');
    },
    onError: (e) => onError(e, 'awardXP'),
  });

  // ── Award Limer Points ────────────────────────────────────

  const awardLP = useMutation({
    mutationKey: ['limer', 'awardLP', owner?.toBase58()],
    mutationFn: async ({ baseAmount, multiplierPct }) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      const sig = await program.methods
        .awardLp(new BN(baseAmount), multiplierPct)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'awardLP');
    },
    onError: (e) => onError(e, 'awardLP'),
  });

  // ── Record Badge ──────────────────────────────────────────

  const recordBadge = useMutation({
    mutationKey: ['limer', 'recordBadge', owner?.toBase58()],
    mutationFn: async (badgeIndex) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      const sig = await program.methods
        .recordBadge(badgeIndex)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'recordBadge');
    },
    onError: (e) => onError(e, 'recordBadge'),
  });

  // ── Record Module Completion ──────────────────────────────

  const recordModule = useMutation({
    mutationKey: ['limer', 'recordModule', owner?.toBase58()],
    mutationFn: async (moduleIndex) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      const sig = await program.methods
        .recordModule(moduleIndex)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'recordModule');
    },
    onError: (e) => onError(e, 'recordModule'),
  });

  // ── Daily Check-In ────────────────────────────────────────

  const dailyCheckIn = useMutation({
    mutationKey: ['limer', 'dailyCheckIn', owner?.toBase58()],
    mutationFn: async () => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      const sig = await program.methods
        .checkInDaily()
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'dailyCheckIn');
    },
    onError: (e) => onError(e, 'dailyCheckIn'),
  });

  // ── Record Trade ──────────────────────────────────────────

  const recordTrade = useMutation({
    mutationKey: ['limer', 'recordTrade', owner?.toBase58()],
    mutationFn: async ({ volumeUsd, feeAmount }) => {
      const program = await getProgram();
      const [tradeLogPDA] = getTradeLogPDA(owner);

      const sig = await program.methods
        .recordTrade(new BN(volumeUsd), new BN(feeAmount))
        .accounts({ tradeLog: tradeLogPDA, owner })
        .rpc();
      return confirmAndInvalidate(sig, 'recordTrade');
    },
    onError: (e) => onError(e, 'recordTrade'),
  });

  return {
    initializeUser,
    awardXP,
    awardLP,
    recordBadge,
    recordModule,
    dailyCheckIn,
    recordTrade,
  };
}
