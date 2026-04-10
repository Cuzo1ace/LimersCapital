import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GlassCard } from '../components/GlassCard';
import { GradientText } from '../components/GradientText';
import { CountUp } from '../components/CountUp';
import {
  PORTFOLIO_HOLDINGS,
  TOTAL_PORTFOLIO_USD,
  PORTFOLIO_PNL_USD,
  PORTFOLIO_PNL_PCT,
} from '../data/mock';

const TOKEN_COLORS: Record<string, string> = {
  SOL: '#9945FF',
  BTC: '#F7931A',
  USDC: '#2775CA',
  LIMER: '#00ffa3',
  ETH: '#627EEA',
};

/**
 * Scene 4: Portfolio
 * Total balance, PnL, donut allocation chart, and mini holding cards.
 */
export const Portfolio: React.FC = () => {
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

  // Donut chart draw-in progress
  const donutProgress = interpolate(frame, [30, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Donut geometry
  const radius = 140;
  const strokeWidth = 40;
  const circumference = 2 * Math.PI * radius;

  // Build segment offsets
  let cumulative = 0;
  const segments = PORTFOLIO_HOLDINGS.map((h) => {
    const start = cumulative;
    cumulative += h.allocation;
    return {
      ...h,
      color: TOKEN_COLORS[h.token] ?? COLORS.sea,
      startPct: start,
      lengthPct: h.allocation,
    };
  });

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

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
            color: COLORS.sea,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: labelOpacity,
          }}
        >
          04 · Portfolio
        </div>

        {/* Headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <GradientText fontSize={80}>Track Every Position.</GradientText>
        </div>

        {/* Two-column main content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 80,
            marginTop: 40,
            width: '100%',
          }}
        >
          {/* Left: total balance */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.body,
                fontSize: 18,
                color: COLORS.muted,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Total Balance
            </div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 144,
                fontWeight: 900,
                color: COLORS.txt,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              <CountUp from={0} to={TOTAL_PORTFOLIO_USD} prefix="$" decimals={2} delay={30} />
            </div>
            {/* PnL pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 22px',
                borderRadius: 999,
                background: 'rgba(0,255,163,0.12)',
                border: '1px solid rgba(0,255,163,0.35)',
                boxShadow: '0 0 20px rgba(0,255,163,0.15)',
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.up,
                marginTop: 8,
              }}
            >
              <span>+</span>
              <CountUp from={0} to={PORTFOLIO_PNL_USD} prefix="$" decimals={2} delay={60} />
              <span style={{ opacity: 0.7 }}>·</span>
              <span>+</span>
              <CountUp from={0} to={PORTFOLIO_PNL_PCT} suffix="%" decimals={1} delay={60} />
            </div>
          </div>

          {/* Right: donut chart */}
          <div
            style={{
              position: 'relative',
              width: 360,
              height: 360,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={360}
              height={360}
              viewBox="0 0 360 360"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx={180}
                cy={180}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg) => {
                const segLen = (seg.lengthPct / 100) * circumference;
                const segStart = (seg.startPct / 100) * circumference;
                const drawn = segLen * donutProgress;
                return (
                  <circle
                    key={seg.token}
                    cx={180}
                    cy={180}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    strokeDasharray={`${drawn} ${circumference - drawn}`}
                    strokeDashoffset={-segStart}
                    style={{
                      filter: `drop-shadow(0 0 10px ${seg.color}66)`,
                    }}
                  />
                );
              })}
            </svg>
            {/* Center label */}
            <div
              style={{
                position: 'absolute',
                textAlign: 'center',
                fontFamily: FONTS.headline,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: COLORS.txt,
                  lineHeight: 1,
                }}
              >
                5
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.txt2,
                  letterSpacing: '0.25em',
                  marginTop: 6,
                }}
              >
                TOKENS
              </div>
            </div>
          </div>
        </div>

        {/* Mini holding cards */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 30,
          }}
        >
          {PORTFOLIO_HOLDINGS.map((h, i) => {
            const color = TOKEN_COLORS[h.token] ?? COLORS.sea;
            return (
              <GlassCard
                key={h.token}
                variant="stat"
                delay={180 + i * 15}
                style={{
                  width: 170,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `${color}22`,
                      border: `1px solid ${color}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONTS.headline,
                      fontSize: 12,
                      fontWeight: 800,
                      color,
                    }}
                  >
                    {h.token.slice(0, 2)}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLORS.txt,
                    }}
                  >
                    {h.token}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.txt,
                  }}
                >
                  ${h.valueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 12,
                    color: COLORS.muted,
                  }}
                >
                  {h.amount} {h.token}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
