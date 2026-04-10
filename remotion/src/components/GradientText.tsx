import React from 'react';
import { useCurrentFrame } from 'remotion';
import { FONTS } from '../data/tokens';

interface Props {
  children: React.ReactNode;
  fontSize?: number;
  fontWeight?: number | string;
  style?: React.CSSProperties;
}

/**
 * Animated gradient text — cycles through sea → coral → sun over time.
 * Unlike the app's CSS version, this uses frame-based interpolation so the
 * gradient position is deterministic in every rendered frame.
 */
export const GradientText: React.FC<Props> = ({
  children,
  fontSize = 80,
  fontWeight = 900,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const offset = (frame / 180) * 200;

  return (
    <span
      style={{
        fontFamily: FONTS.headline,
        fontSize,
        fontWeight,
        lineHeight: 1.05,
        backgroundImage: 'linear-gradient(90deg, #00ffa3 0%, #bf81ff 33%, #FFCA3A 66%, #00ffa3 100%)',
        backgroundSize: '200% 100%',
        backgroundPosition: `${offset}% 50%`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        color: 'transparent',
        ...style,
      }}
    >
      {children}
    </span>
  );
};
