import { useEffect, useRef, useState } from 'react';

/**
 * AchievementBadge — holographic 3D badge card with perspective tilt + rainbow overlay.
 * Adapted from Product Hunt AwardBadge for Limer's Capital achievement system.
 *
 * Props:
 *   icon     — emoji icon for the badge
 *   title    — badge title
 *   desc     — badge description
 *   cat      — category label (milestone, skill, special)
 *   earned   — whether the badge is earned
 */

const identityMatrix =
  '1, 0, 0, 0, ' +
  '0, 1, 0, 0, ' +
  '0, 0, 1, 0, ' +
  '0, 0, 0, 1';

const maxRotate = 0.25;
const minRotate = -0.25;
const maxScale = 1;
const minScale = 0.97;

/* Category-based background colors for earned badges */
const CAT_BG = {
  milestone: '#1a2a1f',
  skill:     '#1a1f2a',
  special:   '#2a1a24',
};

/* Category-based accent for the top pill */
const CAT_ACCENT = {
  milestone: '#00ffa3',
  skill:     '#bf81ff',
  special:   '#FFCA3A',
};

export default function AchievementBadge({ icon, title, desc, cat, earned }) {
  const ref = useRef(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState(0);
  const [matrix, setMatrix] = useState(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState(identityMatrix);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] = useState(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] = useState(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState(false);

  const enterTimeout = useRef(null);
  const leaveTimeout1 = useRef(null);
  const leaveTimeout2 = useRef(null);
  const leaveTimeout3 = useRef(null);

  const getDimensions = () => {
    const rect = ref.current?.getBoundingClientRect();
    return {
      left: rect?.left || 0,
      right: rect?.right || 0,
      top: rect?.top || 0,
      bottom: rect?.bottom || 0,
    };
  };

  const getMatrix = (clientX, clientY) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left),
      maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top),
      maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / (xCenter - left + yCenter - top),
    ];

    const rotate = {
      x1: 0.25 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2: maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
      y0: 0,
      y2: maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom),
      z0: -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)),
      z1: 0.2 - (0.2 + 0.6) * (top - clientY) / (top - bottom),
    };

    return `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `0, 0, 0, 1`;
  };

  const getOppositeMatrix = (_matrix, clientY, onMouseEnter) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix.split(', ').map((item, index) => {
      if (index === 2 || index === 4 || index === 8) {
        return -parseFloat(item) * multiplier / weakening;
      } else if (index === 0 || index === 5 || index === 10) {
        return '1';
      } else if (index === 6) {
        return multiplier * (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
      } else if (index === 9) {
        return (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening;
      }
      return item;
    }).join(', ');
  };

  const onMouseEnter = (e) => {
    if (!earned) return;
    [leaveTimeout1, leaveTimeout2, leaveTimeout3].forEach(t => { if (t.current) clearTimeout(t.current); });

    setDisableOverlayAnimation(true);
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;
    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5);
      });
    });

    const mat = getMatrix(e.clientX, e.clientY);
    const opposite = getOppositeMatrix(mat, e.clientY, true);
    setMatrix(opposite);
    setIsTimeoutFinished(false);
    setTimeout(() => setIsTimeoutFinished(true), 200);
  };

  const onMouseMove = (e) => {
    if (!earned) return;
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;
    setTimeout(() => setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5), 150);
    if (isTimeoutFinished) {
      setCurrentMatrix(getMatrix(e.clientX, e.clientY));
    }
  };

  const onMouseLeave = (e) => {
    if (!earned) return;
    const opposite = getOppositeMatrix(matrix, e.clientY);
    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(opposite);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(() => setFirstOverlayPosition(-firstOverlayPosition / 4), 150);
        leaveTimeout2.current = setTimeout(() => setFirstOverlayPosition(0), 300);
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    if (isTimeoutFinished) setMatrix(currentMatrix);
  }, [currentMatrix, isTimeoutFinished]);

  /* ── Overlay keyframes (injected once per badge) ── */
  const overlayId = useRef(`ab-${Math.random().toString(36).slice(2, 8)}`).current;
  const overlayAnimations = [...Array(10).keys()]
    .map(e => `@keyframes ${overlayId}-o${e + 1}{0%{transform:rotate(${e * 10}deg)}50%{transform:rotate(${(e + 1) * 10}deg)}100%{transform:rotate(${e * 10}deg)}}`)
    .join(' ');

  const accent = CAT_ACCENT[cat] || '#00ffa3';
  const bgColor = earned ? (CAT_BG[cat] || '#1a2a1f') : '#141516';

  /* Holographic overlay colors — Veridian palette */
  const overlayColors = [
    'hsl(155, 100%, 50%)',  // sea green
    'hsl(270, 60%, 60%)',   // purple
    'hsl(155, 80%, 40%)',   // dark sea
    'hsl(45, 100%, 61%)',   // sun gold
    'hsl(155, 100%, 35%)',  // deep green
    'hsl(270, 40%, 50%)',   // muted purple
    'hsl(200, 30%, 35%)',   // dark muted
    'transparent',
    'transparent',
    'hsla(0, 0%, 100%, 0.6)',
  ];

  return (
    <div
      ref={ref}
      className={`block w-full h-auto ${earned ? 'cursor-pointer' : 'cursor-default'}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
      title={earned ? `${title}: ${desc}` : `??? — ${desc}`}
    >
      <style>{overlayAnimations}</style>

      <div
        style={{
          transform: earned ? `perspective(700px) matrix3d(${matrix})` : 'none',
          transformOrigin: 'center center',
          transition: 'transform 200ms ease-out',
        }}
      >
        <div className="relative rounded-xl overflow-hidden" style={{ background: bgColor }}>
          {/* Badge content */}
          <div className="relative z-10 p-3 text-center">
            {/* Category pill */}
            <div
              className="text-[.5rem] uppercase tracking-[.15em] font-headline mb-2 px-2 py-0.5 rounded-full inline-block border"
              style={{
                color: earned ? accent : 'var(--color-muted)',
                borderColor: earned ? accent + '40' : 'var(--color-border)',
                background: earned ? accent + '15' : 'transparent',
              }}
            >
              {cat}
            </div>

            {/* Icon */}
            <div className="text-[2rem] mb-1.5 select-none" style={{ filter: earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>
              {earned ? icon : '❓'}
            </div>

            {/* Title */}
            <div
              className="text-[.68rem] font-bold font-headline leading-tight truncate"
              style={{ color: earned ? 'var(--color-txt)' : 'var(--color-muted)' }}
            >
              {earned ? title : '???'}
            </div>

            {/* Description */}
            <div className="text-[.5rem] text-muted mt-0.5 leading-snug line-clamp-2">
              {desc}
            </div>
          </div>

          {/* Inner border stroke */}
          <div
            className="absolute inset-1 rounded-lg border pointer-events-none z-10"
            style={{
              borderColor: earned ? accent + '30' : 'var(--color-border)',
            }}
          />

          {/* Holographic overlay — only on earned badges */}
          {earned && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ mixBlendMode: 'overlay', overflow: 'hidden' }}
            >
              {overlayColors.map((color, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${firstOverlayPosition + i * 10}deg)`,
                    transformOrigin: 'center center',
                    transition: !disableInOutOverlayAnimation ? 'transform 200ms ease-out' : 'none',
                    animation: disableOverlayAnimation ? 'none' : `${overlayId}-o${i + 1} 5s infinite`,
                    willChange: 'transform',
                  }}
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,0 100,100 100,0 0,100" fill={color} filter="url(#achBlur)" opacity="0.5" />
                  </svg>
                </div>
              ))}
              {/* Shared blur filter */}
              <svg className="absolute w-0 h-0">
                <defs>
                  <filter id="achBlur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>
              </svg>
            </div>
          )}

          {/* Outer border */}
          <div
            className="absolute inset-0 rounded-xl border pointer-events-none"
            style={{
              borderColor: earned ? accent + '50' : 'var(--color-border)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
