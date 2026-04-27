import { useEffect, useRef } from 'react';

/**
 * GlossaryHeroCanvas — animated wave canvas that introduces the DeFi Dictionary.
 *
 * Adapted from a fullscreen `fixed inset-0` SchemaCard concept into a contained
 * hero block. Canvas sizes to its parent via ResizeObserver so it never spills
 * past the glossary tab.
 */
export default function GlossaryHeroCanvas({ termCount, viewedCount, categoryCount }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let time = 0;
    let rafId;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const waveData = Array.from({ length: 8 }).map(() => ({
      value: Math.random() * 0.5 + 0.1,
      targetValue: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.02 + 0.01,
    }));

    function resizeToContainer() {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function updateWaveData() {
      waveData.forEach(d => {
        if (Math.random() < 0.01) d.targetValue = Math.random() * 0.7 + 0.1;
        d.value += (d.targetValue - d.value) * d.speed;
      });
    }

    function draw() {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.fillStyle = '#0a0b14';
      ctx.fillRect(0, 0, w, h);

      waveData.forEach((d, i) => {
        const freq = d.value * 7;
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const nx = (x / w) * 2 - 1;
          const px = nx + i * 0.04 + freq * 0.03;
          const py = Math.sin(px * 10 + time) * Math.cos(px * 2) * freq * 0.1 * ((i + 1) / 8);
          const y = (py + 1) * h / 2;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const intensity = Math.min(1, freq * 0.3);
        const r = 79 + intensity * 100;
        const g = 70 + intensity * 130;
        const b = 229;
        ctx.lineWidth = 1 + i * 0.3;
        ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    }

    function animate() {
      time += 0.02;
      updateWaveData();
      draw();
      rafId = requestAnimationFrame(animate);
    }

    resizeToContainer();
    const ro = new ResizeObserver(resizeToContainer);
    ro.observe(container);
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const progress = termCount > 0 ? Math.round((viewedCount / termCount) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-56 md:h-64 rounded-2xl overflow-hidden mb-5 border border-border"
      style={{ background: '#0a0b14' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center px-5 md:px-8">
        <div className="max-w-md">
          <span className="inline-block px-3 py-1 rounded-full text-[.62rem] font-mono font-bold uppercase tracking-widest mb-3 border"
            style={{ background: 'rgba(99,102,241,.18)', color: '#c7d2fe', borderColor: 'rgba(165,180,252,.3)' }}>
            DeFi Dictionary
          </span>
          <h3 className="font-headline text-[1.4rem] md:text-[1.7rem] font-black text-white mb-2 leading-tight">
            Real concepts. Real metaphors. Real edge.
          </h3>
          <p className="text-white/70 text-[.78rem] md:text-[.82rem] leading-relaxed mb-3 max-w-sm">
            {categoryCount} categories · {termCount} terms · sourced from the DeFi Education Fund — read for 5 seconds, mark it understood, earn LP.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[160px] h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div className="h-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#818cf8,#c084fc)' }} />
            </div>
            <span className="text-white/60 text-[.7rem] font-mono">{viewedCount}/{termCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
