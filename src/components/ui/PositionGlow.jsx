import { useEffect, useRef, useState } from 'react';
import './PositionGlow.css';

/**
 * Position-aware animated border glow.
 * Wraps children in an animated ring whose hue is pinned to the user's P&L state.
 *
 * Props:
 *   state          — 'up' | 'down' | 'neutral'  (derived from totalPnl sign)
 *   intensity      — 0..1  (scales glow brightness; pass |pnl%| / 10 clamped)
 *   radius         — 'lg' | 'xl' | '2xl'  (matches existing card radii)
 *   pulseOnChange  — boolean; fire a one-shot pulse animation when state flips
 *   className      — extra classes for the wrapper
 *   style          — extra inline styles
 */
export default function PositionGlow({
  state = 'neutral',
  intensity = 0.5,
  radius = 'xl',
  pulseOnChange = true,
  className = '',
  style,
  children,
}) {
  const hue = hueForState(state);
  const clampedIntensity = Math.max(0, Math.min(1, Number(intensity) || 0));

  // One-shot pulse: briefly add the pulse class on state change, then remove.
  const [pulse, setPulse] = useState(false);
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (!pulseOnChange) return;
    if (prevStateRef.current !== state) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 950);
      prevStateRef.current = state;
      return () => clearTimeout(t);
    }
  }, [state, pulseOnChange]);

  return (
    <div
      className={[
        'position-glow',
        `position-glow--radius-${radius}`,
        pulse ? 'position-glow--pulse' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        '--position-hue': hue,
        '--position-intensity': clampedIntensity,
        ...style,
      }}
      data-position-state={state}
    >
      {children}
    </div>
  );
}

function hueForState(state) {
  switch (state) {
    case 'up':   return 140;  // brand green (#00ffa3 ≈ hsl(155, 100%, 50%) — 140 reads greener next to hue-based shading)
    case 'down': return 0;    // red
    case 'neutral':
    default:     return 200;  // muted sea blue
  }
}

/** Convenience: derive state + intensity from numeric P&L. */
export function deriveGlowProps({ pnl, pnlPct }) {
  if (pnl == null || Number.isNaN(pnl) || pnl === 0) {
    return { state: 'neutral', intensity: 0.3 };
  }
  const state = pnl > 0 ? 'up' : 'down';
  const pct = Math.abs(Number(pnlPct) || 0);
  const intensity = Math.min(pct / 10, 1);  // 10% or greater → full brightness
  return { state, intensity: Math.max(0.35, intensity) };
}
