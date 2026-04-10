import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { GradientText } from '../components/GradientText';

/**
 * Scene: CTA (Final)
 * Solana Caribbean branded map as the background with a slow Ken Burns zoom.
 * Text content (headlines, URL, waitlist button) sits over a dark gradient
 * overlay for readability.
 */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Map background fade in (frames 0-20) and slow Ken Burns zoom
  const bgFade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Slow continuous zoom from 1.0 → 1.08 over 240 frames (8 seconds)
  const bgZoom = interpolate(frame, [0, 240], [1.0, 1.08], {
    extrapolateRight: 'clamp',
  });
  // Subtle pan left-to-right
  const bgPanX = interpolate(frame, [0, 240], [-10, 10], {
    extrapolateRight: 'clamp',
  });

  // Line 1 spring (0-30)
  const line1 = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 200 },
  });

  // Line 2 spring (20-50)
  const line2 = spring({
    frame: frame - 20,
    fps,
    config: { damping: 16, stiffness: 200 },
  });

  // Subtitle fade (40-70)
  const subtitle = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // URL fade + scale (60-90)
  const url = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const urlScale = interpolate(frame, [60, 90], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Button appear (80+) and pulse
  const btnOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const btnPulse = frame > 100 ? 1 + Math.sin(frame / 10) * 0.03 : 1;

  return (
    <AbsoluteFill style={{ background: COLORS.night, overflow: 'hidden' }}>
      {/* Solana Caribbean map background with Ken Burns zoom */}
      <AbsoluteFill
        style={{
          opacity: bgFade,
          transform: `scale(${bgZoom}) translateX(${bgPanX}px)`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile('assets/solana-caribbean-map.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>

      {/* Dark gradient overlay for text readability */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(13,14,16,0.75) 0%, rgba(13,14,16,0.9) 50%, rgba(13,14,16,0.95) 100%)',
        }}
      />

      {/* Additional vertical gradient for extra contrast on edges */}
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(13,14,16,0.6) 0%, transparent 30%, transparent 70%, rgba(13,14,16,0.6) 100%)',
        }}
      />

      {/* Content layer */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1,
            transform: `translateY(${(1 - line1) * 40}px) scale(${0.9 + line1 * 0.1})`,
            textAlign: 'center',
          }}
        >
          <GradientText fontSize={96}>Learn Crypto. Trade Smart.</GradientText>
        </div>

        {/* Line 2 */}
        <div
          style={{
            opacity: line2,
            transform: `translateY(${(1 - line2) * 40}px) scale(${0.9 + line2 * 0.1})`,
            textAlign: 'center',
          }}
        >
          <GradientText fontSize={96}>Earn $LIMER.</GradientText>
        </div>

        {/* Subtitle */}
        <div
          style={{
            opacity: subtitle,
            fontFamily: FONTS.body,
            fontSize: 32,
            color: COLORS.txt2,
            fontWeight: 500,
            marginTop: 16,
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          Join the Caribbean DeFi revolution.
        </div>

        {/* URL */}
        <div
          style={{
            opacity: url,
            transform: `scale(${urlScale})`,
            fontFamily: FONTS.mono,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.sea,
            marginTop: 20,
            textShadow: `0 0 30px ${COLORS.sea}, 0 0 60px rgba(0,255,163,0.6), 0 4px 16px rgba(0,0,0,0.8)`,
            letterSpacing: '0.02em',
          }}
        >
          limerscapital.com
        </div>

        {/* CTA button */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `scale(${btnPulse})`,
            marginTop: 32,
            width: 400,
            height: 80,
            borderRadius: 18,
            background: `linear-gradient(135deg, ${COLORS.sea}, #00ef99)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.headline,
            fontSize: 24,
            fontWeight: 800,
            color: COLORS.night,
            letterSpacing: '0.02em',
            boxShadow:
              '0 10px 40px rgba(0,255,163,0.5), 0 0 60px rgba(0,255,163,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            border: '1px solid rgba(0,255,163,0.6)',
          }}
        >
          Join the Waitlist
        </div>
      </AbsoluteFill>

      {/* Built on Solana footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONTS.body,
          fontSize: 18,
          color: COLORS.txt2,
          fontWeight: 500,
          letterSpacing: '0.15em',
          opacity: url,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      >
        Built on Solana ◎
      </div>
    </AbsoluteFill>
  );
};
