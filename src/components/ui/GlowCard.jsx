import { GlowingEffect } from './GlowingEffect';

/**
 * GlowCard — a card wrapper with the interactive glowing border effect.
 *
 * Props:
 *   as          — HTML element type, default 'div'
 *   className   — classes on the outer container
 *   style       — inline styles on the outer container
 *   glow        — always-on glow (vs cursor-only), default false
 *   blur        — glow blur radius, default 0
 *   spread      — arc width in degrees, default 20
 *   proximity   — activation distance outside card, default 64
 *   borderWidth — border thickness, default 1
 *   variant     — "default" | "white"
 *   disabled    — show static border instead, default false
 *   children    — card contents
 *   ...rest     — forwarded to the container element (onClick, aria-*, etc.)
 */
export default function GlowCard({
  as: Tag = 'div',
  className = '',
  style,
  glow = false,
  blur = 0,
  spread = 20,
  proximity = 64,
  borderWidth = 1,
  variant = 'default',
  disabled = false,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`relative rounded-xl ${className}`}
      style={style}
      {...rest}
    >
      <GlowingEffect
        blur={blur}
        spread={spread}
        proximity={proximity}
        glow={glow}
        variant={variant}
        borderWidth={borderWidth}
        disabled={disabled}
        inactiveZone={0.01}
      />
      {children}
    </Tag>
  );
}
