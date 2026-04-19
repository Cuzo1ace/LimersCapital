/**
 * @limers/gamification
 *
 * A production-tested reward loop extracted from Limer's Capital — XP,
 * tiers, badges, LP multipliers, and leaderboard helpers as pure
 * framework-agnostic functions.
 *
 * Typical integration:
 *
 *   import { getTier, XP_VALUES, BADGES, getLPMultiplier } from '@limers/gamification';
 *
 *   // 1. Award XP on an event
 *   store.xp += XP_VALUES.lessonRead;
 *
 *   // 2. Derive the current tier
 *   const tier = getTier(store.xp);
 *
 *   // 3. Compute effective LP (loyalty points) with tier boost
 *   const multiplier = getLPMultiplier(tier.level);
 *   store.lp += 10 * multiplier;
 *
 *   // 4. Re-check badge unlocks after state change
 *   const newlyEarned = BADGES.filter(b =>
 *     !store.earnedBadges.includes(b.id) && b.check(store)
 *   );
 *
 * Pairs naturally with @limers/curriculum — module completions feed XP,
 * feature unlocks from MODULES[].unlocks map to FEATURE_KEYS.
 */

export { TIERS, getTier, getNextTier } from './tiers.js';
export { XP_VALUES } from './xp.js';
export {
  LP_MULTIPLIERS,
  getLPMultiplier,
  LP_ACTIONS,
  generateLeaderboard,
  AIRDROP_POOL,
  SIMULATED_TOTAL_LP,
} from './lp.js';
export { BADGES } from './badges.js';
export { FEATURE_KEYS } from './features.js';
export { GAMIFICATION_SCHEMA_VERSION } from './schema.js';
