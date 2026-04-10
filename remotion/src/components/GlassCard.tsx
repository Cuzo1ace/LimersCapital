import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  variant?: 'default' | 'elevated' | 'highlight' | 'stat';
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<NonNullable<Props['variant']>, React.CSSProperties> = {
  default: {
    backdropFilter: 'blur(24px)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  elevated: {
    backdropFilter: 'blur(32px)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  highlight: {
    backdropFilter: 'blur(24px)',
    background: 'rgba(0,255,163,0.06)',
    border: '1px solid rgba(0,255,163,0.15)',
    boxShadow: '0 0 20px rgba(0,255,163,0.08)',
  },
  stat: {
    backdropFilter: 'blur(16px)',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
};

/**
 * Glass card with spring-in entrance animation — mirrors the app's GlassCard
 * but animated via Remotion's spring driven by current frame.
 */
export const GlassCard: React.FC<Props> = ({
  children,
  delay = 0,
  variant = 'default',
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 24, stiffness: 300, mass: 0.6 },
  });

  return (
    <div
      style={{
        ...VARIANT_STYLES[variant],
        borderRadius: 16,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 16}px) scale(${0.96 + entrance * 0.04})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
