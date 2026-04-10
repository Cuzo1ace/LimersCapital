import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../data/tokens';

const BLOBS = [
  { color: '0,255,163', size: 900, x: 70, y: 10 },
  { color: '191,129,255', size: 750, x: 15, y: 70 },
  { color: '45,155,86', size: 650, x: 50, y: 50 },
  { color: '255,202,58', size: 500, x: 25, y: 20 },
  { color: '0,239,153', size: 600, x: 85, y: 80 },
];

/**
 * Animated ocean gradient background — matches the real app's BackgroundGradient
 * but uses Remotion's frame-driven animation instead of CSS keyframes.
 */
export const BackgroundGradient: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.night, overflow: 'hidden' }}>
      {BLOBS.map((blob, i) => {
        // Each blob drifts on a unique sinusoidal path
        const phase = (frame / 30) * (0.5 + i * 0.15);
        const dx = Math.sin(phase) * 80;
        const dy = Math.cos(phase * 0.7) * 60;
        const scale = interpolate(
          Math.sin(phase * 0.8),
          [-1, 1],
          [0.85, 1.15],
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              width: blob.size,
              height: blob.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${blob.color},0.12) 0%, transparent 70%)`,
              filter: 'blur(120px)',
              transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})`,
            }}
          />
        );
      })}

      {/* Dot-grid overlay for texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,255,163,0.04) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
