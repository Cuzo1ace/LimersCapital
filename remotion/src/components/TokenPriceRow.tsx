import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { MiniSparkline } from './MiniSparkline';

export interface Token {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sparkline: number[];
  color: string;
}

interface Props {
  token: Token;
  delay?: number;
  drawDelay?: number;
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ].join(',');
};

const fmtPrice = (p: number) => {
  if (p < 0.01) return p.toPrecision(3);
  if (p < 1) return p.toFixed(4);
  if (p < 1000) return p.toFixed(2);
  return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const TokenPriceRow: React.FC<Props> = ({ token, delay = 0, drawDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 22, stiffness: 260, mass: 0.7 },
  });

  const isPositive = token.change24h >= 0;
  const changeColor = isPositive ? COLORS.up : COLORS.down;
  const rgb = hexToRgb(token.color);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 20px',
        height: 72,
        borderRadius: 16,
        backdropFilter: 'blur(24px)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        opacity: entrance,
        transform: `translateX(${(1 - entrance) * -20}px)`,
        fontFamily: FONTS.body,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `rgba(${rgb},0.18)`,
          boxShadow: `0 0 16px rgba(${rgb},0.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: token.color, fontWeight: 800, fontSize: 16 }}>
          {token.symbol.slice(0, 2)}
        </span>
      </div>

      {/* Name + Symbol */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.txt }}>
          {token.name}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: FONTS.mono }}>
          {token.symbol}
        </div>
      </div>

      {/* Sparkline */}
      <MiniSparkline
        data={token.sparkline}
        color={changeColor}
        width={80}
        height={32}
        drawDelay={drawDelay}
      />

      {/* Price + Change */}
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <div style={{ fontSize: 16, fontWeight: 600, fontFamily: FONTS.mono, color: COLORS.txt }}>
          ${fmtPrice(token.price)}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONTS.mono,
            color: changeColor,
          }}
        >
          {isPositive ? '+' : ''}
          {token.change24h.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
