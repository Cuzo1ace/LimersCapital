/**
 * Send Juice savings receipt — shared helpers.
 *
 * The savings *receipt* is a Metaplex Core NFT minted to the recipient when
 * the sender opts to attach a goal to a corridor transfer. Sprint 1 (this
 * file) ships an Attributes-only receipt — owner-updatable, transferable,
 * with no on-chain escrow. Sprint 2 will add an Anchor escrow program
 * (anchor/programs/juice_escrow/) that locks the underlying tokens until
 * maturity; the receipt NFT then doubles as the bearer instrument that
 * authorizes a claim from the escrow PDA.
 */

import { getStablecoin } from './stablecoins.js';

export const SAVINGS_COLLECTION_NAME = 'Send Juice Savings';

/**
 * Build the human-facing receipt name. Kept short so it renders cleanly in
 * wallet UIs (Phantom truncates aggressively past ~30 chars).
 */
export function buildReceiptName({ stablecoin, goalUiAmount }) {
  if (!goalUiAmount) return `${SAVINGS_COLLECTION_NAME} · ${stablecoin.symbol}`;
  return `Sundollar Goal · ${formatAmount(goalUiAmount)} ${stablecoin.symbol}`;
}

/**
 * Resolve the metadata URI. For the hackathon we serve a static pointer at
 * /metadata/savings-receipt.json on the Limer SPA's origin (vercel-style
 * dynamic JSON can come later via apps/pusd-sundollar/api/metadata/[asset].ts).
 */
export function resolveReceiptUri(origin) {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://limerscapital.com');
  return `${base}/metadata/savings-receipt.json`;
}

/**
 * The Attributes plugin payload. Plain string key/value pairs (Core's
 * Attributes plugin only supports strings — anything richer goes to
 * AppData, which is the upgrade path post-Sprint 1).
 */
export function buildAttributeList({ stablecoinId, goalUiAmount, maturityUnix, depositUiAmount, sourceCountry, recipientCountry }) {
  const stablecoin = getStablecoin(stablecoinId);
  const list = [
    { key: 'rail',            value: stablecoin.symbol },
    { key: 'rail_issuer',     value: stablecoin.issuer },
    { key: 'rail_decimals',   value: String(stablecoin.decimals) },
    { key: 'created_unix',    value: String(Math.floor(Date.now() / 1000)) },
    { key: 'first_deposit',   value: formatAmount(depositUiAmount) },
    { key: 'deposits_total',  value: formatAmount(depositUiAmount) },
    { key: 'deposit_count',   value: '1' },
  ];
  if (goalUiAmount) list.push({ key: 'goal_amount', value: formatAmount(goalUiAmount) });
  if (maturityUnix) list.push({ key: 'maturity_unix', value: String(maturityUnix) });
  if (sourceCountry)    list.push({ key: 'source_country', value: sourceCountry });
  if (recipientCountry) list.push({ key: 'recipient_country', value: recipientCountry });
  return list;
}

/**
 * Maturity date input is an HTML <input type="date"> string (YYYY-MM-DD).
 * Convert to a unix timestamp at end-of-day UTC. Returns null for empty input.
 */
export function maturityToUnix(dateString) {
  if (!dateString) return null;
  const ms = Date.parse(`${dateString}T23:59:59Z`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function formatAmount(n) {
  if (n == null) return '';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (!Number.isFinite(num)) return '';
  return num.toFixed(2);
}
