import { memo, useCallback, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/**
 * GlowingEffect — interactive border glow that follows the cursor.
 * Adapted for Veridian Night Terminal palette.
 *
 * Props:
 *   blur          — glow blur radius (px), default 0
 *   inactiveZone  — fraction of card center that ignores cursor, default 0.7
 *   proximity     — how far outside the card the glow activates, default 0
 *   spread        — conic-gradient arc width (deg), default 20
 *   variant       — "default" (Veridian palette) | "white"
 *   glow          — always show glow (vs only on hover), default false
 *   disabled      — show a static border instead, default true
 *   movementDuration — animation easing duration (s), default 2
 *   borderWidth   — border thickness (px), default 1
 *   className     — extra classes on the glow container
 */
const GlowingEffect = memo(function GlowingEffect({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 0,
  spread = 20,
  variant = 'default',
  glow = false,
  className = '',
  movementDuration = 2,
  borderWidth = 1,
  disabled = true,
}) {
  const containerRef = useRef(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef(0);

  const handleMove = useCallback(
    (e) => {
      if (!containerRef.current) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const element = containerRef.current;
        if (!element) return;

        const { left, top, width, height } = element.getBoundingClientRect();
        const mouseX = e?.x ?? lastPosition.current.x;
        const mouseY = e?.y ?? lastPosition.current.y;

        if (e) lastPosition.current = { x: mouseX, y: mouseY };

        const center = [left + width * 0.5, top + height * 0.5];
        const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
        const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

        if (distanceFromCenter < inactiveRadius) {
          element.style.setProperty('--active', '0');
          return;
        }

        const isActive =
          mouseX > left - proximity &&
          mouseX < left + width + proximity &&
          mouseY > top - proximity &&
          mouseY < top + height + proximity;

        element.style.setProperty('--active', isActive ? '1' : '0');
        if (!isActive) return;

        const currentAngle = parseFloat(element.style.getPropertyValue('--start')) || 0;
        let targetAngle =
          (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
        const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
        const newAngle = currentAngle + angleDiff;

        animate(currentAngle, newAngle, {
          duration: movementDuration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (value) => {
            element.style.setProperty('--start', String(value));
          },
        });
      });
    },
    [inactiveZone, proximity, movementDuration]
  );

  useEffect(() => {
    if (disabled) return;

    const handleScroll = () => handleMove();
    const handlePointerMove = (e) => handleMove(e);

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove, disabled]);

  /* ── Veridian palette gradient ── */
  const veridianGradient = [
    'radial-gradient(circle, #00ffa3 10%, #00ffa300 20%)',
    'radial-gradient(circle at 40% 40%, #bf81ff 5%, #bf81ff00 15%)',
    'radial-gradient(circle at 60% 60%, #00ef99 10%, #00ef9900 20%)',
    'radial-gradient(circle at 40% 60%, #FFCA3A 10%, #FFCA3A00 20%)',
    'repeating-conic-gradient(',
    '  from 236.84deg at 50% 50%,',
    '  #00ffa3 0%,',
    '  #bf81ff calc(25% / var(--repeating-conic-gradient-times)),',
    '  #00ef99 calc(50% / var(--repeating-conic-gradient-times)),',
    '  #FFCA3A calc(75% / var(--repeating-conic-gradient-times)),',
    '  #00ffa3 calc(100% / var(--repeating-conic-gradient-times))',
    ')',
  ].join(',\n');

  const whiteGradient = `repeating-conic-gradient(
    from 236.84deg at 50% 50%,
    #000,
    #000 calc(25% / var(--repeating-conic-gradient-times))
  )`;

  const gradient = variant === 'white' ? whiteGradient : veridianGradient;

  return (
    <>
      {/* Static border fallback when disabled */}
      <div
        className={[
          'pointer-events-none absolute -inset-px rounded-[inherit] border opacity-0 transition-opacity',
          glow ? 'opacity-100' : '',
          variant === 'white' ? 'border-white' : 'border-border',
          disabled ? '!block' : 'hidden',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Animated glow container */}
      <div
        ref={containerRef}
        style={{
          '--blur': `${blur}px`,
          '--spread': spread,
          '--start': '0',
          '--active': '0',
          '--glowingeffect-border-width': `${borderWidth}px`,
          '--repeating-conic-gradient-times': '5',
          '--gradient': gradient,
        }}
        className={[
          'pointer-events-none absolute inset-0 rounded-[inherit] opacity-100 transition-opacity',
          glow ? 'opacity-100' : '',
          blur > 0 ? 'blur-[var(--blur)]' : '',
          className,
          disabled ? '!hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="glow rounded-[inherit] after:content-[''] after:rounded-[inherit] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:[border:var(--glowingeffect-border-width)_solid_transparent] after:[background:var(--gradient)] after:[background-attachment:fixed] after:opacity-[var(--active)] after:transition-opacity after:duration-300 after:[mask-clip:padding-box,border-box] after:[mask-composite:intersect] after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]" />
      </div>
    </>
  );
});

export { GlowingEffect };
