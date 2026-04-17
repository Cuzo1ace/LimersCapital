/**
 * Canonical token registry for Limer's Capital.
 *
 * Every token the platform issues or relies on gets a row here, keyed by
 * symbol. The UI, the bridge, and future AMM / lending integrations read
 * from this single source rather than hard-coding mints at call sites.
 *
 * Adding a new token:
 *   1. Mint it via `scripts/tokens/mint-<symbol>.ts`
 *   2. Append an entry in the matching cluster's section below
 *   3. Append an entry to `docs/tokens-log.md`
 *   4. Update the relevant CSP `connect-src` / `img-src` if the metadata
 *      URI is on a new host (see public/_headers).
 *
 * Do NOT mutate this file at runtime — it is build-time truth.
 */

import mockTtdcRecord from './generated/mock-ttdc.json';
import mockStocksRecords from './generated/mock-stocks.json';

/**
 * @typedef {Object} TokenEntry
 * @property {string} symbol          - User-facing ticker (e.g. "mTTDC")
 * @property {string} name            - Human-readable name
 * @property {string} mint            - Base58 mint pubkey
 * @property {number} decimals        - Token decimals
 * @property {string} metadataUri     - Metaplex metadata JSON URI
 * @property {string} mintAuthority   - Pubkey with mint authority
 * @property {'stablecoin'|'equity'|'utility'|'lp'} category
 * @property {string} [externalRef]   - For equity tokens: upstream TTSE ticker
 * @property {string} [sector]        - For equity tokens: sector (e.g. "Banking")
 * @property {string} [refPriceTtd]   - For equity tokens: reference price in TTD at mint time
 * @property {string} createTxSig     - Tx signature that created the mint
 * @property {string} [mintTxSig]     - Tx signature that minted initial supply
 * @property {string} createdAt       - ISO timestamp
 * @property {boolean} isMock         - True if this is a dev/test token
 */

/** @type {Record<string, Record<string, TokenEntry>>} */
export const TOKENS_BY_CLUSTER = {
  devnet: {
    mTTDC: {
      symbol: mockTtdcRecord.symbol,
      name: mockTtdcRecord.name,
      mint: mockTtdcRecord.mint,
      decimals: mockTtdcRecord.decimals,
      metadataUri: mockTtdcRecord.metadataUri,
      mintAuthority: mockTtdcRecord.mintAuthority,
      category: 'stablecoin',
      createTxSig: mockTtdcRecord.createTxSig,
      mintTxSig: mockTtdcRecord.mintTxSig,
      createdAt: mockTtdcRecord.createdAt,
      isMock: true,
    },
    // USDC-devnet — NOT minted by us; this is the Circle-issued devnet USDC
    // commonly paired in DEX pools on devnet. Treated as external reference.
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin (devnet)',
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      decimals: 6,
      metadataUri: '',
      mintAuthority: 'external',
      category: 'stablecoin',
      createTxSig: 'external',
      createdAt: 'external',
      isMock: false,
    },
    // Tokenized TTSE equities (Phase A3, April 2026). All mock.
    // Spread generator over the records file so adding a new stock only
    // requires re-running mint-mock-stocks.ts and bumping the record.
    ...Object.fromEntries(
      mockStocksRecords.map((r) => [
        r.symbol,
        {
          symbol: r.symbol,
          name: r.name,
          mint: r.mint,
          decimals: r.decimals,
          metadataUri: r.metadataUri,
          mintAuthority: r.mintAuthority,
          category: 'equity',
          externalRef: r.ticker,
          sector: r.sector,
          refPriceTtd: r.refPriceTtd,
          createTxSig: r.createTxSig,
          mintTxSig: r.mintTxSig,
          createdAt: r.createdAt,
          isMock: true,
        },
      ]),
    ),
  },

  'mainnet-beta': {
    // USDC on mainnet — external reference, not minted by us.
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      metadataUri: '',
      mintAuthority: 'external',
      category: 'stablecoin',
      createTxSig: 'external',
      createdAt: 'external',
      isMock: false,
    },
  },
};

/**
 * Look up a token by symbol on the active cluster.
 * @param {string} symbol
 * @param {'devnet'|'mainnet-beta'} cluster
 * @returns {TokenEntry|null}
 */
export function getToken(symbol, cluster) {
  return TOKENS_BY_CLUSTER[cluster]?.[symbol] ?? null;
}

/**
 * All tokens for the active cluster as an array.
 * @param {'devnet'|'mainnet-beta'} cluster
 * @returns {TokenEntry[]}
 */
export function listTokens(cluster) {
  return Object.values(TOKENS_BY_CLUSTER[cluster] ?? {});
}
