import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GlassCard } from '../components/GlassCard';
import { GradientText } from '../components/GradientText';
import { TokenPriceRow } from '../components/TokenPriceRow';
import { MOCK_TOKENS } from '../data/mock';

/**
 * Scene 3: Market
 * Cascading list of Solana tokens with live prices + sparklines.
 */
export const Market: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const headlineOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const headlineY = interpolate(frame, [10, 35], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tokens = MOCK_TOKENS.slice(0, 6);

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      {/* Faint SOLANA branding in the corner */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          right: 60,
          fontFamily: FONTS.headline,
          fontSize: 280,
          fontWeight: 900,
          color: 'rgba(153, 69, 255, 0.05)',
          letterSpacing: '-0.05em',
          lineHeight: 0.85,
          pointerEvents: 'none',
        }}
      >
        SOLANA
      </div>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 110,
          gap: 24,
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.sun,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: labelOpacity,
          }}
        >
          03 · Market
        </div>

        {/* Headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            textAlign: 'center',
          }}
        >
          <GradientText fontSize={80}>Every Solana Token. One Feed.</GradientText>
        </div>

        {/* Token feed card */}
        <GlassCard
          variant="elevated"
          delay={30}
          style={{
            width: 800,
            height: 560,
            padding: 28,
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Search pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 22px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: FONTS.body,
              fontSize: 16,
              color: COLORS.txt2,
            }}
          >
            <span style={{ fontSize: 18 }}>🔍</span>
            <span>Search tokens...</span>
          </div>

          {/* Token list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tokens.map((token, i) => (
              <TokenPriceRow
                key={token.symbol}
                token={token}
                delay={60 + i * 15}
                drawDelay={90 + i * 15}
              />
            ))}
          </div>
        </GlassCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
