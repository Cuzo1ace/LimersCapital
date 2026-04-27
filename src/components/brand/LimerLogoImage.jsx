/**
 * LimerLogoImage — the new sacred-geometry lime brand mark.
 *
 * Renders the bitmap logo at `/brand/limer-logo.png`. Replaces the old
 * SparkleIcon (above hero headline) and the 🍋 emoji on CTAs.
 *
 * Drop the supplied PNG at: public/brand/limer-logo.png
 *
 * Props:
 *   size  — px (default 48). Scales width and height equally.
 *   glow  — when true, applies a soft sea drop-shadow halo (use on the hero).
 *   className — extra Tailwind classes
 */
export default function LimerLogoImage({ size = 48, glow = false, className = '' }) {
  return (
    <img
      src="/brand/limer-logo.png"
      alt="Limer's Capital"
      width={size}
      height={size}
      draggable={false}
      className={`select-none ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: glow ? 'drop-shadow(0 0 24px rgba(0,255,163,0.45))' : undefined,
      }}
    />
  );
}
