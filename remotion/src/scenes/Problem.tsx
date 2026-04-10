import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GradientText } from '../components/GradientText';
import { GlassCard } from '../components/GlassCard';
import { CountUp } from '../components/CountUp';

/**
 * Scene: Problem / Opportunity
 * 3 big stat cards — Caribbean nations, native DeFi platforms, remittances.
 */
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const headlineOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const untilNowOpacity = interpolate(frame, [300, 340], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const untilNowY = interpolate(frame, [300, 340], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const CARDS = [
    {
      delay: 0,
      bigValue: null as string | null,
      countTo: 30,
      suffix: '+',
      color: COLORS.sea,
      label: 'Caribbean Nations',
    },
    {
      delay: 30,
      bigValue: '0',
      countTo: null,
      suffix: '',
      color: COLORS.coral,
      label: 'Native DeFi Platforms',
    },
    {
      delay: 60,
      bigValue: '$50B+',
      countTo: null,
      suffix: '',
      color: COLORS.sun,
      label: 'Annual Remittances',
    },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: headlineOpacity,
        }}
      >
        <GradientText fontSize={80} fontWeight={900}>
          The Opportunity
        </GradientText>
      </div>

      {/* Stat cards row */}
      <div
        style={{
          position: 'absolute',
          top: 340,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          padding: '0 80px',
        }}
      >
        {CARDS.map((card) => (
          <div key={card.label} style={{ width: 480 }}>
            <GlassCard variant="elevated" delay={card.delay}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '56px 32px',
                  gap: 20,
                  minHeight: 380,
                }}
              >
                <div
                  style={{
                    fontFamily: FONTS.headline,
                    fontSize: 180,
                    fontWeight: 900,
                    color: card.color,
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {card.countTo !== null ? (
                    <CountUp
                      from={0}
                      to={card.countTo}
                      suffix={card.suffix}
                      durationSec={2}
                      delay={card.delay + 15}
                      style={{
                        fontFamily: FONTS.headline,
                        fontSize: 180,
                        fontWeight: 900,
                        color: card.color,
                        lineHeight: 0.95,
                      }}
                    />
                  ) : (
                    card.bigValue
                  )}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 22,
                    fontWeight: 500,
                    color: COLORS.txt2,
                    textAlign: 'center',
                    letterSpacing: '0.04em',
                  }}
                >
                  {card.label}
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* "Until now." */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: untilNowOpacity,
          transform: `translateY(${untilNowY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 36,
            fontStyle: 'italic',
            color: COLORS.txt,
          }}
        >
          Until now.
        </div>
      </div>
    </AbsoluteFill>
  );
};
