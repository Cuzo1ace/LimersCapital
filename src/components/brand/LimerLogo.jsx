import { useId } from 'react';

/**
 * Limer's Capital logo — official brand mark.
 *
 * A chevron-shield in brushed gold with a citrus-wedge motif (the $LIMER brand
 * emblem) at its core. Below, the serif wordmark and "SOLANA" tagline.
 *
 * Variants:
 *   'mark'      — just the shield + lime, no text (icon-sized, 48–96px)
 *   'wordmark'  — shield + lime + "LIMER'S CAPITAL"
 *   'full'      — adds the "— SOLANA —" tagline under the wordmark (default)
 *
 * Props:
 *   size         number   pixel width (height scales proportionally)
 *   variant      'mark' | 'wordmark' | 'full'  default 'full'
 *   goldMono     boolean  render shield as solid --color-sun instead of a gradient
 *                          (cheaper to render, cleaner at small sizes)
 *   title        string   accessible name
 *   className    string   forwarded to root <svg>
 */
export default function LimerLogo({
  size = 220,
  variant = 'full',
  goldMono = false,
  title = "Limer's Capital",
  className,
  ...rest
}) {
  const gradId = useId();
  const limeGradId = useId();
  const titleId = useId();

  const showText = variant !== 'mark';
  const showTagline = variant === 'full';

  // The crest lives in a 200×240 box. For text variants we reserve space below.
  const vb = variant === 'mark'
    ? '0 0 200 240'
    : showTagline ? '0 0 400 340' : '0 0 400 290';

  const height = variant === 'mark'
    ? size * (240 / 200)
    : showTagline ? size * (340 / 400) : size * (290 / 400);

  const goldFill = goldMono ? 'var(--color-sun)' : `url(#${gradId})`;

  // Crest transform per variant (centers it)
  const crestTransform = variant === 'mark' ? 'translate(0,0)' : 'translate(100,10)';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      viewBox={vb}
      role="img"
      aria-labelledby={titleId}
      className={className}
      {...rest}
    >
      <title id={titleId}>{title}</title>

      <defs>
        {!goldMono && (
          <>
            {/* Main gold — brushed metallic */}
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#b18a3a" />
              <stop offset="22%"  stopColor="#e8c46a" />
              <stop offset="48%"  stopColor="#f5d580" />
              <stop offset="72%"  stopColor="#d6ae5a" />
              <stop offset="100%" stopColor="#8a682a" />
            </linearGradient>
            {/* Fold-back gold — darker end of the palette, represents the reverse
                side of a folded ribbon (used on the right-side fold overlay). */}
            <linearGradient id={`${gradId}-back`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#6a4f1e" />
              <stop offset="50%"  stopColor="#8a6830" />
              <stop offset="100%" stopColor="#5a411a" />
            </linearGradient>
          </>
        )}
        <radialGradient id={limeGradId} cx="50%" cy="0%" r="95%">
          <stop offset="0%"  stopColor="#d3f09c" />
          <stop offset="55%" stopColor="#87c947" />
          <stop offset="100%" stopColor="#2D9B56" />
        </radialGradient>
      </defs>

      {/* ── Crest ──
          Two stylized "L" letterforms face each other, forming the shield.
          Each L has:
            • a flat horizontal top bar (the flag-like flourish)
            • a vertical-then-diagonal descender flowing down-inward to the
              center-bottom point
          The lime wedge sits in the pocket between the two L's.
          Filled paths (no strokes) — the architectural angles define the form. */}
      <g transform={crestTransform}>
        {/* LEFT L — flat top + diagonal descender */}
        <path
          d="M 36 20
             L 66 20
             L 66 34
             L 60 34
             L 104 210
             L 100 222
             L 94 210
             L 50 34
             L 36 34
             Z"
          fill={goldFill}
        />

        {/* RIGHT L — main front face (slightly inset so the fold can overlay) */}
        <path
          d="M 160 20
             L 134 20
             L 134 34
             L 140 34
             L 96 210
             L 100 222
             L 106 210
             L 150 34
             L 160 34
             Z"
          fill={goldFill}
        />

        {/* RIGHT FOLD — the "back of the paper" revealed along the outer edge.
            Two polygons: one along the top-bar right edge, one along the
            descender's outer edge. Darker gradient suggests reverse-side shadow.
            This is the reference's signature folded-ribbon 3D cue. */}
        <path
          d="M 160 20
             L 164 20
             L 164 34
             L 154 34
             L 110 210
             L 100 222
             L 106 210
             L 150 34
             L 160 34
             Z"
          fill={goldMono ? 'var(--color-sun)' : `url(#${gradId}-back)`}
          opacity={goldMono ? 0.6 : 0.95}
        />

        {/* Subtle inner highlight line on the right descender — metallic light-catch */}
        <path
          d="M 138 38 L 103 198"
          stroke="#fff5d1"
          strokeWidth="1.2"
          opacity="0.35"
          fill="none"
          strokeLinecap="round"
        />

        {/* Crease line where the fold meets — thin dark line along the fold edge
            on the top-right corner, selling the "folded ribbon" illusion. */}
        <path
          d="M 160 20 L 160 34 L 150 34"
          stroke="var(--color-night)"
          strokeWidth="0.8"
          opacity="0.35"
          fill="none"
          strokeLinejoin="miter"
        />

        {/* ── Lime wedge — the brand emblem ──
            True half-circle with flat cut at the top, domed rind below,
            citrus segments radiating from the cut-center. */}
        <g transform="translate(100 112)">
          {/* Outer rind (darker green halo) */}
          <path d="M -34 0 A 34 34 0 0 0 34 0 Z" fill="#1d7a3f" />
          {/* Inner pulp (bright lime) */}
          <path d="M -29 0 A 29 29 0 0 0 29 0 Z" fill={`url(#${limeGradId})`} />
          {/* Flat cut edge — thin dark green line across the diameter */}
          <line x1="-34" y1="0" x2="34" y2="0" stroke="#1d7a3f" strokeWidth="2" strokeLinecap="round" />
          {/* Segment dividers — 5 radial lines fanning from center-top down */}
          <g stroke="#f6fbe8" strokeWidth="1.6" strokeLinecap="round" opacity="0.9">
            <line x1="0" y1="0" x2="0"   y2="26" />
            <line x1="0" y1="0" x2="-13" y2="22" />
            <line x1="0" y1="0" x2="13"  y2="22" />
            <line x1="0" y1="0" x2="-22" y2="13" />
            <line x1="0" y1="0" x2="22"  y2="13" />
          </g>
          {/* Small leaf on the upper right — a cheeky "just-picked" touch */}
          <path
            d="M 10 -4
               Q 18 -12, 22 -6
               Q 16 0, 10 -4 Z"
            fill="#2D9B56"
          />
          <line x1="10" y1="-4" x2="21" y2="-9" stroke="#1d7a3f" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>

      {/* ── Wordmark ── */}
      {showText && (
        <g fontFamily="'Space Grotesk', system-ui, sans-serif" fill="currentColor">
          <text
            x="200"
            y="266"
            textAnchor="middle"
            fontSize="30"
            fontWeight="300"
            letterSpacing="5"
          >
            LIMER'S CAPITAL
          </text>

          {showTagline && (
            <g>
              <line x1="128" y1="296" x2="168" y2="296" stroke="currentColor" strokeWidth="1" opacity="0.55" />
              <text
                x="200"
                y="300"
                textAnchor="middle"
                fontSize="12"
                fontWeight="400"
                letterSpacing="7"
                opacity="0.75"
              >
                SOLANA
              </text>
              <line x1="232" y1="296" x2="272" y2="296" stroke="currentColor" strokeWidth="1" opacity="0.55" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
