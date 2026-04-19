import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function CollapsibleSection({
  title,
  icon,
  accent = 'text-txt',
  count,
  defaultOpen = true,
  headerRight,
  children,
  storageKey,
  className = '',
}) {
  const [open, setOpen] = useState(() => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(`collapsible:${storageKey}`);
      if (stored === 'open') return true;
      if (stored === 'closed') return false;
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.localStorage.setItem(`collapsible:${storageKey}`, open ? 'open' : 'closed');
  }, [open, storageKey]);

  return (
    <div className={`mb-4 rounded-2xl border border-border overflow-hidden ${className}`}
      style={{ background: 'var(--color-card)' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(o => !o);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left hover:bg-white/[0.02] transition-colors select-none"
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`flex items-center justify-center ${accent}`}
        >
          <Chevron />
        </motion.span>

        <h3 className={`font-headline text-[.86rem] font-bold uppercase tracking-widest ${accent} m-0`}>
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </h3>

        {typeof count === 'number' && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-border text-[.62rem] font-mono text-txt-2 tabular-nums">
            {count}
          </span>
        )}

        {headerRight && (
          <div
            className="ml-auto flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerRight}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/60">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
