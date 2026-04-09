import { motion } from 'framer-motion';

const VARIANTS = {
  default: 'backdrop-blur-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
  elevated: 'backdrop-blur-2xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
  highlight: 'backdrop-blur-xl bg-[rgba(0,255,163,0.06)] border border-[rgba(0,255,163,0.15)] shadow-[0_0_20px_rgba(0,255,163,0.08)]',
  stat: 'backdrop-blur-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]',
};

export default function GlassCard({
  variant = 'default',
  animate = true,
  hoverLift = true,
  className = '',
  children,
  delay = 0,
  ...rest
}) {
  const base = VARIANTS[variant] || VARIANTS.default;
  const hover = hoverLift
    ? 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-[rgba(255,255,255,0.15)]'
    : '';

  const Component = animate ? motion.div : 'div';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 24, delay },
  } : {};

  return (
    <Component
      className={`rounded-xl transition-all duration-300 ${base} ${hover} ${className}`}
      {...motionProps}
      {...rest}
    >
      {children}
    </Component>
  );
}
