/**
 * useScrollReveal — scroll-triggered entrance animation hook
 *
 * Wraps framer-motion's useInView to provide consistent "reveal on scroll"
 * behavior across the app. Returns props you spread onto a motion.div.
 *
 * Usage:
 *   const reveal = useScrollReveal();
 *   <motion.div {...reveal}>content</motion.div>
 *
 * With stagger (parent wraps children):
 *   const reveal = useScrollReveal({ stagger: 0.08 });
 *   <motion.div {...reveal}>
 *     <motion.div variants={reveal.childVariants}>row 1</motion.div>
 *     <motion.div variants={reveal.childVariants}>row 2</motion.div>
 *   </motion.div>
 */
import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

const DIRECTION_MAP = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
};

export default function useScrollReveal({
  direction = 'up',
  distance = 40,
  duration = 0.5,
  delay = 0,
  stagger = 0,
  once = true,
  margin = '-60px',
} = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin });
  const prefersReducedMotion = useReducedMotion();

  // Build directional offset
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'down' || direction === 'right' ? -1 : 1;
  const offset = { [axis]: sign * distance };

  // If reduced motion, skip animation entirely
  if (prefersReducedMotion) {
    return {
      ref,
      initial: undefined,
      animate: undefined,
      variants: undefined,
      childVariants: { hidden: {}, visible: {} },
    };
  }

  const containerVariants = {
    hidden: {
      opacity: 0,
      ...offset,
    },
    visible: {
      opacity: 1,
      [axis]: 0,
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
        ...(stagger > 0 && {
          staggerChildren: stagger,
          delayChildren: delay,
        }),
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: duration * 0.7,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  // Return motion props + childVariants separately.
  // IMPORTANT: Do NOT spread the whole object onto a motion.div — destructure first:
  //   const { childVariants, ...motionProps } = useScrollReveal();
  //   <motion.div {...motionProps}>
  //     <motion.div variants={childVariants}>row</motion.div>
  //   </motion.div>
  return {
    ref,
    variants: containerVariants,
    initial: 'hidden',
    animate: isInView ? 'visible' : 'hidden',
    childVariants,
  };
}
