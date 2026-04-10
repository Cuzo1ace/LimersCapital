import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../data/tokens';
import { BackgroundGradient } from '../components/BackgroundGradient';
import { GradientText } from '../components/GradientText';

/**
 * Scene 6: Bottom Nav / Mobile
 * Mock phone frame with an animated 5-tab bottom nav spotlight.
 */
export const BottomNav: React.FC = () => {
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

  // Phone entrance
  const phoneOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const phoneScale = interpolate(frame, [20, 50], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tabs
  const tabs = [
    { label: 'Home', icon: '🏠' },
    { label: 'Learn', icon: '📚' },
    { label: 'Market', icon: '📊' },
    { label: 'Trade', icon: '💱' },
    { label: 'Portfolio', icon: '💼' },
  ];

  const navWidth = 400;
  const navPadding = 10;
  const tabCount = tabs.length;
  const tabWidth = (navWidth - navPadding * 2) / tabCount;

  // Spotlight position — smoothly moves between tab centers
  // Home: 30-90, Learn: 90-150, Market: 150-210, Trade: 210-270, Portfolio: 270-330
  const spotlightIndex = interpolate(
    frame,
    [30, 90, 150, 210, 270, 330],
    [0, 1, 2, 3, 4, 4],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const spotlightX = navPadding + spotlightIndex * tabWidth;

  const spotlightOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phone dimensions
  const phoneW = 400;
  const phoneH = 800;

  return (
    <AbsoluteFill style={{ background: COLORS.night }}>
      <BackgroundGradient />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 90,
          gap: 20,
        }}
      >
        {/* Top label */}
        <div
          style={{
            fontFamily: FONTS.body,
            fontSize: 16,
            color: COLORS.coral,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: labelOpacity,
          }}
        >
          06 · Designed for Mobile
        </div>

        {/* Headline */}
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          <GradientText fontSize={72}>Native App. Web Access.</GradientText>
        </div>

        {/* Phone mock */}
        <div
          style={{
            width: phoneW,
            height: phoneH,
            borderRadius: 52,
            background: COLORS.night2,
            border: '3px solid rgba(255,255,255,0.12)',
            boxShadow:
              '0 0 0 8px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.5), 0 0 80px rgba(0,255,163,0.08)',
            marginTop: 16,
            opacity: phoneOpacity,
            transform: `scale(${phoneScale})`,
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Notch */}
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 26,
              borderRadius: 999,
              background: '#000',
              zIndex: 2,
            }}
          />

          {/* Top content: logo + ticker silhouette */}
          <div
            style={{
              marginTop: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              flex: 1,
            }}
          >
            {/* Logo row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0 4px',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(0,255,163,0.15)',
                  border: '1px solid rgba(0,255,163,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONTS.headline,
                  fontSize: 22,
                  fontWeight: 900,
                  color: COLORS.sea,
                }}
              >
                L
              </div>
              <div
                style={{
                  fontFamily: FONTS.headline,
                  fontSize: 18,
                  fontWeight: 800,
                  color: COLORS.txt,
                }}
              >
                Limer's Capital
              </div>
            </div>

            {/* Ticker silhouettes */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 12px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      width: '60%',
                      height: 10,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.1)',
                    }}
                  />
                  <div
                    style={{
                      width: '40%',
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 50,
                    height: 18,
                    borderRadius: 4,
                    background: 'rgba(0,255,163,0.15)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div
            style={{
              width: navWidth - 40,
              alignSelf: 'center',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 70,
                borderRadius: 20,
                background: 'rgba(18,19,22,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `0 ${navPadding}px`,
                backdropFilter: 'blur(24px)',
                overflow: 'hidden',
              }}
            >
              {/* Spotlight glow */}
              <div
                style={{
                  position: 'absolute',
                  left: spotlightX * ((navWidth - 40) / navWidth),
                  top: 8,
                  width: tabWidth * ((navWidth - 40) / navWidth),
                  height: 54,
                  borderRadius: 14,
                  background:
                    'radial-gradient(ellipse at center, rgba(0,255,163,0.35) 0%, rgba(0,255,163,0.1) 50%, transparent 80%)',
                  boxShadow: '0 0 24px rgba(0,255,163,0.4)',
                  opacity: spotlightOpacity,
                  transition: 'none',
                }}
              />
              {tabs.map((tab, i) => {
                const active = Math.round(spotlightIndex) === i;
                return (
                  <div
                    key={tab.label}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      zIndex: 1,
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{tab.icon}</span>
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 10,
                        fontWeight: 700,
                        color: active ? COLORS.sea : COLORS.txt2,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {tab.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
