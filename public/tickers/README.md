# Ticker bubble art

Drop an image here to override the inline default for a ticker on the
News bubble map.

**Naming:** `<lowercase-ticker>.png` (or `.svg`, `.jpg`, `.webp`)

Examples:
- `sol.png`  → $SOL bubble
- `btc.png`  → $BTC bubble
- `ngl.tt.png` → $NGL.TT bubble (dots in the filename are fine)

**Size:** 256×256 or larger, square. Transparent PNG preferred. The
bubble clips the image to a circle so edges can bleed.

When no file exists for a ticker, the bubble falls back to:
1. The inline brand mark (currently: Solana-stacked-parallelograms for
   $SOL — see `src/lib/tickerAssets.js`)
2. The $TICKER text label on a gradient sphere.
