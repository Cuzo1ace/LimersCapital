/**
 * Stablecoin registry for the Send Juice corridor ("Juice rails").
 *
 * Designed to be issuer-agnostic so we can add Western Union's USDPT
 * (and any other Solana-native stablecoin) without touching UI code.
 *
 * Each entry exposes:
 *   - id            short slug used as the React key + URL param
 *   - symbol        on-screen ticker
 *   - name          long name
 *   - issuer        human-readable issuer
 *   - decimals      SPL token decimals
 *   - tokenProgram  'spl-token' (legacy) or 'spl-token-2022'  — picks the
 *                   transfer / ATA-derivation program at the SPL layer
 *   - mint          { mainnet, devnet }  — null if not yet known
 *   - color         accent token used by the calculator + send flow
 *   - notes         one-line "why this rail" copy for the picker
 *
 * To add a new rail, append to STABLECOINS and rebuild — nothing else changes.
 */

// SPL token program IDs (kept here as strings; consumers convert to PublicKey
// via @solana/spl-token's TOKEN_PROGRAM_ID / TOKEN_2022_PROGRAM_ID exports).
export const TOKEN_PROGRAMS = {
  'spl-token':      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'spl-token-2022': 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
};

export const STABLECOINS = [
  {
    id: 'pusd',
    symbol: 'PUSD',
    name: 'Palm USD',
    issuer: 'Palm USD (UAE)',
    decimals: 6,
    tokenProgram: 'spl-token-2022',          // verified on-chain Apr 30 2026
    mint: {
      mainnet: 'CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s',
      devnet: null,                          // no devnet mint published; use mainnet for live demos
    },
    color: 'var(--color-pusd)',
    notes: 'UAE-issued Solana stablecoin, 1:1 backed by AED + SAR reserves. Token-2022 with metadata extensions only — no freeze, no transfer hooks. Primary rail for Send Juice.',
  },
  {
    id: 'usdpt',
    symbol: 'USDPT',
    name: 'Western Union USDPT',
    issuer: 'Western Union (Anchorage Digital)',
    decimals: 6,
    tokenProgram: 'spl-token-2022',          // assumed; confirm at WU launch
    mint: {
      mainnet: null,                         // TODO: confirm at WU launch
      devnet: null,
    },
    color: 'var(--color-coral)',
    notes: 'Future rail. Western Union\'s Solana-native stablecoin — unlocks WU\'s 200+ country agent network as fiat off-ramp.',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    issuer: 'Circle',
    decimals: 6,
    tokenProgram: 'spl-token',               // legacy SPL Token
    mint: {
      mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    },
    color: 'var(--color-sea)',
    notes: 'Fallback rail for end-to-end testing on devnet (PUSD has no devnet mint).',
  },
];

export const DEFAULT_STABLECOIN_ID = 'pusd';

export function getStablecoin(id) {
  return STABLECOINS.find((s) => s.id === id) || STABLECOINS[0];
}

export function getMintAddress(stablecoin, cluster) {
  if (!stablecoin?.mint) return null;
  return stablecoin.mint[cluster] ?? null;
}

export function getTokenProgramId(stablecoin) {
  return TOKEN_PROGRAMS[stablecoin?.tokenProgram] || TOKEN_PROGRAMS['spl-token'];
}

/**
 * True when we have a real on-chain mint for this rail on the requested cluster.
 * Used to gate "Send" buttons — we render the calculator as an estimator either way,
 * but only allow a transfer when the mint exists.
 */
export function isStablecoinLive(stablecoin, cluster) {
  return !!getMintAddress(stablecoin, cluster);
}
