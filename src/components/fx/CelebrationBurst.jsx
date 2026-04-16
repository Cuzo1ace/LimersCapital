/**
 * CelebrationBurst — particle burst effects for reward moments
 *
 * Imperative API: call fire() to trigger a burst at a specific point.
 * Renders 16 absolute-positioned particles that scatter and fade.
 *
 * Usage:
 *   const { fire, CelebrationPortal } = useCelebration();
 *   <div ref={anchorRef}>
 *     <CelebrationPortal />
 *     <button onClick={() => fire('xp')}>Earn XP</button>
 *   </div>
 *
 * Types:
 *   xp     — sea green upward scatter
 *   badge  — gold radial burst
 *   profit — confetti mix (green + gold + coral)
 *   streak — warm gradient trail upward
 */
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// ── Color palettes per celebration type ─────────────────────────────────

const PALETTES = {
  xp: ['#00ffa3', '#00ef99', '#2D9B56', '#00ffa3', '#00c882'],
  badge: ['#FFCA3A', '#D4AF37', '#FFE066', '#FFC107', '#FFCA3A'],
  profit: ['#00ffa3', '#FFCA3A', '#D4AF37', '#00ef99', '#FFE066'],
  streak: ['#FFCA3A', '#FF9F43', '#ff716c', '#FF6B6B', '#FFD93D'],
};

const PARTICLE_COUNT = 16;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticles(type) {
  const palette = PALETTES[type] || PALETTES.xp;
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: `${Date.now()}-${i}`,
    color: palette[i % palette.length],
    // Directional scatter
    x: randomBetween(-70, 70),
    y: type === 'streak'
      ? randomBetween(-100, -30)    // streak: mostly upward
      : randomBetween(-90, -10),    // others: upward scatter
    rotation: randomBetween(-180, 180),
    scale: randomBetween(0.4, 1),
    duration: randomBetween(0.5, 0.9),
    delay: randomBetween(0, 0.15),
    size: randomBetween(4, 10),
    // Shape variety
    shape: i % 4 === 0 ? 'circle' : i % 4 === 1 ? 'square' : i % 4 === 2 ? 'diamond' : 'circle',
  }));
}

// ── Particle component ──────────────────────────────────────────────────

function Particle({ particle }) {
  const shapeClass = particle.shape === 'diamond' ? 'rotate-45' : '';
  const borderRadius = particle.shape === 'circle' ? '50%' : particle.shape === 'square' ? '2px' : '1px';

  return (
    <motion.div
      initial={{
        x: 0,
        y: 0,
        scale: particle.scale,
        opacity: 1,
        rotate: 0,
      }}
      animate={{
        x: particle.x,
        y: particle.y,
        scale: 0,
        opacity: 0,
        rotate: particle.rotation,
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`absolute pointer-events-none ${shapeClass}`}
      style={{
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        borderRadius,
        left: '50%',
        top: '50%',
        marginLeft: -particle.size / 2,
        marginTop: -particle.size / 2,
        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}40`,
      }}
    />
  );
}

// ── Burst container ─────────────────────────────────────────────────────

function BurstContainer({ bursts }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50">
      <AnimatePresence>
        {bursts.map((burst) => (
          <div key={burst.id} className="absolute inset-0">
            {burst.particles.map((p) => (
              <Particle key={p.id} particle={p} />
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Hook: useCelebration ────────────────────────────────────────────────

/**
 * Returns { fire, CelebrationPortal }.
 *
 * fire(type) — trigger a burst. Types: 'xp', 'badge', 'profit', 'streak'.
 * CelebrationPortal — render this inside the container where bursts should appear.
 *
 * Fully suppressed under useReducedMotion().
 */
export function useCelebration() {
  const [bursts, setBursts] = useState([]);
  const prefersReducedMotion = useReducedMotion();
  const cleanupRef = useRef(null);

  const fire = useCallback((type = 'xp') => {
    // Skip particles if reduced motion — the toast still fires separately
    if (prefersReducedMotion) return;

    const burst = {
      id: `burst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      particles: createParticles(type),
    };

    setBursts((prev) => [...prev, burst]);

    // Clean up after longest particle duration + delay (1.1s is safe ceiling)
    if (cleanupRef.current) clearTimeout(cleanupRef.current);
    cleanupRef.current = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== burst.id));
    }, 1100);
  }, [prefersReducedMotion]);

  const CelebrationPortal = useCallback(
    () => <BurstContainer bursts={bursts} />,
    [bursts]
  );

  return { fire, CelebrationPortal };
}

export default CelebrationBurst;

function CelebrationBurst() {
  return null; // Use useCelebration() hook instead
}
