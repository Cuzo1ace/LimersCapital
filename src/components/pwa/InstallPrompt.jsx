/**
 * PWA Install Prompt — shows a dismissible banner inviting users
 * to add the app to their home screen.
 *
 * - Listens for the `beforeinstallprompt` event (Chrome/Edge/Samsung)
 * - Falls back to instruction toast for Safari (iOS)
 * - Remembers dismissal in localStorage for 14 days
 * - Only shows after 2+ sessions (don't nag first-time visitors)
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

const DISMISS_KEY = 'limer_pwa_dismiss';
const DISMISS_DAYS = 14;

function isDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);
  const sessionCount = useStore((s) => s.sessionCount ?? 0);

  // Capture the browser's install prompt
  useEffect(() => {
    if (isDismissed() || sessionCount < 2) return;

    // Already installed as PWA?
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari detection — no beforeinstallprompt, show manual hint
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      const timer = setTimeout(() => {
        if (!isDismissed()) {
          setShowIOSHint(true);
          setVisible(true);
        }
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [sessionCount]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed();
    setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-3 right-3 z-[80] mx-auto max-w-md rounded-2xl border border-border bg-night-2/95 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sea/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sea">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-txt">
                Install Limer&apos;s Capital
              </p>
              <p className="mt-0.5 text-xs text-txt-2">
                {showIOSHint
                  ? 'Tap the share button, then "Add to Home Screen"'
                  : 'Add to your home screen for faster access & offline support'}
              </p>

              {/* Action buttons — only for non-iOS */}
              {!showIOSHint && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="rounded-lg bg-sea px-4 py-1.5 text-xs font-semibold text-night transition-colors hover:bg-sea-dk active:scale-95"
                  >
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg px-3 py-1.5 text-xs text-txt-2 transition-colors hover:text-txt"
                  >
                    Not now
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 text-txt-2 transition-colors hover:text-txt"
              aria-label="Dismiss install prompt"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
