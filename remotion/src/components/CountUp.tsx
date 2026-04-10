import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  from?: number;
  to: number;
  durationSec?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

/**
 * Frame-driven number counter. Uses easeOutExpo to match the app's CountUp.
 */
export const CountUp: React.FC<Props> = ({
  from = 0,
  to,
  durationSec = 1.5,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const durationFrames = durationSec * fps;
  const progress = interpolate(
    frame - delay,
    [0, durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  // easeOutExpo
  const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
  const value = from + (to - from) * eased;

  return (
    <span style={style}>
      {prefix}
      {value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
