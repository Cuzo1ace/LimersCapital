import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GradientText } from '../components/GradientText';
import { GlassCard } from '../components/GlassCard';
import { CountUp } from '../components/CountUp';

/**
 * Scene: Hero
 * Left: eyebrow + massive gradient headline + subtitle.
 * Right: 3 floating stat cards.
 */
export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animations
  const eyebrowOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const subtitleSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 18, stiffness: 140 },
  });
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleSpring, [0, 1], [20, 0]);

  const STATS = [
    { label: 'USERS', to: 1247, color: COLORS.sea, delay: 45, isCount: true },
    { label: 'NATIONS', value: '30+', color: COLORS.coral, delay: 60, isCount: false },
    { label: 'PAPER TRADE', value: '$100K', color: COLORS.sun, delay: 75, isCount: false },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      {/* LEFT COLUMN */}
      <div
        style={{
          position: 'absolute',
          left: 120,
          top: 220,
          width: 920,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.sea,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            opacity: eyebrowOpacity,
          }}
        >
          The Caribbean's Solana Platform
        </div>

        {/* Massive Gradient headline */}
        <div style={{ lineHeight: 0.95 }}>
          <GradientText fontSize={120} fontWeight={900}>
            Learn Crypto.
          </GradientText>
          <div style={{ marginTop: 8 }}>
            <GradientText fontSize={120} fontWeight={900}>
              Trade Smart.
            </GradientText>
          </div>
          <div style={{ marginTop: 8 }}>
            <GradientText fontSize={120} fontWeight={900}>
              Earn $LIMER.
            </GradientText>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 24,
            color: COLORS.txt2,
            lineHeight: 1.5,
            maxWidth: 820,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          From zero to DeFi — education, paper trading, and real rewards on Solana.
        </div>
      </div>

      {/* RIGHT COLUMN — floating stat cards */}
      <div
        style={{
          position: 'absolute',
          left: 1400,
          top: 260,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: 380,
        }}
      >
        {STATS.map((stat, i) => {
          const floatY = Math.sin(frame / 20 + i) * 4;
          return (
            <div key={stat.label} style={{ transform: `translateY(${floatY}px)` }}>
              <GlassCard variant="stat" delay={stat.delay}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '28px 36px',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.txt2,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.headline,
                      fontSize: 56,
                      fontWeight: 800,
                      color: stat.color,
                      lineHeight: 1,
                    }}
                  >
                    {stat.isCount ? (
                      <CountUp
                        from={0}
                        to={stat.to!}
                        durationSec={1.8}
                        delay={stat.delay + 10}
                        style={{
                          fontFamily: FONTS.headline,
                          fontSize: 56,
                          fontWeight: 800,
                          color: stat.color,
                        }}
                      />
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
