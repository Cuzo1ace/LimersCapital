/**
 * Quiz questions — answer keys are NOT included client-side; they are
 * validated via a server endpoint (the flagship uses a Cloudflare Worker).
 *
 * If you adopt this package, either:
 *   (a) deploy your own quiz-validation endpoint and wire `passingScore`
 *       into your reward loop, or
 *   (b) accept self-reported scores for non-critical rewards.
 *
 * Pre-publication staging — see note in `./modules.js`.
 */
export { QUIZZES } from '../../../src/data/quizzes.js';
