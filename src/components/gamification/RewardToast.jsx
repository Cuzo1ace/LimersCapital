import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import ShareCard from './ShareCard';
import { useCelebration } from '../fx/CelebrationBurst';

const TYPE_STYLES = {
  xp:     { border: 'var(--color-sea)', bg: 'rgba(0,255,163,.08)', icon: '⚡', color: '#00ffa3' },
  lp:     { border: '#2D9B56', bg: 'rgba(45,155,86,.08)', icon: '🍋', color: '#2D9B56' },
  level:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🎉', color: '#FFCA3A' },
  badge:  { border: 'var(--color-sun)', bg: 'rgba(255,202,58,.08)', icon: '🏅', color: '#FFCA3A' },
  unlock: { border: 'var(--color-coral)', bg: 'rgba(255,92,77,.08)', icon: '🔓', color: '#FF5C4D' },
};

function getContextHint(toast) {
  if (!toast) return null;
  switch (toast.type) {
    case 'xp':
      return 'XP unlocks new tiers and features. Keep learning to level up!';
    case 'lp':
      return 'LP converts to $LIMER tokens at airdrop. More activity = bigger allocation.';
    case 'level':
      return 'New tier unlocked! Higher tiers grant access to advanced trading tools.';
    case 'badge':
      return 'Badges mark your milestones. Collect all 25 to maximize your airdrop bonus.';
    case 'unlock':
      return 'New feature unlocked! Check it out on the relevant page.';
    default:
      return null;
  }
}

export default function RewardToast() {
  const toasts = useStore(s => s.pendingToasts);
  const dismiss = useStore(s => s.dismissToast);
  const [sharing, setSharing] = useState(false);
  const { fire: fireCelebration, CelebrationPortal } = useCelebration();

  const toast = toasts[0]; // Show one at a time

  useEffect(() => {
    if (!toast) return;
    setSharing(false);
    // Fire celebration burst for XP and badge toasts
    if (toast.type === 'xp') fireCelebration('xp');
    if (toast.type === 'badge') fireCelebration('badge');
    if (toast.type === 'level') fireCelebration('streak');
    const timer = setTimeout(() => dismiss(toast.id), 6000);
    return () => clearTimeout(timer);
  }, [toast?.id]);

  const style = toast ? (TYPE_STYLES[toast.type] || TYPE_STYLES.xp) : TYPE_STYLES.xp;
  const canShare = toast && (toast.type === 'badge' || toast.type === 'level');
  const contextHint = getContextHint(toast);

  return (
    <>
      {sharing && toast && (
        <ShareCard
          type={toast.type}
          title={toast.title}
          icon={style.icon}
          color={style.color}
          onClose={() => setSharing(false)}
        />
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            className="fixed bottom-20 md:bottom-5 right-5 z-[999] max-w-[340px] backdrop-blur-xl gpu-accelerated"
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 25,
            }}
            style={{
              background: 'rgba(18, 19, 22, 0.85)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderLeft: `3px solid ${style.border}`,
              borderRadius: '12px',
              padding: '14px 18px',
              boxShadow: `0 8px 28px rgba(0,0,0,.4), 0 0 20px ${style.color}22`,
            }}
            onClick={() => dismiss(toast.id)}
          >
            <CelebrationPortal />
            <div className="flex items-center gap-3">
              <motion.span
                className="text-xl"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
              >
                {style.icon}
              </motion.span>
              <div className="flex-1 min-w-0">
                <div className="font-body font-bold text-[.82rem] text-txt">{toast.title}</div>
                <div className="text-[.72rem] text-txt-2">{toast.message}</div>
                {contextHint && (
                  <div className="text-[.64rem] mt-1 leading-relaxed" style={{ color: style.color + 'cc' }}>
                    {contextHint}
                  </div>
                )}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
