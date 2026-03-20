import { useEffect } from 'react';
import useStore from '../../store/useStore';

const TYPE_STYLES = {
  xp:     { border: 'var(--color-sea)', bg: 'rgba(0,200,180,.08)', icon: '⚡' },
  lp:     { border: '#2D9B56', bg: 'rgba(45,155,86,.08)', icon: '🍋' },
  level:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🎉' },
  badge:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🏅' },
  unlock: { border: 'var(--color-coral)', bg: 'rgba(255,92,77,.08)', icon: '🔓' },
};

export default function RewardToast() {
  const toasts = useStore(s => s.pendingToasts);
  const dismiss = useStore(s => s.dismissToast);

  const toast = toasts[0]; // Show one at a time

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  if (!toast) return null;

  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.xp;

  return (
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
        <div>
          <div className="font-sans font-bold text-[.82rem] text-txt">{toast.title}</div>
          <div className="text-[.72rem] text-txt-2">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
