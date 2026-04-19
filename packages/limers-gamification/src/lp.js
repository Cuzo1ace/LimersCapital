/**
 * Limer Points — the "loyalty points with an airdrop" layer.
 *
 * Exports:
 *   LP_MULTIPLIERS           — tier level → multiplier (1.0×..5.0×)
 *   getLPMultiplier(level)   — safe lookup with 1.0 fallback
 *   LP_ACTIONS               — catalog of actions that earn LP (for docs / UI)
 *   generateLeaderboard(userLP, userName?)
 *                           — deterministic fake leaderboard for demo builds
 *                             before you wire a real backend
 *   AIRDROP_POOL, SIMULATED_TOTAL_LP
 *                           — opinionated constants used in the flagship's
 *                             airdrop-share calculator
 *
 * The leaderboard is deterministic (seeded sine) so the demo shows
 * believable positioning without a server. Replace with your own ranking
 * API before shipping production.
 */
export {
  LP_MULTIPLIERS,
  getLPMultiplier,
  LP_ACTIONS,
  generateLeaderboard,
  AIRDROP_POOL,
  SIMULATED_TOTAL_LP,
} from '../../../src/data/lp.js';
