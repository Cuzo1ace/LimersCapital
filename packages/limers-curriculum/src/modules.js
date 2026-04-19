/**
 * Module + Level definitions.
 *
 * Pre-publication staging layout: during the Limer's Capital extraction sprint,
 * the flagship repo's `src/data/modules.js` is the working copy. This package
 * re-exports it so package consumers and workspace tooling can resolve the
 * symbols via the published path. On first npm publish, the data is copied
 * here and this re-export is removed.
 */
export { LEVELS, LEVEL_ORDER, MODULES } from '../../../src/data/modules.js';
