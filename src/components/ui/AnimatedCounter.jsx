/**
 * AnimatedCounter — smooth number counting with color flash
 *
 * Animates from previous value to new value using framer-motion springs.
 * Green flash on increase, coral on decrease. Never snap-to-value again.
 *
 * Usage:
 *   <AnimatedCounter value={portfolio.totalPnl} format="currency" />
 *   <AnimatedCounter value={xpEarned} suffix=" XP" />
 *   <AnimatedCounter value={changePct} format="percent" />
 */
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

const FORMATTERS = {
  currency: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  percent: new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  number: new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
  compact: new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }),
};

export default function AnimatedCounter({
  value,
  format = 'number',
  prefix = '',
  suffix = '',
  className = '',
  flashColor = true,
  duration,
}) {
  const prefersReducedMotion = useReducedMotion();
  const prevValue = useRef(value);
  const displayRef = useRef(null);

  // For percent format, Intl expects 0.05 for 5% — but our values are already
  // in percentage form (e.g. 5.2 means 5.2%). Divide by 100 for the formatter.
  const formatValue = (v) => {
    const formatter = FORMATTERS[format] || FORMATTERS.number;
    if (format === 'percent') return formatter.format(v / 100);
    return formatter.format(v);
  };

  // Motion spring
  const motionValue = useMotionValue(prevValue.current);
  const springValue = useSpring(motionValue, {
    stiffness: 80,
    damping: 20,
    ...(duration && { duration: duration * 1000 }),
  });

  // Color flash state
  const flashOpacity = useMotionValue(0);
  const flashSpring = useSpring(flashOpacity, { stiffness: 200, damping: 25 });

  // Determine direction of change
  const direction = value > prevValue.current ? 'up' : value < prevValue.current ? 'down' : 'none';
  const flashBg = direction === 'up'
    ? 'rgba(0,255,163,0.12)'
    : direction === 'down'
    ? 'rgba(255,113,108,0.12)'
    : 'transparent';

  useEffect(() => {
    if (prefersReducedMotion) {
      // Just update the display directly
      if (displayRef.current) {
        displayRef.current.textContent = `${prefix}${formatValue(value)}${suffix}`;
      }
      prevValue.current = value;
      return;
    }

    motionValue.set(value);

    // Flash on change
    if (flashColor && value !== prevValue.current) {
      flashOpacity.set(1);
      const t = setTimeout(() => flashOpacity.set(0), 400);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  // Subscribe to spring updates and render the formatted value
  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsubscribe = springValue.on('change', (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = `${prefix}${formatValue(latest)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix, format]);

  // Reduced motion: static render
  if (prefersReducedMotion) {
    return (
      <span className={className} ref={displayRef}>
        {prefix}{formatValue(value)}{suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{
        backgroundColor: flashColor
          ? useTransform(flashSpring, [0, 1], ['transparent', flashBg])
          : 'transparent',
        borderRadius: 4,
        padding: flashColor ? '0 4px' : 0,
        transition: 'background-color 0.4s ease',
      }}
    >
      <span ref={displayRef}>
        {prefix}{formatValue(value)}{suffix}
      </span>
    </motion.span>
  );
}
