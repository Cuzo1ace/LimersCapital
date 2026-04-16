import { useEffect, useRef, useState, useCallback } from 'react';

// ── Holographic 3D tilt constants ─────────────────────────────────────
const IDENTITY = '1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1';
const MAX_ROTATE = 0.18;
const MIN_ROTATE = -0.18;
const MAX_SCALE = 1;
const MIN_SCALE = 0.97;

// Rainbow overlay hue stops for the holographic shimmer
const OVERLAY_HUES = [
  'hsl(160, 100%, 60%)',   // sea green
  'hsl(280, 85%, 55%)',    // purple
  'hsl(45, 100%, 55%)',    // gold
  'hsl(10, 100%, 62%)',    // coral
  'hsl(200, 100%, 60%)',   // blue
  'hsl(320, 80%, 50%)',    // magenta
];

function getMatrix(el, clientX, clientY) {
  const { left, right, top, bottom } = el.getBoundingClientRect();
  const xC = (left + right) / 2;
  const yC = (top + bottom) / 2;
  const xW = xC - left;
  const yH = yC - top;

  const s0 = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * Math.abs(xC - clientX) / xW;
  const s1 = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * Math.abs(yC - clientY) / yH;
  const s2 = MAX_SCALE - (MAX_SCALE - MIN_SCALE) * (Math.abs(xC - clientX) + Math.abs(yC - clientY)) / (xW + yH);

  const rz0 = -(MAX_ROTATE - (MAX_ROTATE - MIN_ROTATE) * Math.abs(right - clientX) / (right - left));
  const rx1 = 0.2 * ((yC - clientY) / yC - (xC - clientX) / xC);
  const rx2 = MAX_ROTATE - (MAX_ROTATE - MIN_ROTATE) * Math.abs(right - clientX) / (right - left);
  const ry2 = MAX_ROTATE - (MAX_ROTATE - MIN_ROTATE) * (top - clientY) / (top - bottom);
  const rz1 = 0.15 - (0.15 + 0.45) * (top - clientY) / (top - bottom);

  return `${s0},0,${rz0},0,${rx1},${s1},${rz1},0,${rx2},${ry2},${s2},0,0,0,0,1`;
}

// Draws a 600×300 share card on canvas and provides download + Twitter share
// Now wrapped in a holographic 3D tilt effect for premium feel
export default function ShareCard({ type, title, icon, color, onClose }) {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [matrix, setMatrix] = useState(IDENTITY);
  const [overlayAngle, setOverlayAngle] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // ── Canvas drawing (unchanged from original) ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 600, H = 300;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0A1628');
    bg.addColorStop(1, '#111E38');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(0,200,180,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glow blob
    const glow = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, 200);
    glow.addColorStop(0, color + '28');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Left accent bar
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 4, H);

    // Platform name
    ctx.font = 'bold 13px "DM Mono", monospace';
    ctx.fillStyle = '#5B7A9A';
    ctx.fillText("LIMER'S CAPITAL", 30, 38);

    // Type label
    const typeLabel = type === 'level' ? '— LEVEL UP' : type === 'badge' ? '— BADGE UNLOCKED' : '— ACHIEVEMENT';
    ctx.font = '11px "DM Mono", monospace';
    ctx.fillStyle = color;
    ctx.fillText(typeLabel, 30, 58);

    // Big icon
    ctx.font = '64px serif';
    ctx.fillText(icon, 30, 160);

    // Title
    ctx.font = 'bold 28px "DM Mono", monospace';
    ctx.fillStyle = '#E6F0FF';
    const words = title.split(' ');
    let line = '', y = 185;
    for (const word of words) {
      const test = line + (line ? ' ' : '') + word;
      if (ctx.measureText(test).width > 480 && line) {
        ctx.fillText(line, 30, y); line = word; y += 34;
      } else { line = test; }
    }
    if (line) ctx.fillText(line, 30, y);

    // Bottom strip
    ctx.fillStyle = 'rgba(0,200,180,0.08)';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.font = '11px "DM Mono", monospace';
    ctx.fillStyle = '#00C8B4';
    ctx.fillText('limerscapital.com', 30, H - 14);
    ctx.fillStyle = '#5B7A9A';
    ctx.textAlign = 'right';
    ctx.fillText('#Solana #Caribbean #DeFi', W - 20, H - 14);
    ctx.textAlign = 'left';
  }, [type, title, icon, color]);

  // ── Holographic 3D tilt handlers ───────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const m = getMatrix(cardRef.current, e.clientX, e.clientY);
    setMatrix(m);

    // Rotate the holographic overlay based on cursor position
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    setOverlayAngle((xPct + yPct) * 180);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMatrix(IDENTITY);
    setOverlayAngle(0);
  }, []);

  function handleDownload() {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `limer-${type}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handleShare() {
    const text = encodeURIComponent(
      `I just unlocked "${title}" on Limer's Capital! 🌴🍋 Caribbean crypto investing.\n#Solana #Caribbean #DeFi\nhttps://limerscapital.com`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener');
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>

      {/* Holographic 3D card wrapper */}
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden shadow-2xl max-w-[640px] w-full gpu-accelerated relative"
        onClick={e => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          border: `1px solid ${color}44`,
          background: 'var(--color-night-2)',
          transform: `perspective(800px) matrix3d(${matrix})`,
          transformOrigin: 'center center',
          transition: 'transform 200ms ease-out',
        }}
      >
        {/* Holographic rainbow overlay — visible on hover */}
        <div
          className="absolute inset-0 pointer-events-none z-20 rounded-2xl overflow-hidden"
          style={{
            opacity: isHovering ? 0.35 : 0,
            transition: 'opacity 300ms ease',
            mixBlendMode: 'overlay',
          }}
        >
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <filter id="holo-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              </filter>
            </defs>
            {OVERLAY_HUES.map((hue, i) => (
              <g
                key={i}
                style={{
                  transform: `rotate(${overlayAngle + i * 30}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 150ms ease-out',
                  willChange: 'transform',
                }}
              >
                <polygon
                  points="0,0 640,300 640,0 0,300"
                  fill={hue}
                  filter="url(#holo-blur)"
                  opacity="0.5"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Canvas card image */}
        <canvas ref={canvasRef} className="w-full block relative z-10" style={{ aspectRatio: '600/300' }} />

        {/* Actions */}
        <div className="p-4 flex gap-3 justify-between items-center relative z-10">
          <button onClick={onClose}
            className="text-muted text-[.75rem] font-mono bg-transparent border-none cursor-pointer hover:text-txt-2">
            ✕ Close
          </button>
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className="bg-transparent border border-border text-txt-2 cursor-pointer rounded-lg px-4 py-2 text-[.75rem] font-mono hover:bg-white/5 transition-all">
              ↓ Save PNG
            </button>
            <button onClick={handleShare}
              className="cursor-pointer rounded-lg px-4 py-2 text-[.75rem] font-mono font-bold transition-all"
              style={{ background: color, color: '#0A1628' }}>
              𝕏 Share on X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
