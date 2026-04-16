import { useRef, useCallback } from 'react';
import './HolographicCard.css';

/**
 * Cursor-tracking 3D-parallax wrapper with iridescent shimmer.
 * Adapted from a generic holographic-card pattern; retuned to the
 * Veridian Night palette and used to "lift" high-value cards
 * (MorningBrief, NewsCard).
 *
 * Props:
 *   intensity  — 0..1 scalar for shimmer strength. 1 = full, 0.35 = subtle.
 *   tiltMax    — max rotation in degrees on each axis. Default 6.
 *   className  — extra classes on the outer wrapper
 *   as         — override the wrapper element tag (default 'div')
 *   ...rest    — forwarded to the wrapper (onClick, role, aria-*, etc.)
 *
 * Children render on top of the shimmer/glint layers. They MUST provide
 * their own border-radius / background / padding — this component is
 * a pure decorator, not a card chrome.
 */
export default function HolographicCard({
  intensity = 1,
  tiltMax = 6,
  className = '',
  style,
  as: Tag = 'div',
  children,
  ...rest
}) {
  const ref = useRef(null);

  const handleMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * tiltMax;
    const rotateY = ((rect.width / 2 - x) / (rect.width / 2)) * tiltMax;
    el.style.setProperty('--x', `${x}px`);
    el.style.setProperty('--y', `${y}px`);
    el.style.setProperty('--bg-x', `${(x / rect.width) * 100}%`);
    el.style.setProperty('--bg-y', `${(y / rect.height) * 100}%`);
    el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  }, [tiltMax]);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    el.style.setProperty('--x', '50%');
    el.style.setProperty('--y', '50%');
    el.style.setProperty('--bg-x', '50%');
    el.style.setProperty('--bg-y', '50%');
  }, []);

  return (
    <Tag
      ref={ref}
      className={['holo-card', className].filter(Boolean).join(' ')}
      style={{ '--holo-intensity': intensity, ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
    </Tag>
  );
}
