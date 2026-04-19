/**
 * @limers/curriculum
 *
 * A ready-to-drop crypto/DeFi learning curriculum used by Limer's Capital in
 * production: 8 modules, 37+ lessons, 8 quizzes, organized into three
 * progression tiers (Basics → Intermediate → Advanced) and covering
 * wallets, on-chain fundamentals, Solana ecosystem, LP strategy, security,
 * and ownership economics.
 *
 * See `./schema.js` for the Level / Module / Lesson / Quiz shapes and
 * the README for usage patterns. Pair with @limers/gamification for the
 * XP / badge / streak reward loop that turns content into a learn-to-earn
 * product.
 */

export { LEVELS, LEVEL_ORDER, MODULES } from './modules.js';
export { LESSONS } from './lessons.js';
export { QUIZZES } from './quizzes.js';
export { CURRICULUM_SCHEMA_VERSION } from './schema.js';
