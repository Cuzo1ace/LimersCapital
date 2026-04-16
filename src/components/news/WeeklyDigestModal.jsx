import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from '../../store/useStore';
import { useNewsFeed } from '../../hooks/useNewsFeed';
import HolographicCard from '../ui/HolographicCard';

/**
 * "Last week in Caribbean crypto" — a one-screen modal that fires on the
 * user's first Monday-UTC session of the week. Pulls the top-5 ranked
 * news items from the last 7 days out of the existing useNewsFeed cache
 * (so no extra network call) and renders them in a reading list.
 *
 * Gating:
 *   • Only renders when today is Monday (UTC).
 *   • Only renders once per ISO-week — tracked via weeklyDigestLastShown.
 *   • Dismissible; the dismissal updates the store.
 *
 * Mounted globally in App.jsx so it can appear regardless of the active tab.
 */
export default function WeeklyDigestModal() {
  const lastShown = useStore(s => s.weeklyDigestLastShown);
  const markShown = useStore(s => s.markWeeklyDigestShown);
  const setActiveTab = useStore(s => s.setActiveTab);
  const { items } = useNewsFeed();

  const [open, setOpen] = useState(false);

  // Decide once on mount whether to open. We also depend on `items` so
  // if the feed hydrates after first render we can still open.
  useEffect(() => {
    if (!shouldShowToday(lastShown)) return;
    if (!items?.length) return;
    setOpen(true);
  }, [lastShown, items?.length]);

  const topFive = useMemo(() => pickTopOfWeek(items), [items]);

  function handleClose() {
    markShown();
    setOpen(false);
  }

  function handleOpenNews() {
    markShown();
    setOpen(false);
    setActiveTab('news');
  }

  if (!topFive.length) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="digest-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Weekly digest"
        >
          <motion.div
            key="digest-card"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1.05] }}
            style={{ width: 'min(640px, 100%)' }}
          >
            <HolographicCard
              intensity={0.85}
              tiltMax={4}
              className="rounded-2xl border p-5 md:p-6 overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,255,163,0.10) 0%, rgba(191,129,255,0.07) 55%, rgba(18,19,22,0.96) 100%)',
                borderColor: 'rgba(0,255,163,0.32)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-[.62rem] uppercase tracking-widest font-headline text-sea mb-1">
                    📬 Weekly Digest · Monday
                  </div>
                  <h2 className="text-[1.2rem] md:text-[1.4rem] font-headline font-black text-txt leading-tight">
                    Last week in Caribbean crypto
                  </h2>
                  <p className="text-[.78rem] text-txt-2 mt-1">
                    The five stories that mattered most over the past 7 days.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Dismiss weekly digest"
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-txt hover:bg-white/5 cursor-pointer border-none bg-transparent text-[.9rem] transition-colors"
                >
                  ✕
                </button>
              </div>

              <ol className="flex flex-col gap-3 mt-3">
                {topFive.map((it, i) => (
                  <li
                    key={it.id}
                    onClick={() => {
                      if (it.source_url) window.open(it.source_url, '_blank', 'noopener,noreferrer');
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border border-border bg-[var(--color-card)] transition-all ${it.source_url ? 'cursor-pointer hover:border-white/20' : ''}`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sea/15 border border-sea/40 text-sea text-[.72rem] font-headline font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[.85rem] font-body font-bold text-txt leading-snug line-clamp-2">
                        {it.title}
                      </div>
                      {it.summary && (
                        <div className="text-[.72rem] text-txt-2 leading-relaxed line-clamp-2 mt-1">
                          {it.summary}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[.62rem] text-muted">
                        <span>{it.source_name || 'Limer\u2019s'}</span>
                        {it.source_url && <span className="text-sea">↗</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-[.66rem] text-muted italic">
                  Not financial advice
                </span>
                <button
                  onClick={handleOpenNews}
                  className="px-3 py-1.5 rounded-lg bg-sea/15 border border-sea/40 text-sea text-[.72rem] font-headline uppercase tracking-widest hover:bg-sea/25 transition-colors cursor-pointer"
                >
                  Open News →
                </button>
              </div>
            </HolographicCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── helpers ─────────────────────────────────────────────────

/** True only on Monday (UTC) and only if we haven't already shown this ISO week. */
function shouldShowToday(lastShownIso) {
  const now = new Date();
  if (now.getUTCDay() !== 1) return false;  // 0=Sun, 1=Mon

  if (!lastShownIso) return true;
  const last = new Date(lastShownIso);
  // "Different ISO-week" proxy: any previous show older than 24h on a Monday
  // means we're on a fresh Monday this week.
  const ageHours = (now.getTime() - last.getTime()) / 3600_000;
  return ageHours >= 24;
}

/** Top 5 items from the last 7 days, sorted by the existing _score from useNewsFeed. */
function pickTopOfWeek(items) {
  const weekAgo = Date.now() - 7 * 86400_000;
  return (items || [])
    .filter(it => {
      const t = new Date(it.published_at).getTime();
      return t >= weekAgo;
    })
    .slice(0, 5);
}
