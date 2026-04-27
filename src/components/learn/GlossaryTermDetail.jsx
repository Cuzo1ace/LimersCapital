import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const READ_GATE_MS = 5000;

/**
 * GlossaryTermDetail — modal showing one term's definition, real-world metaphor,
 * deeper context, and DEF source link. The "Mark as understood (+5 XP)" button
 * is gated behind a 5-second read timer (matches lesson pattern at 10s).
 *
 * Already-viewed terms skip the gate.
 */
export default function GlossaryTermDetail({ term, isViewed, onComplete, onClose }) {
  const [canComplete, setCanComplete] = useState(isViewed);
  const [secondsLeft, setSecondsLeft] = useState(isViewed ? 0 : Math.ceil(READ_GATE_MS / 1000));
  const [portalEl, setPortalEl] = useState(null);

  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  useEffect(() => {
    if (!term) return;
    if (isViewed) {
      setCanComplete(true);
      setSecondsLeft(0);
      return;
    }
    setCanComplete(false);
    setSecondsLeft(Math.ceil(READ_GATE_MS / 1000));
    const start = Date.now();
    const tick = setInterval(() => {
      const remaining = Math.max(0, READ_GATE_MS - (Date.now() - start));
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setCanComplete(true);
        clearInterval(tick);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [term?.term, isViewed]);

  // Esc-to-close
  useEffect(() => {
    if (!term) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [term, onClose]);

  if (!portalEl) return null;

  return createPortal(
    <AnimatePresence>
      {term && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Glossary term: ${term.term}`}
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            className="relative w-full max-w-lg rounded-2xl border border-border overflow-hidden"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-card)', boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}
          >
            {/* Indigo accent bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)' }} />

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-[.62rem] font-mono uppercase tracking-widest text-muted mb-1">Glossary Term</div>
                  <h2 className="font-headline font-black text-[1.4rem] text-sea leading-none">{term.term}</h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="text-muted hover:text-txt cursor-pointer bg-transparent border-none text-xl leading-none px-2"
                >
                  ✕
                </button>
              </div>

              <p className="text-[.86rem] text-txt-2 leading-relaxed mb-4">{term.def}</p>

              {term.metaphor && (
                <div className="rounded-xl border border-coral/30 px-4 py-3 mb-4" style={{ background: 'rgba(191,129,255,0.06)' }}>
                  <div className="text-[.6rem] font-mono uppercase tracking-widest text-coral mb-1">Real-world metaphor</div>
                  <p className="text-[.82rem] text-txt italic leading-relaxed">{term.metaphor}</p>
                </div>
              )}

              {term.deepContext && (
                <div className="mb-4">
                  <div className="text-[.6rem] font-mono uppercase tracking-widest text-muted mb-1.5">Why it matters</div>
                  <p className="text-[.78rem] text-txt-2 leading-relaxed">{term.deepContext}</p>
                </div>
              )}

              {term.source && (
                <a
                  href={term.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[.72rem] font-mono text-sea hover:underline mb-5"
                >
                  Read more · DeFi Education Fund ↗
                </a>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                {isViewed ? (
                  <div className="flex items-center gap-2 text-up text-[.82rem]">
                    <span>✓</span> <span>Already understood</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { onComplete(term.term); onClose(); }}
                    disabled={!canComplete}
                    className={`px-5 py-2.5 rounded-xl font-body font-bold text-[.82rem] cursor-pointer border-none transition-all
                      ${canComplete
                        ? 'bg-sea text-night hover:brightness-90'
                        : 'bg-muted/20 text-muted cursor-not-allowed'}`}
                  >
                    {canComplete ? '✓ Mark as understood (+5 XP)' : `Reading… ${secondsLeft}s`}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border border-border text-muted bg-transparent hover:text-txt"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalEl
  );
}
