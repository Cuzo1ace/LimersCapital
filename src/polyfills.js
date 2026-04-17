/**
 * Browser polyfills for Node.js globals that Solana libs expect.
 *
 * MUST be imported BEFORE any Solana library (@solana/web3.js,
 * @solana/spl-token, @coral-xyz/anchor, etc). In `src/main.jsx` this
 * file is imported on line 1 specifically so its side effects execute
 * before App and its Solana-dependent children are loaded.
 *
 * Why this exists
 * ───────────────
 * `@solana/spl-token` and `@solana/web3.js` call `Buffer.from(...)` at
 * module scope during their initialization. Vite externalizes Node's
 * `buffer` module for browser builds, but SPL-token expects `Buffer`
 * on the global scope. Without this polyfill the app crashes with:
 *
 *   Uncaught ReferenceError: Buffer is not defined
 *     at @solana/spl-token...
 *
 * The older parts of the app use `@solana/kit` which does NOT depend
 * on Buffer, which is why this only surfaced when the AMM code pulled
 * in @solana/web3.js + @solana/spl-token.
 *
 * ESM semantics note
 * ──────────────────
 * Static ES imports in a module are hoisted — all imports resolve
 * first, then the top-level statements run. To get the Buffer
 * assignment to happen BEFORE downstream Solana imports, it must live
 * in its own module that is imported first. A `globalThis.Buffer = …`
 * line in main.jsx itself would run too late (after App's transitive
 * imports are fully resolved and Solana module bodies have executed).
 */

import { Buffer } from 'buffer';

// Expose Buffer on both window and globalThis — web3.js checks both.
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

// Some libs (notably @solana/web3.js) also look for `process.env.NODE_ENV`
// during runtime capability detection. Provide a minimal stub so those
// accesses do not throw in Workers-lite / stripped browser environments.
if (typeof globalThis !== 'undefined' && typeof globalThis.process === 'undefined') {
  globalThis.process = { env: { NODE_ENV: import.meta.env?.MODE || 'production' } };
}
