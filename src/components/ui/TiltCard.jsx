import { useRef, useState, useCallback } from 'react';

/**
 * TiltCard — 3D tilt + spotlight interaction for any card surface.
 *
 * Tracks the cursor inside the element and rotates the card on the X/Y
 * axes. An optional radial-gradient spotlight follows the pointer for
 * a glassy hover state.
 *
 * Props:
 *   tiltLimit    — max rotation in degrees (default 15)
 *   scale        — hover scale (default 1.05)
 *   perspective  — px (default 1200) — larger = subtler
 *   effect       — 'gravitate' (tilt toward cursor) | 'evade' (tilt away, default)
 *   spotlight    — show cursor-following highlight (default true)
 *   className    — extra classes appended to the root
 *   style        — extra inline styles merged with the transform
 *   children     — card contents
 */
export default function TiltCard({
  tiltLimit = 15,
  scale = 1.05,
  perspective = 1200,
  effect = 'evade',
  spotlight = true,
  className = '',
  style,
  children,
  ...rest
}) {
  const cardRef = useRef(null);
  const restTransform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  const [transform, setTransform] = useState(restTransform);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const dir = effect === 'evade' ? -1 : 1;

  const handlePointerMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const xRot = (py - 0.5) * (tiltLimit * 2) * dir;
    const yRot = (px - 0.5) * -(tiltLimit * 2) * dir;
    setTransform(
      `perspective(${perspective}px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale3d(${scale}, ${scale}, ${scale})`,
    );
    if (spotlight) {
      setSpotlightPos({ x: px * 100, y: py * 100 });
    }
  }, [tiltLimit, scale, perspective, dir, spotlight]);

  const handlePointerEnter = useCallback(() => setIsHovered(true), []);
  const handlePointerLeave = useCallback(() => {
    setTransform(restTransform);
    setIsHovered(false);
  }, [restTransform]);

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`will-change-transform relative overflow-hidden ${className}`}
      style={{
        transform,
        transition: 'transform 0.2s ease-out',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      {...rest}
    >
      {children}
      {spotlight && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s', borderRadius: 'inherit' }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: '200%',
              height: '200%',
              left: `${spotlightPos.x}%`,
              top: `${spotlightPos.y}%`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 40%)',
            }}
          />
        </div>
      )}
    </div>
  );
}
