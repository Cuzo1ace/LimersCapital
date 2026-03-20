import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getLimerProgram, getUserProfilePDA, getTradeLogPDA } from './program';

/**
 * Hook that provides all Limer program mutations.
 * Follows the Solana Journal dApp pattern — React Query mutations with wallet signing.
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

  // Invalidate cached PDA data after any mutation succeeds
  function onSuccess(signature) {
    if (owner) {
      const key = owner.toBase58();
      queryClient.invalidateQueries({ queryKey: ['user-profile', key] });
      queryClient.invalidateQueries({ queryKey: ['trade-log', key] });
    }
    console.log('[Limer] tx confirmed:', signature);
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

      return program.methods
        .initializeUser()
        .accounts({
          userProfile: userProfilePDA,
          tradeLog: tradeLogPDA,
          owner,
          systemProgram: PublicKey.default,
        })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'initializeUser'),
  });

  // ── Award XP ──────────────────────────────────────────────

  const awardXP = useMutation({
    mutationKey: ['limer', 'awardXP', owner?.toBase58()],
    mutationFn: async (amount) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      return program.methods
        .awardXp(new BN(amount))
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'awardXP'),
  });

  // ── Award Limer Points ────────────────────────────────────

  const awardLP = useMutation({
    mutationKey: ['limer', 'awardLP', owner?.toBase58()],
    mutationFn: async ({ baseAmount, multiplierPct }) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      return program.methods
        .awardLp(new BN(baseAmount), multiplierPct)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'awardLP'),
  });

  // ── Record Badge ──────────────────────────────────────────

  const recordBadge = useMutation({
    mutationKey: ['limer', 'recordBadge', owner?.toBase58()],
    mutationFn: async (badgeIndex) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      return program.methods
        .recordBadge(badgeIndex)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'recordBadge'),
  });

  // ── Record Module Completion ──────────────────────────────

  const recordModule = useMutation({
    mutationKey: ['limer', 'recordModule', owner?.toBase58()],
    mutationFn: async (moduleIndex) => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      return program.methods
        .recordModule(moduleIndex)
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'recordModule'),
  });

  // ── Daily Check-In ────────────────────────────────────────

  const dailyCheckIn = useMutation({
    mutationKey: ['limer', 'dailyCheckIn', owner?.toBase58()],
    mutationFn: async () => {
      const program = await getProgram();
      const [userProfilePDA] = getUserProfilePDA(owner);

      return program.methods
        .checkInDaily()
        .accounts({ userProfile: userProfilePDA, owner })
        .rpc();
    },
    onSuccess,
    onError: (e) => onError(e, 'dailyCheckIn'),
  });

  // ── Record Trade ──────────────────────────────────────────

  const recordTrade = useMutation({
    mutationKey: ['limer', 'recordTrade', owner?.toBase58()],
    mutationFn: async ({ volumeUsd, feeAmount }) => {
      const program = await getProgram();
      const [tradeLogPDA] = getTradeLogPDA(owner);

      return program.methods
        .recordTrade(new BN(volumeUsd), new BN(feeAmount))
        .accounts({ tradeLog: tradeLogPDA, owner })
        .rpc();
    },
    onSuccess,
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
