// Base58 character set (no 0, O, I, l)
const BASE58_CHARS = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

/**
 * Validates a Solana address format.
 * Solana addresses are base58-encoded ed25519 public keys (32 bytes = 32-44 base58 chars).
 */
export function isValidSolanaAddress(address) {
  if (typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  return BASE58_CHARS.test(address);
}

/**
 * Sanitizes a display address — returns null if invalid.
 */
export function sanitizeAddress(address) {
  if (!isValidSolanaAddress(address)) return null;
  return address;
}
