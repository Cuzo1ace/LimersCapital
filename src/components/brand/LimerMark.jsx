import { useId } from 'react';

/**
 * LimerMark — icon-sized version of the Limer's Capital crest.
 *
 * Simpler than LimerLogo (no fold overlay, no highlight, no gradient by default)
 * so it renders crisply at 12–24px where inline icons live. Keeps the signature
 * two-L crest + lime wedge that defines the brand.
 *
 * Use this anywhere you'd reach for a small brand icon (nav rows, tier badges,
 * stat pills). For hero contexts or the header wordmark, use LimerLogo instead.
 *
 * Props:
 *   size        number   default 16
 *   goldMono    boolean  solid currentColor-style gold (cheapest) vs. gradient. default true.
 *   title       string   accessible label
 *   className   string   forwarded to <svg>
 */
export default function LimerMark({
  size = 16,
  goldMono = true,
  title,
  className,
  ...rest
}) {
  const gradId = useId();
  const titleId = useId();
  const labelled = typeof title === 'string' && title.length > 0;
  const goldFill = goldMono ? 'var(--color-sun)' : `url(#${gradId})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 200 220"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-labelledby={labelled ? titleId : undefined}
      className={className}
      {...rest}
    >
      {labelled && <title id={titleId}>{title}</title>}

      {!goldMono && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#c9a14a" />
            <stop offset="48%"  stopColor="#f5d580" />
            <stop offset="100%" stopColor="#8a682a" />
          </linearGradient>
        </defs>
      )}

      {/* Left L */}
      <path
        d="M 36 20
           L 66 20
           L 66 34
           L 60 34
           L 104 194
           L 100 206
           L 94 194
           L 50 34
           L 36 34
           Z"
        fill={goldFill}
      />

      {/* Right L */}
      <path
        d="M 164 20
           L 134 20
           L 134 34
           L 140 34
           L 96 194
           L 100 206
           L 106 194
           L 150 34
           L 164 34
           Z"
        fill={goldFill}
      />

      {/* Lime wedge — kept small & clean for icon sizes */}
      <g transform="translate(100 108)">
        <path d="M -30 0 A 30 30 0 0 0 30 0 Z" fill="#2D9B56" />
        <path d="M -26 0 A 26 26 0 0 0 26 0 Z" fill="#87c947" />
        <line x1="-30" y1="0" x2="30" y2="0" stroke="#1d7a3f" strokeWidth="2" strokeLinecap="round" />
        <g stroke="#f6fbe8" strokeWidth="1.8" strokeLinecap="round" opacity="0.95">
          <line x1="0" y1="0" x2="0"   y2="22" />
          <line x1="0" y1="0" x2="-11" y2="19" />
          <line x1="0" y1="0" x2="11"  y2="19" />
          <line x1="0" y1="0" x2="-19" y2="11" />
          <line x1="0" y1="0" x2="19"  y2="11" />
        </g>
      </g>
    </svg>
  );
}
