/**
 * Transaction Confirmation Utilities
 *
 * Provides robust transaction confirmation with polling, timeout,
 * and status callbacks. Replaces fire-and-forget pattern in mutations.
 *
 * Design:
 * - Polls getSignatureStatuses at increasing intervals (500ms → 2s)
 * - Confirms at 'confirmed' commitment by default (not 'finalized' — too slow for UX)
 * - Returns full status object for UI feedback
 * - Times out after 30 seconds with clear error
 *
 * @see https://solana.com/docs/rpc/http/getsignaturestatuses
 */

const DEFAULT_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 800;
const MAX_POLL_INTERVAL_MS = 2_500;

/**
 * @typedef {Object} ConfirmationResult
 * @property {'confirmed'|'finalized'|'processed'} commitment
 * @property {string} signature
 * @property {number|null} slot
 * @property {object|null} err - Solana instruction error (null = success)
 * @property {number} elapsed - Milliseconds taken to confirm
 */

/**
 * Confirm a transaction signature with exponential polling.
 *
 * @param {object} rpc           @solana/kit RPC client
 * @param {string} signature     Base58 transaction signature
 * @param {object} [opts]
 * @param {'confirmed'|'finalized'} [opts.commitment='confirmed']
 * @param {number}  [opts.timeoutMs=30000]
 * @param {(status: string) => void} [opts.onStatusChange]  Optional callback for UI updates
 * @returns {Promise<ConfirmationResult>}
 */
export async function confirmTransaction(rpc, signature, opts = {}) {
  const {
    commitment = 'confirmed',
    timeoutMs = DEFAULT_TIMEOUT_MS,
    onStatusChange,
  } = opts;

  const startTime = Date.now();
  let pollInterval = POLL_INTERVAL_MS;
  let lastStatus = 'submitted';

  const updateStatus = (status) => {
    if (status !== lastStatus) {
      lastStatus = status;
      onStatusChange?.(status);
    }
  };

  updateStatus('confirming');

  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await rpc
        .getSignatureStatuses([signature], { searchTransactionHistory: false })
        .send();

      const status = result?.value?.[0];

      if (status) {
        // Check for on-chain error
        if (status.err) {
          updateStatus('failed');
          return {
            commitment: status.confirmationStatus || 'unknown',
            signature,
            slot: status.slot || null,
            err: status.err,
            elapsed: Date.now() - startTime,
          };
        }

        // Check if desired commitment level reached
        const confirmationStatus = status.confirmationStatus;
        if (
          confirmationStatus === commitment ||
          confirmationStatus === 'finalized' ||
          (commitment === 'confirmed' && confirmationStatus === 'finalized')
        ) {
          updateStatus('confirmed');
          return {
            commitment: confirmationStatus,
            signature,
            slot: status.slot || null,
            err: null,
            elapsed: Date.now() - startTime,
          };
        }

        // Transaction exists but not yet at desired commitment
        updateStatus(`processing (${confirmationStatus})`);
      }
    } catch (e) {
      // RPC errors during polling are transient — keep trying
      console.warn('[confirm] Poll error (retrying):', e?.message);
    }

    // Wait before next poll — increase interval gradually
    await sleep(pollInterval);
    pollInterval = Math.min(pollInterval * 1.3, MAX_POLL_INTERVAL_MS);
  }

  // Timed out
  updateStatus('timeout');
  throw new ConfirmationTimeoutError(signature, timeoutMs);
}

/**
 * Confirm a transaction or return null if it fails.
 * Useful for fire-and-forget patterns that still want logging.
 */
export async function confirmTransactionSafe(rpc, signature, opts = {}) {
  try {
    return await confirmTransaction(rpc, signature, opts);
  } catch (e) {
    console.warn('[confirm] Transaction confirmation failed:', e?.message, '| sig:', signature);
    return null;
  }
}

/**
 * Custom error for confirmation timeouts.
 */
export class ConfirmationTimeoutError extends Error {
  constructor(signature, timeoutMs) {
    super(`Transaction confirmation timed out after ${timeoutMs}ms. Signature: ${signature}`);
    this.name = 'ConfirmationTimeoutError';
    this.signature = signature;
    this.timeoutMs = timeoutMs;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
