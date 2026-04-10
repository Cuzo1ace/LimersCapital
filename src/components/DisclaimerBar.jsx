import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DisclaimerBar — clickable bar that opens a legal disclaimer modal.
 *
 * Replaces the old "Curriculum Mode" toggle. Shows a small bar labeled
 * "Disclaimer" that, when clicked, displays the full legal disclaimer
 * (no investment advice, inherent risks, account sharing for external
 * course providers, etc.).
 */
export default function DisclaimerBar({ className = '' }) {
  const [open, setOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      {/* Bar trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
          border border-sun/25 bg-sun/5 text-sun/80
          hover:text-sun hover:bg-sun/10 hover:border-sun/40
          transition-all text-xs font-body font-medium press-scale
          ${className}
        `}
        aria-label="Open legal disclaimer"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="7" />
          <line x1="8" y1="4" x2="8" y2="9" />
          <circle cx="8" cy="12" r="0.5" fill="currentColor" />
        </svg>
        <span>Disclaimer</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclaimer-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(18,19,22,0.95)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,202,58,0.15)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg"
                    style={{ background: 'rgba(255,202,58,0.12)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#FFCA3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="7" />
                      <line x1="8" y1="4" x2="8" y2="9" />
                      <circle cx="8" cy="12" r="0.5" fill="#FFCA3A" />
                    </svg>
                  </div>
                  <h2
                    id="disclaimer-title"
                    className="font-headline font-bold text-[1.05rem] text-txt"
                  >
                    Legal Disclaimer
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors text-muted hover:text-txt"
                  aria-label="Close disclaimer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="4" y1="4" x2="12" y2="12" />
                    <line x1="12" y1="4" x2="4" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[.88rem] leading-relaxed text-txt-2 font-body">
                <p>
                  The content on our site is provided by us for{' '}
                  <span className="text-txt font-medium">general information only</span>, and is not intended to amount to investment advice nor advice regarding the suitability of acquiring any crypto assets.
                </p>

                <p>
                  Users accept that there are{' '}
                  <span className="text-txt font-medium">inherent risks associated with crypto assets</span>, and the content provided on our site does not purport to mitigate or remove those risks.
                </p>

                <p>
                  Whilst we make reasonable efforts to update the information on our site, we make no representations, warranties or guarantees, whether expressed or implied, that the content on our site is accurate, complete or up to date.
                </p>

                <p>
                  Limer's Capital requires users to login when taking courses in order to track their course progress using their accounts. When a course is provided by an external party, the list of accounts that attended the course may be shared with the course provider. By using Limer's Capital, you agree to these conditions.
                </p>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2 rounded-lg font-body font-semibold text-[.85rem] text-night bg-sea hover:bg-sea-dk transition-colors press-scale"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
