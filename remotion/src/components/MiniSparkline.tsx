import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  drawDelay?: number;
  drawDurationSec?: number;
  strokeWidth?: number;
}

/**
 * Draw-on sparkline for token price rows.
 * Animates the stroke-dashoffset from full length → 0 so the line "draws in".
 */
export const MiniSparkline: React.FC<Props> = ({
  data,
  color = '#00ffa3',
  width = 64,
  height = 24,
  drawDelay = 0,
  drawDurationSec = 0.8,
  strokeWidth = 1.8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });

  // Approximate path length
  let pathLength = 0;
  for (let i = 1; i < data.length; i++) {
    const [x1, y1] = points[i - 1].split(',').map(Number);
    const [x2, y2] = points[i].split(',').map(Number);
    pathLength += Math.hypot(x2 - x1, y2 - y1);
  }

  const progress = interpolate(
    frame - drawDelay,
    [0, drawDurationSec * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        strokeDashoffset={pathLength * (1 - progress)}
      />
    </svg>
  );
};
