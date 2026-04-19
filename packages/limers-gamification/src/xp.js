/**
 * XP reward values for common learn-to-earn and trading actions.
 * Callers award XP by adding these values to a running counter and then
 * re-deriving the user's Tier via `@limers/gamification/tiers` getTier().
 */
export { XP_VALUES } from '../../../src/data/gamification.js';
