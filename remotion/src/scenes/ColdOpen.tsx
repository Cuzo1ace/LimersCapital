import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { GradientText } from '../components/GradientText';

/**
 * Scene 1: Cold Open
 * Black screen → Caribbean sunset gradient sweeps up → Logo lockup reveals
 */
export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Sunset gradient wipe (frames 0-30)
  const sunsetReveal = interpolate(frame, [0, 30], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo scale-in (frames 20-50)
  const logoScale = spring({
    frame: frame - 20,
    fps,
    config: { damping: 18, stiffness: 200 },
  });

  // Logo text reveal (frames 30-60)
  const textOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      {/* Sunset gradient wipe */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, rgba(0,255,163,0.08) 0%, rgba(191,129,255,0.06) 50%, rgba(255,202,58,0.04) 100%)`,
          clipPath: `circle(${sunsetReveal}% at 50% 100%)`,
        }}
      />

      {/* Centered logo lockup */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          opacity: textOpacity,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: 'rgba(0,255,163,0.15)',
            border: '2px solid rgba(0,255,163,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${logoScale})`,
            boxShadow: '0 0 60px rgba(0,255,163,0.3)',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.headline,
              fontSize: 64,
              fontWeight: 900,
              color: COLORS.sea,
            }}
          >
            L
          </span>
        </div>

        <GradientText fontSize={72}>Limer's Capital</GradientText>

        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 18,
            color: COLORS.txt2,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          Caribbean DeFi on Solana
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
