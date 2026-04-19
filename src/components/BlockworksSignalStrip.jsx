import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { CURATED_HEADLINES, BLOCKWORKS_HOME, BLOCKWORKS_RESEARCH } from '../data/blockworks';

/**
 * BlockworksSignalStrip — thin rotating institutional-context row on the
 * Dashboard. Frees users see the presence of research / macro / podcast
 * signal; pro users get a "Open Research Hub →" CTA that opens Terminal
 * → Research. Both tiers see a link to blockworks.com.
 *
 * Intentionally low-calorie: single-row height, rotating every 6s, subtle
 * kicker chip + headline + attribution. Complements the Edge Layer's
 * Signal pillar ("what's happening outside your app is part of your edge").
 */

const ROTATE_MS = 6000;

export default function BlockworksSignalStrip() {
  const userTier = useStore((s) => s.userTier);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(
      () => setIdx((i) => (i + 1) % CURATED_HEADLINES.length),
      ROTATE_MS
    );
    return () => clearInterval(iv);
  }, []);

  const h = CURATED_HEADLINES[idx];
  if (!h) return null;
  const isPro = userTier === 'pro';

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-2.5 mb-4 overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, rgba(196,108,255,.06), rgba(0,0,0,0) 60%)',
        borderColor: 'rgba(196,108,255,.18)',
      }}
      aria-label="Institutional research signal · curated by Blockworks"
    >
      {/* Brand chip */}
      <a
        href={BLOCKWORKS_HOME}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-[.56rem] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full no-underline"
        style={{ color: '#C46CFF', background: 'rgba(196,108,255,.1)', border: '1px solid rgba(196,108,255,.25)' }}
        title="Open Blockworks in a new tab"
      >
        BLOCKWORKS ↗
      </a>

      {/* Kicker */}
      <span className="flex-shrink-0 hidden sm:inline-block text-[.56rem] font-mono uppercase tracking-widest text-txt-2">
        {h.kicker}
      </span>

      {/* Rotating headline */}
      <a
        href={h.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-[.75rem] text-txt truncate no-underline hover:text-[#C46CFF] transition-colors"
        key={h.url}
        title={h.title}
      >
        {h.title}
      </a>

      {/* Tier CTA */}
      {isPro ? (
        <button
          onClick={() => setActiveTab('terminal')}
          className="flex-shrink-0 text-[.6rem] font-mono font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors"
          style={{
            color: '#C46CFF',
            borderColor: 'rgba(196,108,255,.3)',
            background: 'rgba(196,108,255,.08)',
          }}
        >
          Research Hub →
        </button>
      ) : (
        <a
          href={BLOCKWORKS_RESEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-[.6rem] font-mono px-2.5 py-1 rounded-lg border text-txt-2 hover:text-txt transition-colors no-underline"
          style={{ borderColor: 'var(--color-border)' }}
          title="More research on Blockworks"
        >
          More →
        </a>
      )}

      {/* Rotation pips */}
      <div className="hidden md:flex items-center gap-1 ml-1 flex-shrink-0">
        {CURATED_HEADLINES.map((_, i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full transition-all"
            style={{
              background: i === idx ? '#C46CFF' : 'rgba(255,255,255,.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
