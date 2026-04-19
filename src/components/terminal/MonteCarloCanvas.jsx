import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed canvas that progressively reveals Monte Carlo price paths.
 * Each frame draws ~batchSize new paths with alpha-blended strokes for
 * the "spray" aesthetic. Overlaid with quantile lines (P5/P50/P95) in a
 * final pass so they sit above the fan.
 */
export default function MonteCarloCanvas({ result, batchSize = 120 }) {
  const ref = useRef(null);
  const rafRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !result) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width  = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const { paths, steps, numPaths, q } = result;
    // Compute y-range from P5/P95 so the bulk of paths fit on screen.
    const ymin = Math.min(q.p5[steps - 1],  q.p5[Math.floor(steps / 2)],  q.p5[0] * 0.98);
    const ymax = Math.max(q.p95[steps - 1], q.p95[Math.floor(steps / 2)], q.p95[0] * 1.02);
    const pad = 24;
    const w = cssW - pad * 2;
    const h = cssH - pad * 2;

    const xAt = (t) => pad + (t / (steps - 1)) * w;
    const yAt = (price) => pad + (1 - (price - ymin) / (ymax - ymin)) * h;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = pad + (i / 5) * h;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + w, y); ctx.stroke();
    }

    let drawn = 0;
    function step() {
      const end = Math.min(numPaths, drawn + batchSize);
      ctx.strokeStyle = 'rgba(0,255,163,0.045)';
      ctx.lineWidth = 0.8;
      for (let p = drawn; p < end; p++) {
        ctx.beginPath();
        const base = p * steps;
        ctx.moveTo(xAt(0), yAt(paths[base]));
        for (let t = 1; t < steps; t++) {
          ctx.lineTo(xAt(t), yAt(paths[base + t]));
        }
        ctx.stroke();
      }
      drawn = end;
      setProgress(drawn / numPaths);

      if (drawn < numPaths) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // Overlay quantile lines on top.
        drawQuantile(ctx, q.p50, steps, xAt, yAt, 'rgba(255,202,58,0.95)', 2);
        drawQuantile(ctx, q.p5,  steps, xAt, yAt, 'rgba(255,113,108,0.85)', 1.5, [4, 3]);
        drawQuantile(ctx, q.p95, steps, xAt, yAt, 'rgba(0,255,163,0.85)', 1.5, [4, 3]);
        drawLabels(ctx, ymin, ymax, cssW, cssH, pad);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [result, batchSize]);

  return (
    <div className="relative w-full h-full min-h-[360px]">
      <canvas ref={ref} className="w-full h-full block" style={{ height: '100%' }} />
      {progress < 1 && (
        <div className="absolute bottom-2 left-2 text-[.6rem] font-mono text-sea">
          spraying paths · {Math.round(progress * 100)}%
        </div>
      )}
    </div>
  );
}

function drawQuantile(ctx, arr, steps, xAt, yAt, color, width = 1.5, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(xAt(0), yAt(arr[0]));
  for (let t = 1; t < steps; t++) ctx.lineTo(xAt(t), yAt(arr[t]));
  ctx.stroke();
  ctx.restore();
}

function drawLabels(ctx, ymin, ymax, w, h, pad) {
  ctx.save();
  ctx.fillStyle = '#7d7e82';
  ctx.font = '10px "DM Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`$${ymax.toFixed(0)}`, pad + 2, pad + 10);
  ctx.fillText(`$${ymin.toFixed(0)}`, pad + 2, h - pad + 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,202,58,0.9)';
  ctx.fillText('P50', w - pad - 4, pad + 10);
  ctx.fillStyle = 'rgba(0,255,163,0.85)';
  ctx.fillText('P95', w - pad - 4, pad + 24);
  ctx.fillStyle = 'rgba(255,113,108,0.85)';
  ctx.fillText('P5',  w - pad - 4, pad + 38);
  ctx.restore();
}
