/**
 * Canonical feature-unlock keys. Modules in `@limers/curriculum` reference
 * these via `module.unlocks[]`. Consuming apps use them as gate-keys to
 * reveal features (spot trading, limit orders, advanced analytics, etc.)
 * once the user completes the requisite module.
 *
 * Rename freely in your own app; these are opinionated defaults for the
 * Limer's curriculum.
 */
export { FEATURE_KEYS } from '../../../src/data/gamification.js';
