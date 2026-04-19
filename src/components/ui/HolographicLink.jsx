import { useRef, useCallback } from 'react';
import './HolographicLink.css';

/**
 * Cursor-tracking tilt wrapper designed specifically for SHAREABLE LINKS —
 * the artifacts users copy and send via WhatsApp, Twitter, Telegram.
 *
 * Adapted from the generic holographic-card pattern the user supplied,
 * repurposed so the underlying element is usually an <a> (href + target)
 * and the tilt intensity is dialed down so link-sized surfaces still
 * read as links, not card backgrounds.
 *
 * Use it to "lift" anything a user would brag about copying:
 *   - Blink share URLs
 *   - Access Pass explorer links
 *   - Referral URLs
 *
 * Props:
 *   href         — if set, element renders as <a> and opens in new tab
 *   as           — override element tag when not a link (default 'a' when
 *                  href set, 'div' otherwise)
 *   className    — extra classes on the outer wrapper
 *   tiltMax      — max rotation in degrees on each axis (default 4)
 *   children     — the visible link / label / URL
 *   ...rest      — forwarded (onClick, aria-*, etc.)
 */
export default function HolographicLink({
  href,
  as,
  className = '',
  tiltMax = 4,
  children,
  onClick,
  style,
  ...rest
}) {
  const ref = useRef(null);
  const Tag = as || (href ? 'a' : 'div');

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

  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Tag
      ref={ref}
      className={['component-card', 'holographic-card', className].filter(Boolean).join(' ')}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      {...linkProps}
      {...rest}
    >
      <div className="holo-content">{children}</div>
      <div className="holo-glow" />
    </Tag>
  );
}
