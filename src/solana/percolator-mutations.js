/**
 * Percolator Live Trading Mutations
 *
 * React Query mutation hooks for sending on-chain Percolator transactions.
 * Follows patterns from src/solana/mutations.js — useMutation with
 * confirmTransactionSafe() and query cache invalidation.
 *
 * Transaction signing uses wallet-standard signAndSendTransaction
 * (same pattern as JupiterSwap.jsx lines 135-143).
 *
 * All mutations are devnet-only for now.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmTransactionSafe } from './confirm';
import { createRpc } from './config';
import {
  buildTradeInstruction,
  buildDepositInstruction,
  buildWithdrawInstruction,
  getProgramId,
  getSDKInstance,
  PERCOLATOR_CONFIG,
} from './percolator';

/**
 * Hook providing all Percolator trading mutations.
 *
 * @param {object|null} walletAccount  Wallet-standard account (from useSelectedWalletAccount)
 * @param {object|null} connectedWallet  Full wallet object (from useWallets) with features
 * @param {string}      cluster        'devnet' | 'mainnet-beta'
 * @returns {{ initUser, depositCollateral, withdrawCollateral, openTrade, closeTrade }}
 */
export function usePercolatorMutations(walletAccount, connectedWallet, cluster = 'devnet') {
  const queryClient = useQueryClient();
  const walletAddress = walletAccount?.address || null;

  // RPC for confirmation polling
  const rpc = createRpc(cluster);

  /**
   * Sign and send a transaction via wallet-standard.
   * Returns base58 signature string.
   */
  async function signAndSend(txBytes) {
    if (!connectedWallet || !walletAccount) {
      throw new Error('Wallet not connected');
    }

    const signAndSendFeature = connectedWallet.features?.['solana:signAndSendTransaction'];
    if (!signAndSendFeature) {
      throw new Error('Wallet does not support signAndSendTransaction');
    }

    const result = await signAndSendFeature.signAndSendTransaction({
      transaction: txBytes,
      account: walletAccount,
    });

    // Decode signature to base58 string
    if (typeof result.signature === 'string') return result.signature;
    return Array.from(result.signature).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Confirm a transaction and invalidate slab cache.
   */
  async function confirmAndInvalidate(signature, action, slabPubkey) {
    const result = await confirmTransactionSafe(rpc, signature, {
      commitment: 'confirmed',
      timeoutMs: 30_000,
      onStatusChange: (status) => console.log(`[Percolator] ${action}: ${status}`),
    });

    if (result?.err) {
      throw new Error(`[Percolator] ${action} confirmed but failed on-chain: ${JSON.stringify(result.err)}`);
    }

    // Invalidate slab and user data
    if (slabPubkey) {
      queryClient.invalidateQueries({ queryKey: ['percolator-slab', slabPubkey] });
    }
    if (walletAddress) {
      queryClient.invalidateQueries({ queryKey: ['percolator-user', walletAddress] });
    }

    const elapsed = result?.elapsed ? ` (${result.elapsed}ms)` : '';
    console.log(`[Percolator] ${action} confirmed${elapsed}:`, signature);
    return signature;
  }

  function onError(error, action) {
    const msg = error?.message || String(error);
    // Map common Percolator errors to user-friendly messages
    if (msg.includes('User rejected')) {
      console.log(`[Percolator] ${action}: User cancelled transaction`);
      return;
    }
    if (msg.includes('InsufficientCollateral')) {
      console.warn(`[Percolator] ${action}: Insufficient collateral`);
      return;
    }
    if (msg.includes('SlippageExceeded')) {
      console.warn(`[Percolator] ${action}: Price moved beyond slippage tolerance`);
      return;
    }
    if (msg.includes('AdlTriggered')) {
      console.warn(`[Percolator] ${action}: Auto-deleveraging active — withdrawals blocked`);
      return;
    }
    console.warn(`[Percolator] ${action} failed:`, msg);
  }

  // ── Initialize User Account ──────────────────────────────

  const initUser = useMutation({
    mutationKey: ['percolator', 'initUser', walletAddress],
    mutationFn: async ({ slabPubkey }) => {
      if (!walletAddress) throw new Error('Wallet not connected');

      // Use the SDK wrapper from percolator.js (handles lazy loading)
      const sdk = await getSDKInstance();

      const ixData = sdk.encodeInitUser
        ? sdk.encodeInitUser()
        : new Uint8Array([0]); // Fallback: discriminator only

      const sig = await signAndSend(ixData);
      return confirmAndInvalidate(sig, 'initUser', slabPubkey);
    },
    onError: (e) => onError(e, 'initUser'),
  });

  // ── Deposit Collateral ───────────────────────────────────

  const depositCollateral = useMutation({
    mutationKey: ['percolator', 'deposit', walletAddress],
    mutationFn: async ({ amountE6, slabPubkey }) => {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (!amountE6 || amountE6 <= 0) throw new Error('Invalid deposit amount');

      const ixData = await buildDepositInstruction(amountE6);
      const sig = await signAndSend(ixData);
      return confirmAndInvalidate(sig, 'depositCollateral', slabPubkey);
    },
    onError: (e) => onError(e, 'depositCollateral'),
  });

  // ── Withdraw Collateral ──────────────────────────────────

  const withdrawCollateral = useMutation({
    mutationKey: ['percolator', 'withdraw', walletAddress],
    mutationFn: async ({ amountE6, slabPubkey, isAdl }) => {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (isAdl) throw new Error('Cannot withdraw during auto-deleveraging');
      if (!amountE6 || amountE6 <= 0) throw new Error('Invalid withdrawal amount');

      const ixData = await buildWithdrawInstruction(amountE6);
      const sig = await signAndSend(ixData);
      return confirmAndInvalidate(sig, 'withdrawCollateral', slabPubkey);
    },
    onError: (e) => onError(e, 'withdrawCollateral'),
  });

  // ── Open Trade ───────────────────────────────────────────

  const openTrade = useMutation({
    mutationKey: ['percolator', 'openTrade', walletAddress],
    mutationFn: async ({ userIdx, lpIdx, requestedSize, maxSlippage, slabPubkey }) => {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (userIdx == null) throw new Error('User account not initialized — deposit collateral first');

      const ixData = await buildTradeInstruction({
        userIdx,
        lpIdx: lpIdx || 0,
        requestedSize, // positive = long, negative = short (BigInt)
        maxSlippage: maxSlippage || PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS,
      });

      const sig = await signAndSend(ixData);
      return confirmAndInvalidate(sig, 'openTrade', slabPubkey);
    },
    onError: (e) => onError(e, 'openTrade'),
  });

  // ── Close Trade ──────────────────────────────────────────
  // Closing is the same instruction as opening but with negated size.
  // Supports partial close via fraction parameter.

  const closeTrade = useMutation({
    mutationKey: ['percolator', 'closeTrade', walletAddress],
    mutationFn: async ({ userIdx, lpIdx, currentSize, fraction, maxSlippage, slabPubkey }) => {
      if (!walletAddress) throw new Error('Wallet not connected');
      if (userIdx == null) throw new Error('User account not found');

      // Negate the size to close. fraction=1.0 = full close, 0.5 = half close.
      const closeFraction = fraction != null ? fraction : 1.0;
      const closeSize = -BigInt(Math.round(Number(currentSize) * closeFraction));

      const ixData = await buildTradeInstruction({
        userIdx,
        lpIdx: lpIdx || 0,
        requestedSize: closeSize,
        maxSlippage: maxSlippage || PERCOLATOR_CONFIG.DEFAULT_SLIPPAGE_BPS,
      });

      const sig = await signAndSend(ixData);
      return confirmAndInvalidate(sig, 'closeTrade', slabPubkey);
    },
    onError: (e) => onError(e, 'closeTrade'),
  });

  return {
    initUser,
    depositCollateral,
    withdrawCollateral,
    openTrade,
    closeTrade,
    // Status helpers
    isAnyPending: initUser.isPending || depositCollateral.isPending ||
      withdrawCollateral.isPending || openTrade.isPending || closeTrade.isPending,
  };
}

/**
 * Map Percolator error codes to user-friendly messages.
 * Used by TradePage for toast notifications.
 */
export function mapPercolatorError(error) {
  const msg = error?.message || String(error);

  if (msg.includes('User rejected') || msg.includes('user rejected')) {
    return null; // Silent — user cancelled
  }
  if (msg.includes('InsufficientCollateral')) {
    return 'Not enough collateral. Deposit more USDC to trade.';
  }
  if (msg.includes('SlippageExceeded')) {
    return 'Price moved too fast. Try again or increase slippage tolerance.';
  }
  if (msg.includes('AdlTriggered')) {
    return 'Market is in auto-deleveraging mode. Withdrawals temporarily blocked.';
  }
  if (msg.includes('AccountNotInitialized') || msg.includes('not initialized')) {
    return 'Account not set up yet. Click "Initialize Account" first.';
  }
  if (msg.includes('MaxPositionExceeded')) {
    return 'Position size exceeds market limits.';
  }
  if (msg.includes('timed out') || msg.includes('Timeout')) {
    return 'Transaction timed out. It may still confirm — check your wallet.';
  }
  if (msg.includes('Wallet not connected')) {
    return 'Connect your wallet to trade in live mode.';
  }

  return `Trade failed: ${msg.slice(0, 100)}`;
}
