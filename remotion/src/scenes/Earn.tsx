import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GlassCard } from '../components/GlassCard';
import { GradientText } from '../components/GradientText';
import { CountUp } from '../components/CountUp';

/**
 * Scene 5: Earn
 * Limer Points counter with floating coins and tier upgrade reveal.
 */
export const Earn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  // Progress bar fill
  const barFill = interpolate(frame, [60, 180], [0, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tier upgraded slide-in (frame 300)
  const tierSpring = spring({
    frame: frame - 300,
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const tierY = (1 - tierSpring) * -120;

  // Floating coins data
  const coins = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 200 + i * 250 + Math.sin(i * 3) * 60,
    delay: 40 + i * 20,
    duration: 220,
  }));

  const activities = [
    { icon: '📚', text: 'Learn +10 LP/lesson' },
    { icon: '📊', text: 'Trade +5 LP/trade' },
    { icon: '🔥', text: 'Streak +25 LP/day' },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      {/* Floating coins layer */}
      {coins.map((c, i) => {
        const localFrame = frame - c.delay;
        const progress = Math.max(0, Math.min(1, localFrame / c.duration));
        const riseY = interpolate(progress, [0, 1], [1100, -100]);
        const opacity = interpolate(progress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
        const wiggleX = Math.sin(frame / 15 + i) * 10;
        return (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              left: c.x + wiggleX,
              top: riseY,
              fontSize: 52,
              opacity,
              filter: 'drop-shadow(0 0 18px rgba(255,202,58,0.45))',
              pointerEvents: 'none',
            }}
          >
            🪙
          </div>
        );
      })}

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 100,
          gap: 20,
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
          05 · Earn
        </div>

        {/* Headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <GradientText fontSize={80}>Earn $LIMER Just By Using It.</GradientText>
        </div>

        {/* LP counter card */}
        <GlassCard
          variant="highlight"
          delay={40}
          style={{
            width: 600,
            height: 400,
            padding: 40,
            marginTop: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              color: COLORS.muted,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Limer Points
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 160,
              fontWeight: 900,
              color: COLORS.sea,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              textShadow: '0 0 40px rgba(0,255,163,0.35)',
            }}
          >
            <CountUp from={0} to={2450} suffix=" LP" delay={40} durationSec={2} />
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', marginTop: 16 }}>
            <div
              style={{
                width: '100%',
                height: 14,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  width: `${barFill * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${COLORS.sea}, ${COLORS.coral})`,
                  boxShadow: `0 0 16px ${COLORS.sea}`,
                  borderRadius: 999,
                }}
              />
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.txt2,
                fontWeight: 600,
              }}
            >
              <span>Reef Spotter</span>
              <span style={{ color: COLORS.sea }}>→ Pearl Diver</span>
            </div>
          </div>
        </GlassCard>

        {/* Activity pills */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 24,
          }}
        >
          {activities.map((a, i) => {
            const pillSpring = spring({
              frame: frame - (120 + i * 15),
              fps,
              config: { damping: 20, stiffness: 220 },
            });
            return (
              <div
                key={a.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 26px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontFamily: FONTS.body,
                  fontSize: 20,
                  fontWeight: 600,
                  color: COLORS.txt,
                  opacity: pillSpring,
                  transform: `translateY(${(1 - pillSpring) * 16}px)`,
                }}
              >
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <span>{a.text}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Tier Upgraded banner */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(${tierY}px)`,
          opacity: tierSpring,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: FONTS.headline,
            fontSize: 96,
            fontWeight: 900,
            color: COLORS.sun,
            letterSpacing: '-0.02em',
            textShadow: `0 0 40px ${COLORS.sun}, 0 0 80px rgba(255,202,58,0.6)`,
          }}
        >
          TIER UPGRADED!
        </div>
      </div>
    </AbsoluteFill>
  );
};
