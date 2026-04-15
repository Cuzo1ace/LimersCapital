/**
 * BasisSpreadBadge — shows the basis-spread between an on-chain tokenized
 * equity price (e.g. AAPLX on Solana) and the real underlying stock price
 * (e.g. AAPL on NASDAQ, from FMP). This is an educational widget — not a
 * trading signal — that demystifies what a tokenized stock actually is.
 *
 * Basis formula: (onChainPrice - underlyingPrice) / underlyingPrice × 100%
 *   * Positive → Solana token trades at a premium to the real share
 *   * Negative → Solana token trades at a discount
 *   * Near zero → tracking the underlying exactly (the normal case)
 *
 * Silently renders nothing if either price is missing — never breaks the UI.
 */
function formatBasisSign(basis) {
  if (basis == null) return '';
  if (basis > 0) return '+';
  if (basis < 0) return '−';
  return '';
}

export default function BasisSpreadBadge({
  onChainPrice,
  underlyingPrice,
  underlyingTicker,
  exchange,
  size = 'sm',
  showTicker = true,
}) {
  if (typeof onChainPrice !== 'number' || typeof underlyingPrice !== 'number') return null;
  if (onChainPrice <= 0 || underlyingPrice <= 0) return null;

  const basisPct = ((onChainPrice - underlyingPrice) / underlyingPrice) * 100;
  const absBasis = Math.abs(basisPct);
  // "At par" if within ±0.05% — noise-level basis
  const atPar = absBasis < 0.05;
  const color = atPar ? 'text-muted' : basisPct > 0 ? 'text-up' : 'text-down';
  const bgCol = atPar ? 'bg-white/5' : basisPct > 0 ? 'bg-up/10' : 'bg-down/10';
  const sign = formatBasisSign(basisPct);

  const sizeClass = size === 'xs'
    ? 'text-[.58rem] px-1.5 py-0.5 gap-1'
    : size === 'md'
      ? 'text-[.78rem] px-2.5 py-1 gap-1.5'
      : 'text-[.68rem] px-2 py-0.5 gap-1';

  const tooltip = atPar
    ? `Tracking the underlying ${underlyingTicker || 'share'} at par`
    : `The on-chain token trades ${basisPct > 0 ? 'above' : 'below'} the real ${underlyingTicker || 'share'} price on ${exchange || 'the exchange'}. A persistent basis is an arbitrage opportunity.`;

  return (
    <span
      className={`inline-flex items-center font-mono rounded-md border border-border ${bgCol} ${color} ${sizeClass}`}
      title={tooltip}
    >
      {showTicker && underlyingTicker && (
        <span className="text-muted/80 font-headline uppercase tracking-wider">
          {underlyingTicker}
        </span>
      )}
      <span className="opacity-60">·</span>
      <span>
        {atPar ? '≈ par' : `basis ${sign}${absBasis.toFixed(2)}%`}
      </span>
    </span>
  );
}
