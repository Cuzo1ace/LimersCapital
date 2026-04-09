/**
 * PWA Update Prompt — notifies users when a new version is available
 * and the service worker has been updated. Offers a one-click reload.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Listen for the custom event dispatched by vite-plugin-pwa
    const handler = (e) => {
      setRegistration(e.detail);
      setShowUpdate(true);
    };
    window.addEventListener('swUpdated', handler);

    // Also check for waiting SW on load
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.waiting) {
          setRegistration(reg);
          setShowUpdate(true);
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setRegistration(reg);
              setShowUpdate(true);
            }
          });
        });
      });
    }

    return () => window.removeEventListener('swUpdated', handler);
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-16 left-3 right-3 z-[90] mx-auto max-w-md rounded-xl border border-sea/30 bg-night-2/95 px-4 py-3 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sea/10">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sea">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
              </svg>
            </div>
            <p className="flex-1 text-xs text-txt-2">
              New version available
            </p>
            <button
              onClick={handleUpdate}
              className="rounded-lg bg-sea px-3 py-1 text-xs font-semibold text-night transition-colors hover:bg-sea-dk active:scale-95"
            >
              Update
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
