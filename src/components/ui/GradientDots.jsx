import { motion } from 'framer-motion';

/**
 * GradientDots — animated hexagonal dot grid with color-cycling radial gradients.
 * Creates a living, breathing background surface.
 *
 * Props:
 *   dotSize            — dot cutout size (px), default 8
 *   spacing            — distance between dots (px), default 10
 *   duration           — gradient movement cycle (s), default 30
 *   colorCycleDuration — hue-rotate cycle (s), default 6
 *   backgroundColor    — base fill, default 'var(--color-night)'
 *   className          — extra classes
 */
export default function GradientDots({
  dotSize = 8,
  spacing = 10,
  duration = 30,
  colorCycleDuration = 6,
  backgroundColor = 'var(--color-night)',
  className = '',
  style,
  ...props
}) {
  const hexSpacing = spacing * 1.732;

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        ...style,
        backgroundColor,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, #00ffa3, transparent 60%),
          radial-gradient(circle at 50% 50%, #bf81ff, transparent 60%),
          radial-gradient(circle at 50% 50%, #00ef99, transparent 60%),
          radial-gradient(ellipse at 50% 50%, #FFCA3A, transparent 60%)
        `,
        backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
        backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
      }}
      animate={{
        backgroundPosition: [
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px`,
          `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
        ],
        filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
      }}
      transition={{
        backgroundPosition: {
          duration,
          ease: 'linear',
          repeat: Infinity,
        },
        filter: {
          duration: colorCycleDuration,
          ease: 'linear',
          repeat: Infinity,
        },
      }}
      {...props}
    />
  );
}
