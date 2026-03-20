import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import ShareCard from './ShareCard';

const TYPE_STYLES = {
  xp:     { border: 'var(--color-sea)', bg: 'rgba(0,200,180,.08)', icon: '⚡', color: '#00C8B4' },
  lp:     { border: '#2D9B56', bg: 'rgba(45,155,86,.08)', icon: '🍋', color: '#2D9B56' },
  level:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🎉', color: '#FFCA3A' },
  badge:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🏅', color: '#FFCA3A' },
  unlock: { border: 'var(--color-coral)', bg: 'rgba(255,92,77,.08)', icon: '🔓', color: '#FF5C4D' },
};

export default function RewardToast() {
  const toasts = useStore(s => s.pendingToasts);
  const dismiss = useStore(s => s.dismissToast);
  const [sharing, setSharing] = useState(false);

  const toast = toasts[0]; // Show one at a time

  useEffect(() => {
    if (!toast) return;
    setSharing(false);
    const timer = setTimeout(() => dismiss(toast.id), 6000);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  if (!toast) return null;

  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.xp;
  const canShare = toast.type === 'badge' || toast.type === 'level';

  return (
    <>
      {sharing && (
        <ShareCard
          type={toast.type}
          title={toast.title}
          icon={style.icon}
          color={style.color}
          onClose={() => setSharing(false)}
        />
      )}
      <div className="fixed bottom-5 right-5 z-[999] animate-[slideUp_0.3s_ease] max-w-[320px]"
        style={{
          background: 'var(--color-night-2)',
          border: `1px solid ${style.border}`,
          borderLeft: `3px solid ${style.border}`,
          borderRadius: '12px',
          padding: '14px 18px',
          boxShadow: `0 8px 28px rgba(0,0,0,.4), 0 0 20px ${style.border}22`,
        }}
        onClick={() => dismiss(toast.id)}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-sans font-bold text-[.82rem] text-txt">{toast.title}</div>
            <div className="text-[.72rem] text-txt-2">{toast.message}</div>
          </div>
          {canShare && (
            <button
              onClick={e => { e.stopPropagation(); setSharing(true); }}
              className="flex-shrink-0 text-[.65rem] font-mono font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-all border-none"
              style={{ background: style.color + '22', color: style.color }}
              title="Share this achievement">
              Share
            </button>
          )}
        </div>
      </div>
    </>
  );
}
