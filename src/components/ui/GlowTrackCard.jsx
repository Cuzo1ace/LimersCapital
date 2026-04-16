/**
 * GlowTrackCard — cursor-tracking glow border card from 21st.dev
 *
 * Adapted from https://21st.dev glow-card component for Limer's Capital.
 * Uses CSS custom properties + pointer tracking to create a dynamic,
 * colorful glow border that follows the cursor. The glow color shifts
 * based on cursor position across the viewport.
 *
 * Different from the existing GlowCard.jsx (which uses GlowingEffect) —
 * this version has a more dramatic radial-gradient glow with pseudo-element
 * borders and a spotlight background effect.
 *
 * Usage:
 *   <GlowTrackCard glowColor="green">
 *     <h3>Lesson Title</h3>
 *     <p>Content here</p>
 *   </GlowTrackCard>
 *
 * Props:
 *   children     — card contents
 *   className    — additional CSS classes
 *   glowColor    — 'sea' | 'purple' | 'green' | 'gold' | 'coral' (default 'sea')
 *   onClick      — click handler
 *   style        — additional inline styles
 */
import { useEffect, useRef } from 'react';

// Color map using the Veridian Night palette
const GLOW_COLORS = {
  sea:    { base: 160, spread: 120 },  // #00ffa3 hue region
  purple: { base: 280, spread: 200 },  // #bf81ff
  green:  { base: 140, spread: 100 },  // #2D9B56
  gold:   { base: 45,  spread: 60 },   // #FFCA3A
  coral:  { base: 10,  spread: 80 },   // #ff716c
};

// Inject the glow pseudo-element styles once
let stylesInjected = false;
function injectGlowStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    [data-glow-track]::before,
    [data-glow-track]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--glow-border-size) * -1);
      border: var(--glow-border-size) solid transparent;
      border-radius: calc(var(--glow-radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--glow-border-size))) calc(100% + (2 * var(--glow-border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      -webkit-mask-clip: padding-box, border-box;
      -webkit-mask-composite: source-in;
    }

    [data-glow-track]::before {
      background-image: radial-gradient(
        calc(var(--glow-spotlight) * 0.75) calc(var(--glow-spotlight) * 0.75) at
        calc(var(--glow-x, 0) * 1px) calc(var(--glow-y, 0) * 1px),
        hsl(var(--glow-hue, 160) 100% 50% / 0.8), transparent 100%
      );
      filter: brightness(2);
    }

    [data-glow-track]::after {
      background-image: radial-gradient(
        calc(var(--glow-spotlight) * 0.5) calc(var(--glow-spotlight) * 0.5) at
        calc(var(--glow-x, 0) * 1px) calc(var(--glow-y, 0) * 1px),
        hsl(0 100% 100% / 0.7), transparent 100%
      );
    }

    [data-glow-track] [data-glow-outer] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--glow-outer-opacity, 1);
      border-radius: calc(var(--glow-radius) * 1px);
      border-width: calc(var(--glow-border-size) * 20);
      filter: blur(calc(var(--glow-border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }

    [data-glow-track] > [data-glow-outer]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;
  document.head.appendChild(style);
}

export default function GlowTrackCard({
  children,
  className = '',
  glowColor = 'sea',
  onClick,
  style = {},
  ...rest
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    injectGlowStyles();

    const syncPointer = (e) => {
      if (!cardRef.current) return;
      cardRef.current.style.setProperty('--glow-x', e.clientX.toFixed(2));
      cardRef.current.style.setProperty('--glow-xp', (e.clientX / window.innerWidth).toFixed(2));
      cardRef.current.style.setProperty('--glow-y', e.clientY.toFixed(2));
      cardRef.current.style.setProperty('--glow-yp', (e.clientY / window.innerHeight).toFixed(2));
    };

    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = GLOW_COLORS[glowColor] || GLOW_COLORS.sea;

  const cardStyle = {
    '--glow-base': base,
    '--glow-spread': spread,
    '--glow-radius': '14',
    '--glow-border-size': 'calc(2 * 1px)',
    '--glow-spotlight': 'calc(200 * 1px)',
    '--glow-hue': `calc(${base} + (var(--glow-xp, 0) * ${spread}))`,
    '--glow-outer-opacity': '1',
    backgroundImage: `radial-gradient(
      calc(200 * 1px) calc(200 * 1px) at
      calc(var(--glow-x, 0) * 1px) calc(var(--glow-y, 0) * 1px),
      hsl(var(--glow-hue, ${base}) 100% 70% / 0.06), transparent
    )`,
    backgroundColor: 'hsl(0 0% 60% / 0.06)',
    backgroundSize: 'calc(100% + 4px) calc(100% + 4px)',
    backgroundPosition: '50% 50%',
    backgroundAttachment: 'fixed',
    border: '2px solid hsl(0 0% 60% / 0.12)',
    position: 'relative',
    touchAction: 'none',
    ...style,
  };

  return (
    <div
      ref={cardRef}
      data-glow-track
      style={cardStyle}
      className={`rounded-2xl relative grid shadow-[0_1rem_2rem_-1rem_black] backdrop-blur-[5px] gpu-accelerated ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      {...rest}
    >
      <div data-glow-outer />
      {children}
    </div>
  );
}
