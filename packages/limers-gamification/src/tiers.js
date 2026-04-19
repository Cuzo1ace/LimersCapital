/**
 * 10-tier progression system + getTier/getNextTier helpers.
 *
 * Pre-publication staging: the flagship's `src/data/gamification.js` remains
 * the working copy during the extraction sprint; this file re-exports it.
 * On first npm publish the data is copied here and the re-export is removed.
 */
export { TIERS, getTier, getNextTier } from '../../../src/data/gamification.js';
