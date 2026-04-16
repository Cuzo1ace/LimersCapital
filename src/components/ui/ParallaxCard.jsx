/**
 * ParallaxCard — cursor-driven 3D tilt for premium card feel
 *
 * Wraps any content with a perspective transform that follows the mouse.
 * Subtle by default (depth 0.03 = ~3° max tilt). Disabled on touch devices
 * and when the user prefers reduced motion.
 *
 * Usage:
 *   <ParallaxCard>
 *     <div>premium content</div>
 *   </ParallaxCard>
 *
 *   <ParallaxCard depth={0.05} glare>
 *     <div>extra dramatic</div>
 *   </ParallaxCard>
 *
 * Compose with GlassCard:
 *   <GlassCard parallax>content</GlassCard>
 */
import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

const SPRING_CONFIG = { stiffness: 150, damping: 15, mass: 0.5 };

export default function ParallaxCard({
  children,
  depth = 0.03,
  glare = false,
  className = '',
  style = {},
  ...rest
}) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  // Check for touch device (no hover capability)
  const isTouchDevice = typeof window !== 'undefined' &&
    window.matchMedia('(hover: none)').matches;

  // Motion values for rotation
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, SPRING_CONFIG);
  const springY = useSpring(rotateY, SPRING_CONFIG);

  // Glare position (optional)
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || prefersReducedMotion || isTouchDevice) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalized offset from center (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    // Apply rotation (inverted Y for natural tilt feel)
    const maxRotation = depth * 500; // depth 0.03 → ~15° max
    rotateX.set(-normalizedY * maxRotation);
    rotateY.set(normalizedX * maxRotation);

    // Glare follows cursor
    if (glare) {
      glareX.set(((e.clientX - rect.left) / rect.width) * 100);
      glareY.set(((e.clientY - rect.top) / rect.height) * 100);
    }
  }, [depth, prefersReducedMotion, isTouchDevice, glare]);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    rotateX.set(0);
    rotateY.set(0);
    if (glare) {
      glareX.set(50);
      glareY.set(50);
    }
  }, [glare]);

  // Disabled: render children without wrapper motion
  if (prefersReducedMotion || isTouchDevice) {
    return (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`gpu-accelerated ${className}`}
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
        rotateX: springX,
        rotateY: springY,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}

      {/* Optional glare overlay */}
      {glare && isHovering && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </motion.div>
  );
}
