/**
 * tickerAssets — maps ticker symbols to brand art + fallback config.
 *
 * Order of resolution for a ticker's visual:
 *   1. If an override file exists at `public/tickers/<lowercase-ticker>.png`
 *      (or .svg/.jpg/.webp), the component prefers that.
 *   2. Otherwise, the inline SVG mark in `INLINE_MARK[ticker]` is used.
 *   3. Otherwise, fall back to the $TICKER text label (existing behavior).
 *
 * To add a custom image for $SOL:
 *   1. Save your PNG/SVG as `public/tickers/sol.png`
 *   2. Reload — the bubble map picks it up automatically via the
 *      `externalPath` returned by `getTickerAsset`.
 */

// Inline Solana "stacked parallelograms" mark — official mark geometry,
// gradient colors from the Solana brand guidelines (cyan → purple).
const SOLANA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 96">
  <defs>
    <linearGradient id="sol-g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00FFA3"/>
      <stop offset="55%" stop-color="#03E1FF"/>
      <stop offset="100%" stop-color="#DC1FFF"/>
    </linearGradient>
  </defs>
  <path fill="url(#sol-g1)" d="M18 76l14-14h90l-14 14H18zm0-28l14-14h90l-14 14H18zm14-28h90l-14-14H46L32 20z"/>
</svg>`;

const INLINE_MARK = {
  SOL: SOLANA_SVG,
};

const EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.webp'];

/**
 * Build a public URL for a ticker image override.
 * Vite serves /public/* from the site root — so `/tickers/sol.png`
 * works if the file exists.
 *
 * Returns the first candidate URL; the <image> element's `onError`
 * falls back to the inline SVG when the file is missing.
 */
function candidatePublicPath(ticker) {
  const base = String(ticker || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  if (!base) return null;
  // Default candidate — component can try each extension on error if needed
  return `/tickers/${base}.png`;
}

/**
 * Returns { externalPath, inlineSvg }.
 * - externalPath: url to a <image>-able asset (png/svg) if one exists in /public/tickers
 * - inlineSvg:    raw SVG markup as a fallback (data: URI built by component)
 */
export function getTickerAsset(ticker) {
  const key = String(ticker || '').toUpperCase();
  return {
    externalPath: candidatePublicPath(ticker),
    inlineSvg: INLINE_MARK[key] || null,
  };
}

/** Convenience — true if we have any visual for this ticker. */
export function hasTickerArt(ticker) {
  const { externalPath, inlineSvg } = getTickerAsset(ticker);
  return !!(externalPath || inlineSvg);
}

/** Build a data: URI from raw SVG markup (usable in <image href=…>). */
export function svgToDataUri(svg) {
  if (!svg) return null;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
