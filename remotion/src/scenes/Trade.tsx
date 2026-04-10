import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GradientText } from '../components/GradientText';
import { GlassCard } from '../components/GlassCard';

/**
 * Scene: Trade (02)
 * Candlestick chart draws in, right panel has buy form,
 * order confirmation toast slides in.
 */

// Deterministic candle data: 20 candles
interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

const CANDLES: Candle[] = (() => {
  const arr: Candle[] = [];
  let price = 140;
  for (let i = 0; i < 20; i++) {
    const change = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * 4;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(Math.sin(i * 2.1)) * 3 + 1;
    const low = Math.min(open, close) - Math.abs(Math.cos(i * 1.7)) * 3 - 1;
    arr.push({ open, close, high, low });
    price = close;
  }
  return arr;
})();

export const Trade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header fade
  const headerOpacity = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Candle draw progress 0..1 between 30 and 180
  const drawProgress = interpolate(frame, [30, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Toast spring (frame 450)
  const toastSpring = spring({
    frame: frame - 450,
    fps,
    config: { damping: 16, stiffness: 160 },
  });
  const toastX = interpolate(toastSpring, [0, 1], [420, 0]);
  const toastOpacity = interpolate(toastSpring, [0, 1], [0, 1]);

  // Chart layout
  const CHART_W = 820;
  const CHART_H = 300;
  const CHART_PAD = 30;
  const allHighs = CANDLES.map((c) => c.high);
  const allLows = CANDLES.map((c) => c.low);
  const priceMax = Math.max(...allHighs);
  const priceMin = Math.min(...allLows);
  const priceRange = priceMax - priceMin;
  const candleSlot = (CHART_W - CHART_PAD * 2) / CANDLES.length;
  const candleWidth = candleSlot * 0.6;

  const priceToY = (p: number) =>
    CHART_PAD + ((priceMax - p) / priceRange) * (CHART_H - CHART_PAD * 2);

  const TIMEFRAMES = ['1H', '4H', '1D', '1W', '1M'];

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
          color: COLORS.coral,
          letterSpacing: '0.28em',
          opacity: headerOpacity,
        }}
      >
        02 · TRADE
      </div>

      {/* Headline */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 120,
          opacity: headerOpacity,
        }}
      >
        <GradientText fontSize={80} fontWeight={900}>
          Paper Trade With $100K.
        </GradientText>
      </div>

      {/* Center chart */}
      <div
        style={{
          position: 'absolute',
          top: 340,
          left: 120,
          width: 900,
        }}
      >
        <GlassCard variant="elevated" delay={20}>
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Token selector pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: 'rgba(0,255,163,0.1)',
                  border: `1px solid ${COLORS.sea}`,
                  fontFamily: FONTS.headline,
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.sea,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                ◎ SOL/USDC
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.up,
                  marginLeft: 'auto',
                }}
              >
                $148.32 ▲ 2.4%
              </div>
            </div>

            {/* Candlestick chart */}
            <svg
              width={CHART_W}
              height={CHART_H}
              style={{
                display: 'block',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Horizontal grid lines */}
              {[0.25, 0.5, 0.75].map((t) => (
                <line
                  key={t}
                  x1={CHART_PAD}
                  y1={CHART_PAD + t * (CHART_H - CHART_PAD * 2)}
                  x2={CHART_W - CHART_PAD}
                  y2={CHART_PAD + t * (CHART_H - CHART_PAD * 2)}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}

              {CANDLES.map((c, i) => {
                // Each candle "reveals" when drawProgress >= i/total
                const candleRevealT = i / CANDLES.length;
                const reveal = interpolate(drawProgress, [candleRevealT, candleRevealT + 0.06], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                if (reveal <= 0) return null;

                const isGreen = c.close >= c.open;
                const color = isGreen ? COLORS.up : COLORS.down;
                const x = CHART_PAD + i * candleSlot + (candleSlot - candleWidth) / 2;
                const cx = x + candleWidth / 2;
                const yHigh = priceToY(c.high);
                const yLow = priceToY(c.low);
                const yOpen = priceToY(c.open);
                const yClose = priceToY(c.close);
                const bodyY = Math.min(yOpen, yClose);
                const bodyH = Math.max(2, Math.abs(yOpen - yClose));

                return (
                  <g key={i} opacity={reveal}>
                    {/* Wick */}
                    <line
                      x1={cx}
                      y1={yHigh}
                      x2={cx}
                      y2={yLow}
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    {/* Body */}
                    <rect
                      x={x}
                      y={bodyY}
                      width={candleWidth}
                      height={bodyH}
                      fill={color}
                      rx={1}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Timeframe pills */}
            <div style={{ display: 'flex', gap: 10 }}>
              {TIMEFRAMES.map((tf) => {
                const active = tf === '1D';
                return (
                  <div
                    key={tf}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      background: active ? 'rgba(0,255,163,0.15)' : 'rgba(255,255,255,0.04)',
                      border: active
                        ? `1px solid ${COLORS.sea}`
                        : '1px solid rgba(255,255,255,0.08)',
                      fontFamily: FONTS.mono,
                      fontSize: 14,
                      fontWeight: 700,
                      color: active ? COLORS.sea : COLORS.txt2,
                    }}
                  >
                    {tf}
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Right panel — Buy form */}
      <div
        style={{
          position: 'absolute',
          top: 340,
          left: 1080,
          width: 340,
        }}
      >
        <GlassCard variant="elevated" delay={40}>
          <div
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              minHeight: 440,
            }}
          >
            {/* Buy/Sell toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: 4,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  borderRadius: 8,
                  background: COLORS.sea,
                  fontFamily: FONTS.headline,
                  fontSize: 16,
                  fontWeight: 800,
                  color: COLORS.night,
                }}
              >
                Buy
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '12px 0',
                  textAlign: 'center',
                  fontFamily: FONTS.headline,
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.txt2,
                }}
              >
                Sell
              </div>
            </div>

            {/* Amount input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 13,
                  color: COLORS.txt2,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Amount
              </div>
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: FONTS.mono,
                  fontSize: 26,
                  fontWeight: 700,
                  color: COLORS.txt,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>5.00</span>
                <span style={{ color: COLORS.txt2, fontSize: 18 }}>SOL</span>
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '14px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontSize: 14,
                  color: COLORS.txt2,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Total
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 24,
                  fontWeight: 800,
                  color: COLORS.txt,
                }}
              >
                $741.60
              </div>
            </div>

            {/* Buy button */}
            <div
              style={{
                marginTop: 'auto',
                padding: '18px 0',
                borderRadius: 12,
                background: COLORS.sea,
                boxShadow: `0 0 24px ${COLORS.sea}`,
                fontFamily: FONTS.headline,
                fontSize: 20,
                fontWeight: 900,
                color: COLORS.night,
                textAlign: 'center',
              }}
            >
              Buy SOL
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Order filled toast — slides in from right at frame 450 */}
      <div
        style={{
          position: 'absolute',
          top: 160,
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
              minWidth: 260,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: COLORS.sea,
                color: COLORS.night,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONTS.headline,
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontFamily: FONTS.headline,
                fontSize: 22,
                fontWeight: 800,
                color: COLORS.sea,
              }}
            >
              Order filled
            </div>
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  );
};
