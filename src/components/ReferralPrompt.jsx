import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

/**
 * ReferralPrompt — triggered after key milestones to encourage sharing.
 * Appears when `pendingReferralPrompt` is non-null in the store.
 * Max 1 prompt per session. Auto-dismisses after 20 seconds.
 */
export default function ReferralPrompt() {
  const prompt = useStore(s => s.pendingReferralPrompt);
  const dismiss = useStore(s => s.dismissReferralPrompt);
  const referralCode = useStore(s => s.referralCode);
  const generateReferralCode = useStore(s => s.generateReferralCode);
  const walletConnected = useStore(s => s.walletConnected);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss after 20 seconds
  useEffect(() => {
    if (!prompt) return;
    const timer = setTimeout(() => { dismiss(); }, 20000);
    return () => clearTimeout(timer);
  }, [prompt, dismiss]);

  // Only show once per session
  useEffect(() => {
    if (dismissed && prompt) dismiss();
  }, [dismissed, prompt, dismiss]);

  if (!prompt || dismissed) return null;

  const code = referralCode || (walletConnected ? (() => { generateReferralCode(); return 'Generating...'; })() : 'Connect wallet first');
  const shareText = `I just hit "${prompt.trigger}" on Limer's Capital! Learn crypto, trade Caribbean markets, and earn ownership. Use my code: ${code} for 200 bonus LP. https://limerscapital.com`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard may fail in some envs */ }
  };

  const handleDismiss = () => {
    setDismissed(true);
    dismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div
          className="rounded-2xl p-5 shadow-2xl border"
          style={{
            background: 'linear-gradient(135deg, rgba(0,200,180,0.12), rgba(45,155,86,0.08))',
            borderColor: 'var(--color-sea, #00C8B4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍋</span>
              <span className="font-bold text-white text-sm">{prompt.trigger}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
              aria-label="Dismiss"
            >
              x
            </button>
          </div>

          {/* Message */}
          <p className="text-white/70 text-xs mb-3">
            Share your referral code and you both get <span className="text-[#2D9B56] font-bold">200 LP</span>.
            LP converts to $LIMER tokens at airdrop!
          </p>

          {/* Referral Code */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 font-mono text-sm text-white/90 select-all">
              {referralCode || code}
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: copied ? '#2D9B56' : 'rgba(0,200,180,0.2)',
                color: copied ? '#fff' : '#00C8B4',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg text-center text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            >
              Share on X
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 rounded-lg text-center text-xs font-medium bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
