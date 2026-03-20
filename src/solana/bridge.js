/**
 * Limer Bridge — Zustand ↔ On-Chain sync
 *
 * This reactive hook watches specific local state slices and fires Anchor
 * mutations when they change — bridging Zustand (UI source-of-truth) to
 * the Limer program PDAs (persistence layer).
 *
 * Design principles:
 * - Local state updates are instant (no waiting for tx)
 * - On-chain mutations are fire-and-forget (errors logged, UI unaffected)
 * - We compare local vs on-chain bitmaps so we never double-record
 * - XP/LP deltas are tracked per-session to avoid re-sending old totals
 *
 * What syncs on-chain:
 *   Badge earned     → recordBadge(index)
 *   Module complete  → recordModule(index)
 *   Trade executed   → recordTrade(volume, fee)
 *   Daily check-in   → checkInDaily()
 *   (XP/LP are aggregates tracked locally; major milestones sync via badge/module/trade)
 */
import { useEffect, useRef, useMemo } from 'react';
import { useSelectedWalletAccount } from '@solana/react';
import { useQueryClient } from '@tanstack/react-query';
import useStore from '../store/useStore';
import { makeAnchorWallet } from './wallet-adapter';
import { useLimerMutations } from './mutations';
import { useUserProfile, useTradeLog } from './hooks';
import { BADGES } from '../data/badges';
import { MODULES } from '../data/modules';

// ── Index maps ─────────────────────────────────────────────────
// Badge ID string → bitmap bit position (0-31)
export const BADGE_INDEX = Object.fromEntries(BADGES.map((b, i) => [b.id, i]));

// Module ID string → bitmap bit position (0-7)
export const MODULE_INDEX = Object.fromEntries(MODULES.map((m, i) => [m.id, i]));

// ── Main bridge hook ───────────────────────────────────────────

/**
 * Mount inside the React tree. Watches Zustand state and syncs
 * milestone events to the on-chain Limer program via wallet-signed txs.
 */
export function useLimerBridge() {
  const [selectedAccount] = useSelectedWalletAccount();
  const cluster = useStore((s) => s.cluster);

  // Adapt wallet-standard account → Anchor-compatible wallet
  const wallet = useMemo(() => makeAnchorWallet(selectedAccount), [selectedAccount]);

  const mutations = useLimerMutations(wallet, cluster);

  // On-chain state (null if wallet disconnected or profile not initialized)
  const address = selectedAccount?.address || null;
  const { data: onChainProfile } = useUserProfile(address);
  const { data: onChainTradeLog } = useTradeLog(address);

  // Local state slices we watch
  const earnedBadges = useStore((s) => s.earnedBadges);
  const modulesCompleted = useStore((s) => s.modulesCompleted);
  const trades = useStore((s) => s.trades);
  const lastLoginDate = useStore((s) => s.lastLoginDate);

  // Per-session tracking — prevents re-syncing things already on-chain
  // or already queued during this browser session.
  const queued = useRef({
    badges: new Set(),      // badge IDs we've sent recordBadge for this session
    modules: new Set(),     // module IDs we've sent recordModule for this session
    tradeCount: null,       // last trade count we sent recordTrade for
    checkedInDate: null,    // last date we sent checkInDaily for
  });

  // Reset session tracking when wallet changes
  useEffect(() => {
    queued.current = {
      badges: new Set(),
      modules: new Set(),
      tradeCount: null,
      checkedInDate: null,
    };
  }, [address]);

  // ── Badge sync ────────────────────────────────────────────────
  // When a new badge is earned locally, record it on-chain if not already in bitmap.
  useEffect(() => {
    if (!wallet || !onChainProfile) return;

    const bitmap = onChainProfile.badgesEarned; // u32 from on-chain

    earnedBadges.forEach((badgeId) => {
      const idx = BADGE_INDEX[badgeId];
      if (idx === undefined) return;

      const alreadyOnChain = Boolean((bitmap >> idx) & 1);
      const alreadyQueued = queued.current.badges.has(badgeId);

      if (!alreadyOnChain && !alreadyQueued) {
        queued.current.badges.add(badgeId);
        mutations.recordBadge.mutateAsync(idx).catch((e) => {
          queued.current.badges.delete(badgeId); // allow retry next render
          console.warn('[Bridge] recordBadge failed:', e?.message);
        });
      }
    });
  }, [earnedBadges, onChainProfile, wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Module sync ───────────────────────────────────────────────
  // When a module is completed locally, record it on-chain if not already in bitmap.
  useEffect(() => {
    if (!wallet || !onChainProfile) return;

    const bitmap = onChainProfile.modulesCompleted; // u8 from on-chain

    modulesCompleted.forEach((moduleId) => {
      const idx = MODULE_INDEX[moduleId];
      if (idx === undefined) return;

      const alreadyOnChain = Boolean((bitmap >> idx) & 1);
      const alreadyQueued = queued.current.modules.has(moduleId);

      if (!alreadyOnChain && !alreadyQueued) {
        queued.current.modules.add(moduleId);
        mutations.recordModule.mutateAsync(idx).catch((e) => {
          queued.current.modules.delete(moduleId);
          console.warn('[Bridge] recordModule failed:', e?.message);
        });
      }
    });
  }, [modulesCompleted, onChainProfile, wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trade sync ────────────────────────────────────────────────
  // When a new trade is executed locally, record it on-chain.
  // We track the last trade count we sent so we only send NEW trades.
  useEffect(() => {
    if (!wallet || !onChainTradeLog) return;

    const localCount = trades.length;
    const onChainCount = onChainTradeLog.tradeCount;

    // Initialize session baseline from on-chain count on first run
    if (queued.current.tradeCount === null) {
      queued.current.tradeCount = onChainCount;
      return;
    }

    // Only process trades that are new since last sync
    const lastQueued = queued.current.tradeCount;
    if (localCount <= lastQueued) return;

    // trades[] is newest-first; slice the front to get new trades, then reverse
    // so on-chain records arrive in chronological (oldest-first) order.
    const newTrades = trades.slice(0, localCount - lastQueued).reverse();
    queued.current.tradeCount = localCount;

    newTrades.forEach((trade) => {
      const volumeUsd = Math.round(Math.abs(trade.total));
      const feeAmount = Math.round(volumeUsd * 0.003);
      mutations.recordTrade.mutateAsync({ volumeUsd, feeAmount }).catch((e) => {
        console.warn('[Bridge] recordTrade failed:', e?.message);
      });
    });
  }, [trades, onChainTradeLog, wallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Daily check-in sync ───────────────────────────────────────
  // When the local daily streak updates (new day), call checkInDaily on-chain.
  useEffect(() => {
    if (!wallet || !onChainProfile) return;
    if (!lastLoginDate) return;

    const alreadySent = queued.current.checkedInDate === lastLoginDate;
    if (alreadySent) return;

    // Check if on-chain last_login is from a different day
    const onChainDate = onChainProfile.lastLogin
      ? new Date(onChainProfile.lastLogin * 1000).toISOString().split('T')[0]
      : null;

    if (onChainDate === lastLoginDate) return; // already checked in on-chain today

    queued.current.checkedInDate = lastLoginDate;
    mutations.dailyCheckIn.mutateAsync().catch((e) => {
      queued.current.checkedInDate = null; // retry next time
      console.warn('[Bridge] dailyCheckIn failed:', e?.message);
    });
  }, [lastLoginDate, onChainProfile, wallet]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Expose mutations for use in components (e.g., "Initialize Profile" button).
 * Returns null when wallet is not connected.
 */
export function useLimerActions() {
  const [selectedAccount] = useSelectedWalletAccount();
  const cluster = useStore((s) => s.cluster);
  const wallet = useMemo(() => makeAnchorWallet(selectedAccount), [selectedAccount]);
  return useLimerMutations(wallet, cluster);
}
