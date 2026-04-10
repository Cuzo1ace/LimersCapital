import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';

/**
 * Scene: Hook
 * Headline reveals word-by-word, map pin drops onto Trinidad, caption fades in.
 */
const HEADLINE_LINES = [
  ["The", "Caribbean's", 'first'],
  ['DeFi', 'platform'],
  ['on', 'Solana'],
];

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flatten words with a per-word index for staggered entry
  const flatWords: { word: string; lineIdx: number; wordIdx: number; globalIdx: number }[] = [];
  let gi = 0;
  HEADLINE_LINES.forEach((line, lineIdx) => {
    line.forEach((word, wordIdx) => {
      flatWords.push({ word, lineIdx, wordIdx, globalIdx: gi++ });
    });
  });

  // Exit fade (frames 210-240)
  const exitOpacity = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Map pin drop — starts at frame 80, lands at frame 110
  const pinDrop = spring({
    frame: frame - 80,
    fps,
    config: { damping: 10, stiffness: 140, mass: 1.2 },
  });
  const pinY = interpolate(pinDrop, [0, 1], [-200, 0]);
  const pinOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pin pulse ring (after landing)
  const ringScale = interpolate(frame, [112, 150], [0.4, 2.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOpacity = interpolate(frame, [112, 150], [0.8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Caption fade-in
  const captionOpacity = interpolate(frame, [140, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.night, opacity: exitOpacity }}>
      <BackgroundGradient />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          gap: 60,
        }}
      >
        {/* Headline — 3 lines of staggered words */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {HEADLINE_LINES.map((line, lineIdx) => (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                gap: 24,
                justifyContent: 'center',
              }}
            >
              {line.map((word, wordIdx) => {
                const flatEntry = flatWords.find(
                  (w) => w.lineIdx === lineIdx && w.wordIdx === wordIdx,
                )!;
                const wordDelay = 10 + flatEntry.globalIdx * 6;
                const wordSpring = spring({
                  frame: frame - wordDelay,
                  fps,
                  config: { damping: 14, stiffness: 180 },
                });
                const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1]);
                const wordY = interpolate(wordSpring, [0, 1], [40, 0]);

                return (
                  <span
                    key={wordIdx}
                    style={{
                      fontFamily: FONTS.headline,
                      fontSize: 96,
                      fontWeight: 700,
                      color: COLORS.txt,
                      lineHeight: 1.05,
                      opacity: wordOpacity,
                      transform: `translateY(${wordY}px)`,
                      display: 'inline-block',
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* Map pin dropping onto Trinidad */}
        <div
          style={{
            position: 'relative',
            width: 120,
            height: 140,
            opacity: pinOpacity,
            transform: `translateY(${pinY}px)`,
          }}
        >
          {/* Pulse ring */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              width: 60,
              height: 60,
              marginLeft: -30,
              marginBottom: -30,
              borderRadius: '50%',
              border: `3px solid ${COLORS.sea}`,
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
            }}
          />
          {/* Pin SVG: circle head + triangle tail */}
          <svg
            width={120}
            height={140}
            viewBox="0 0 120 140"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <filter id="pinGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M 60 10 C 30 10, 20 40, 20 55 C 20 80, 60 130, 60 130 C 60 130, 100 80, 100 55 C 100 40, 90 10, 60 10 Z"
              fill={COLORS.sea}
              filter="url(#pinGlow)"
            />
            <circle cx={60} cy={55} r={14} fill={COLORS.night} />
          </svg>
        </div>

        {/* Caption */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 28,
            color: COLORS.txt2,
            letterSpacing: '0.08em',
            opacity: captionOpacity,
            textAlign: 'center',
          }}
        >
          Built in the islands. For the world.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
