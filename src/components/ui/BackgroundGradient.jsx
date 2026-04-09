import { useEffect, useRef, useState } from 'react';

const BLOBS = [
  { color: '0,255,163',   size: 600, x: 70, y: 10, dur: 40 },   // sea
  { color: '191,129,255',  size: 500, x: 10, y: 75, dur: 30 },   // coral
  { color: '45,155,86',    size: 450, x: 45, y: 50, dur: 35 },   // palm
  { color: '255,202,58',   size: 350, x: 20, y: 15, dur: 25 },   // sun
  { color: '0,239,153',    size: 400, x: 85, y: 80, dur: 28 },   // sea-dk
];

export default function BackgroundGradient() {
  const pointerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (isMobile || reduceMotion) return;
    const el = pointerRef.current;
    if (!el) return;

    let raf;
    const onMove = (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX - 150}px, ${e.clientY - 150}px)`;
      });
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile, reduceMotion]);

  const visibleBlobs = isMobile ? BLOBS.slice(0, 3) : BLOBS;

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {visibleBlobs.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: blob.size,
            height: blob.size,
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            background: `radial-gradient(circle, rgba(${blob.color},0.07) 0%, transparent 70%)`,
            filter: 'blur(100px)',
            animation: reduceMotion ? 'none' : `ocean-blob-${i} ${blob.dur}s ease-in-out infinite`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Mouse-tracking layer (desktop only) */}
      {!isMobile && !reduceMotion && (
        <div
          ref={pointerRef}
          className="absolute w-[300px] h-[300px] rounded-full opacity-0 transition-opacity duration-700"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,163,0.05) 0%, transparent 70%)',
            filter: 'blur(60px)',
            willChange: 'transform',
          }}
          onPointerEnter={(e) => e.currentTarget.style.opacity = '1'}
          onPointerLeave={(e) => e.currentTarget.style.opacity = '0'}
        />
      )}
    </div>
  );
}
