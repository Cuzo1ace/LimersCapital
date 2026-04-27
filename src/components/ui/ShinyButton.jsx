import { useEffect, useRef } from 'react';

/**
 * ShinyButton — unified primary CTA across the platform.
 *
 * Conic-gradient border that animates around the pill, a dotted radial
 * fill, and a shimmer that breathes on hover. Designed to be the single
 * primary CTA pattern (Squeeze, Join the Waitlist, Read the Docs, etc.).
 *
 * Tone:
 *   "primary"  — sea-green highlight (default; matches brand)
 *   "coral"    — coral/purple highlight (use for secondary CTAs like Docs)
 *   "neutral"  — white highlight (use on darker contexts where colour clashes)
 *
 * Props:
 *   children   — button label
 *   onClick    — click handler
 *   href       — if set, renders as an <a> instead of a <button>
 *   tone       — "primary" | "coral" | "neutral" (default "primary")
 *   size       — "md" | "sm" (default "md")
 *   className  — extra classes appended to the root
 *   ariaLabel  — accessibility label
 *   target / rel — link attrs (only used when href is set)
 */
export default function ShinyButton({
  children,
  onClick,
  href,
  tone = 'primary',
  size = 'md',
  className = '',
  ariaLabel,
  target,
  rel,
  type = 'button',
}) {
  injectShinyStyles();

  const TONE_VARS = {
    primary: { highlight: '#00ffa3', highlightSubtle: '#7fffd1' },
    coral:   { highlight: '#bf81ff', highlightSubtle: '#dab8ff' },
    neutral: { highlight: '#ffffff', highlightSubtle: '#cccccc' },
  };
  const vars = TONE_VARS[tone] ?? TONE_VARS.primary;

  const SIZE_CLASSES = {
    md: 'px-7 py-3.5 text-base',
    sm: 'px-5 py-2.5 text-sm',
  };
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  const style = {
    '--shiny-cta-highlight': vars.highlight,
    '--shiny-cta-highlight-subtle': vars.highlightSubtle,
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        className={`shiny-cta ${sizeClass} ${className}`}
        style={style}
      >
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`shiny-cta ${sizeClass} ${className}`}
      style={style}
    >
      <span>{children}</span>
    </button>
  );
}

let stylesInjected = false;
function injectShinyStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;

  const css = `
    @property --gradient-angle {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-angle-offset {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: false;
    }
    @property --gradient-percent {
      syntax: "<percentage>";
      initial-value: 5%;
      inherits: false;
    }
    @property --gradient-shine {
      syntax: "<color>";
      initial-value: white;
      inherits: false;
    }

    .shiny-cta {
      --shiny-cta-bg: #0a0b14;
      --shiny-cta-bg-subtle: #1a1818;
      --shiny-cta-fg: #ffffff;
      --shiny-cta-highlight: #00ffa3;
      --shiny-cta-highlight-subtle: #7fffd1;
      --animation: gradient-angle linear infinite;
      --duration: 3s;
      --shadow-size: 2px;
      --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

      isolation: isolate;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      outline-offset: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      line-height: 1.2;
      font-weight: 600;
      letter-spacing: 0.005em;
      text-decoration: none;
      border: 1px solid transparent;
      border-radius: 360px;
      color: var(--shiny-cta-fg);
      background:
        linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
        conic-gradient(
          from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
          transparent,
          var(--shiny-cta-highlight) var(--gradient-percent),
          var(--gradient-shine) calc(var(--gradient-percent) * 2),
          var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
          transparent calc(var(--gradient-percent) * 4)
        ) border-box;
      box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
      transition: var(--transition);
      transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
    }

    .shiny-cta::before,
    .shiny-cta::after,
    .shiny-cta span::before {
      content: "";
      pointer-events: none;
      position: absolute;
      inset-inline-start: 50%;
      inset-block-start: 50%;
      translate: -50% -50%;
      z-index: -1;
    }

    .shiny-cta:active { translate: 0 1px; }

    .shiny-cta::before {
      --size: calc(100% - var(--shadow-size) * 3);
      --position: 2px;
      --space: calc(var(--position) * 2);
      width: var(--size);
      height: var(--size);
      background: radial-gradient(
        circle at var(--position) var(--position),
        white calc(var(--position) / 4),
        transparent 0
      ) padding-box;
      background-size: var(--space) var(--space);
      background-repeat: space;
      mask-image: conic-gradient(
        from calc(var(--gradient-angle) + 45deg),
        black,
        transparent 10% 90%,
        black
      );
      border-radius: inherit;
      opacity: 0.4;
      z-index: -1;
    }

    .shiny-cta::after {
      --animation: shimmer linear infinite;
      width: 100%;
      aspect-ratio: 1;
      background: linear-gradient(
        -50deg,
        transparent,
        var(--shiny-cta-highlight),
        transparent
      );
      mask-image: radial-gradient(circle at bottom, transparent 40%, black);
      opacity: 0.6;
    }

    .shiny-cta span { z-index: 1; display: inline-flex; align-items: center; gap: 0.5rem; }

    .shiny-cta span::before {
      --size: calc(100% + 1rem);
      width: var(--size);
      height: var(--size);
      box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
      opacity: 0;
      transition: opacity var(--transition);
      animation: calc(var(--duration) * 1.5) breathe linear infinite;
    }

    .shiny-cta,
    .shiny-cta::before,
    .shiny-cta::after {
      animation: var(--animation) var(--duration),
        var(--animation) calc(var(--duration) / 0.4) reverse paused;
      animation-composition: add;
    }

    .shiny-cta:is(:hover, :focus-visible) {
      --gradient-percent: 20%;
      --gradient-angle-offset: 95deg;
      --gradient-shine: var(--shiny-cta-highlight-subtle);
    }
    .shiny-cta:is(:hover, :focus-visible),
    .shiny-cta:is(:hover, :focus-visible)::before,
    .shiny-cta:is(:hover, :focus-visible)::after {
      animation-play-state: running;
    }
    .shiny-cta:is(:hover, :focus-visible) span::before { opacity: 1; }

    @keyframes gradient-angle { to { --gradient-angle: 360deg; } }
    @keyframes shimmer { to { rotate: 360deg; } }
    @keyframes breathe { from, to { scale: 1; } 50% { scale: 1.2; } }

    @media (prefers-reduced-motion: reduce) {
      .shiny-cta, .shiny-cta::before, .shiny-cta::after { animation: none !important; }
      .shiny-cta span::before { animation: none !important; }
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-shiny-button', '');
  style.textContent = css;
  document.head.appendChild(style);
}
