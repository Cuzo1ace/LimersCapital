import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { CARIBBEAN_COUNTRIES, REG_COLORS } from '../data/caribbean';
import { GradientText } from '../components/GradientText';

/**
 * Scene: Caribbean Regulatory Map (~5 seconds)
 *
 * Shows 22 Caribbean nations as dots on a stylized ocean map, color-coded
 * by their crypto regulatory status. Dots draw in sequentially (staggered),
 * each with a pulse ring. A legend and headline appear at the end.
 *
 * Used as scene 1.5 — between ColdOpen and Hook.
 */
export const CaribbeanMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map container fade-in (frames 0-15)
  const mapFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Headline appears at frame 100
  const headlineSpring = spring({
    frame: frame - 100,
    fps,
    config: { damping: 18, stiffness: 200 },
  });

  // Legend fade-in at frame 110
  const legendFade = interpolate(frame, [110, 135], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #020818 0%, #041529 50%, #050d1f 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Ambient ocean glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(10,42,74,0.4) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Map SVG */}
      <div
        style={{
          width: 1400,
          height: 768,
          opacity: mapFade,
          transform: `scale(${0.98 + mapFade * 0.02})`,
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 950 520" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(14,165,233,0.12)" />
              <stop offset="100%" stopColor="#020c1a" />
            </radialGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d2540" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Ocean base */}
          <rect width="950" height="520" fill="#040f1e" />
          <rect width="950" height="520" fill="url(#oceanGlow)" />
          <rect width="950" height="520" fill="url(#grid)" opacity="0.6" />

          {/* Dashed latitude/longitude lines */}
          {[100, 160, 220, 280, 340, 400, 460].map((y) => (
            <line
              key={`lat${y}`}
              x1="0"
              y1={y}
              x2="950"
              y2={y}
              stroke="#0a2540"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
          ))}
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((x) => (
            <line
              key={`lng${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="520"
              stroke="#0a2540"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
          ))}

          {/* Land mass coastline hints */}
          <path
            d="M 80 0 Q 90 40 75 90 Q 65 130 80 160 Q 95 180 85 200"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <text x="30" y="70" fill="#1e3a5f" fontSize="11" fontFamily={FONTS.mono}>
            FLORIDA
          </text>
          <path
            d="M 0 230 Q 30 240 50 260 Q 70 290 60 320 Q 50 350 40 380 Q 30 410 20 450"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <path
            d="M 400 520 Q 500 500 600 510 Q 700 515 800 505 Q 870 500 950 490"
            fill="none"
            stroke="#1a3a5c"
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* Compass rose */}
          <g transform="translate(60, 450)">
            <circle cx="0" cy="0" r="22" fill="#040f1e" stroke="#0d2540" strokeWidth="1" />
            <text
              x="0"
              y="-27"
              textAnchor="middle"
              fill="rgba(0,229,160,0.5)"
              fontSize="9"
              fontFamily={FONTS.mono}
            >
              N
            </text>
            <line x1="0" y1="-20" x2="0" y2="-10" stroke="rgba(0,229,160,0.5)" strokeWidth="1.5" />
            <line x1="0" y1="10" x2="0" y2="20" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
            <line x1="-20" y1="0" x2="-10" y2="0" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
            <line x1="10" y1="0" x2="20" y2="0" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
            <circle cx="0" cy="0" r="2" fill="rgba(0,229,160,0.7)" />
          </g>

          {/* Country dots — animated reveal */}
          {CARIBBEAN_COUNTRIES.map((country, i) => {
            // Stagger: each dot appears 3 frames after the previous
            const dotDelay = 15 + i * 3;
            const dotProgress = spring({
              frame: frame - dotDelay,
              fps,
              config: { damping: 14, stiffness: 250 },
            });

            // Pulse ring: expands from r to r+10, fading out over 20 frames
            const pulseStart = dotDelay;
            const pulseProgress = interpolate(
              frame - pulseStart,
              [0, 25],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const pulseOpacity = interpolate(pulseProgress, [0, 0.3, 1], [0, 0.7, 0]);
            const pulseRadius = country.r + 4 + pulseProgress * 14;

            const regColor = REG_COLORS[country.status];

            return (
              <g key={country.id} opacity={dotProgress}>
                {/* Pulse ring */}
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={pulseRadius}
                  fill="none"
                  stroke={regColor.primary}
                  strokeWidth="1.5"
                  opacity={pulseOpacity}
                />
                {/* Outer glow halo */}
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={country.r + 3}
                  fill={regColor.primary}
                  opacity="0.15"
                  filter="url(#dotGlow)"
                />
                {/* Main dot */}
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={country.r * dotProgress}
                  fill={regColor.primary}
                  filter="url(#dotGlow)"
                />
                {/* Inner highlight */}
                <circle
                  cx={country.x - country.r * 0.25}
                  cy={country.y - country.r * 0.25}
                  r={country.r * 0.3 * dotProgress}
                  fill="rgba(255,255,255,0.4)"
                />
                {/* Country label (smaller nations only show label on larger frames) */}
                {country.r > 12 && dotProgress > 0.8 && (
                  <text
                    x={country.x}
                    y={country.y + country.r + 12}
                    textAnchor="middle"
                    fill="rgba(226,232,240,0.6)"
                    fontSize="9"
                    fontFamily={FONTS.mono}
                  >
                    {country.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top headline */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: mapFade,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            letterSpacing: '0.3em',
            color: '#00E5A0',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Digital Asset Regulation Intelligence
        </div>
      </div>

      {/* Bottom headline — springs in at frame 100 */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: headlineSpring,
          transform: `translateY(${(1 - headlineSpring) * 20}px)`,
        }}
      >
        <GradientText fontSize={64} fontWeight={900}>
          22 Nations. One Platform.
        </GradientText>
      </div>

      {/* Legend — fades in at frame 110 */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          opacity: legendFade,
          fontFamily: FONTS.body,
          fontSize: 13,
          color: 'rgba(226,232,240,0.8)',
        }}
      >
        {(['DEDICATED', 'ECCU', 'PARTIAL', 'PERMITTED', 'NONE'] as const).map((status) => {
          const color = REG_COLORS[status];
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: color.primary,
                  boxShadow: `0 0 10px ${color.primary}`,
                }}
              />
              <span>{color.label}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
