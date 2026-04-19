/**
 * 40+ badge definitions with pure `check(state)` predicates.
 *
 * The default predicates expect a `StateSnapshot` shape (see `./schema.js`).
 * In your app:
 *
 *   import { BADGES } from '@limers/gamification/badges';
 *   const earned = BADGES.filter((b) => b.check(myStateSnapshot));
 *
 * Each badge carries `{ id, title, desc, icon, cat, check }`. Keep your
 * persisted `earnedBadges: string[]` list distinct from runtime re-checks
 * so newly-added badges can back-fill on app upgrade.
 *
 * Feel free to filter or override individual badges — the array shape is
 * intentionally flat so it composes cleanly.
 */
export { BADGES } from '../../../src/data/badges.js';
