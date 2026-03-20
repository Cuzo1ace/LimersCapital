import { useEffect, useRef } from 'react';

// Draws a 600×300 share card on canvas and provides download + Twitter share
export default function ShareCard({ type, title, icon, color, onClose }) {
  const canvasRef = useRef(null);

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
      <div className="rounded-2xl overflow-hidden shadow-2xl max-w-[640px] w-full"
        onClick={e => e.stopPropagation()}
        style={{ border: `1px solid ${color}44`, background: 'var(--color-night-2)' }}>
        {/* Canvas */}
        <canvas ref={canvasRef} className="w-full block" style={{ aspectRatio: '600/300' }} />

        {/* Actions */}
        <div className="p-4 flex gap-3 justify-between items-center">
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
