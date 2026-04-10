import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GradientText } from '../components/GradientText';
import { GlassCard } from '../components/GlassCard';

/**
 * Scene: Learn (01)
 * Module card with animated progress bar, 3 lesson previews,
 * quiz correct badge, and LP reward toast.
 */
export const Learn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Label + headline fade
  const labelOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Progress bar animates 0 → 37% between frames 60 and 120
  const progressPct = interpolate(frame, [60, 120], [0, 37], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Correct badge spring (frame 300)
  const correctSpring = spring({
    frame: frame - 300,
    fps,
    config: { damping: 10, stiffness: 220 },
  });
  const correctOpacity = interpolate(correctSpring, [0, 1], [0, 1]);
  const correctScale = interpolate(correctSpring, [0, 1], [0.5, 1]);

  // LP toast slide from right (frame 360)
  const toastSpring = spring({
    frame: frame - 360,
    fps,
    config: { damping: 16, stiffness: 160 },
  });
  const toastX = interpolate(toastSpring, [0, 1], [420, 0]);
  const toastOpacity = interpolate(toastSpring, [0, 1], [0, 1]);

  const LESSONS = [
    { emoji: '👛', title: 'Wallets 101' },
    { emoji: '⚡', title: 'DeFi Basics' },
    { emoji: '◎', title: 'Solana Deep Dive' },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      {/* Top label */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 120,
          fontFamily: FONTS.body,
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.sea,
          letterSpacing: '0.28em',
          opacity: labelOpacity,
        }}
      >
        01 · LEARN
      </div>

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 120,
          opacity: labelOpacity,
        }}
      >
        <GradientText fontSize={80} fontWeight={900}>
          Master Crypto From Zero.
        </GradientText>
      </div>

      {/* Center — Module card */}
      <div
        style={{
          position: 'absolute',
          top: 340,
          left: '50%',
          marginLeft: -350,
          width: 700,
        }}
      >
        <GlassCard variant="elevated" delay={30}>
          <div
            style={{
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              minHeight: 200,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                  style={{
                    fontFamily: FONTS.headline,
                    fontSize: 34,
                    fontWeight: 700,
                    color: COLORS.txt,
                  }}
                >
                  Blockchain Basics
                </div>
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    color: COLORS.txt2,
                  }}
                >
                  Lesson 3 of 8
                </div>
              </div>
              {/* +25 XP badge */}
              <div
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  background: 'rgba(0,255,163,0.12)',
                  border: `1px solid ${COLORS.sea}`,
                  fontFamily: FONTS.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.sea,
                }}
              >
                +25 XP
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  width: 500,
                  height: 12,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${COLORS.sea}, ${COLORS.coral})`,
                    boxShadow: `0 0 14px ${COLORS.sea}`,
                    transition: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 14,
                  color: COLORS.txt2,
                }}
              >
                {progressPct.toFixed(0)}% complete
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 3 lesson preview cards */}
      <div
        style={{
          position: 'absolute',
          top: 620,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {LESSONS.map((lesson, i) => (
          <div key={lesson.title} style={{ width: 260 }}>
            <GlassCard variant="default" delay={120 + i * 15}>
              <div
                style={{
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 150,
                }}
              >
                <div style={{ fontSize: 44 }}>{lesson.emoji}</div>
                <div
                  style={{
                    fontFamily: FONTS.headline,
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLORS.txt,
                    textAlign: 'center',
                  }}
                >
                  {lesson.title}
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Correct! badge — springs in at frame 300 */}
      <div
        style={{
          position: 'absolute',
          top: 860,
          left: '50%',
          marginLeft: -110,
          padding: '16px 32px',
          borderRadius: 999,
          background: 'rgba(0,255,163,0.18)',
          border: `2px solid ${COLORS.sea}`,
          boxShadow: `0 0 30px ${COLORS.sea}`,
          fontFamily: FONTS.headline,
          fontSize: 26,
          fontWeight: 800,
          color: COLORS.sea,
          opacity: correctOpacity,
          transform: `scale(${correctScale})`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        Correct! ✓
      </div>

      {/* LP reward toast — slides in from right at frame 360 */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          right: 120,
          transform: `translateX(${toastX}px)`,
          opacity: toastOpacity,
        }}
      >
        <GlassCard variant="highlight" delay={0}>
          <div
            style={{
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 30 }}>✨</div>
            <div
              style={{
                fontFamily: FONTS.headline,
                fontSize: 22,
                fontWeight: 800,
                color: COLORS.sea,
              }}
            >
              +10 LP earned
            </div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};
