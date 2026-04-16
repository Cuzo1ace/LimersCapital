import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { useNewsFeed, useUpcomingEvents } from '../../hooks/useNewsFeed';
import HolographicCard from '../ui/HolographicCard';

/**
 * "Your Morning Brief" — shown once per UTC day at the top of the News page.
 * Derives 3 bullets purely client-side from the ranked feed + upcoming events
 * + the user's interestedTickers — no extra backend calls, no AI cost.
 *
 *   • Bullet 1 — Top ticker mover (or top-ranked feed item if no personal ticker)
 *   • Bullet 2 — Next upcoming event within 72h (skipped if none)
 *   • Bullet 3 — First item tagged 'caribbean' (skipped if none)
 *
 * Dismissed via a tiny ✕; reappears next UTC day.
 */
export default function MorningBrief() {
  const seenFor = useStore(s => s.morningBriefSeenFor);
  const dismiss = useStore(s => s.dismissMorningBrief);
  const tickers = useStore(s => s.interestedTickers);

  const { items } = useNewsFeed();
  const events = useUpcomingEvents(5);

  const today = new Date().toISOString().slice(0, 10);
  const bullets = useMemo(
    () => buildBullets({ items, events, tickers }),
    [items, events, tickers],
  );

  // Don't render if already seen today OR if we have nothing meaningful to show.
  if (seenFor === today) return null;
  if (!bullets.length) return null;

  return (
    <HolographicCard
      as="section"
      aria-label="Morning brief"
      intensity={1}
      tiltMax={5}
      className="rounded-2xl border p-4 md:p-5 mb-5 overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,202,58,0.10) 0%, rgba(0,255,163,0.05) 60%, rgba(18,19,22,0.9) 100%)',
        borderColor: 'rgba(255,202,58,0.28)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-[.62rem] uppercase tracking-widest font-headline text-[#FFCA3A] mb-0.5">
            ☕ Your Morning Brief
          </div>
          <div className="text-[1rem] md:text-[1.1rem] font-headline font-black text-txt leading-tight">
            What you need to know today
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss morning brief"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-txt hover:bg-white/5 cursor-pointer border-none bg-transparent text-[.8rem] transition-colors"
        >
          ✕
        </button>
      </div>
      <ul className="flex flex-col gap-2 mt-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[.82rem] text-txt-2 leading-relaxed">
            <span className="flex-shrink-0 mt-0.5 text-[.9rem]">{b.icon}</span>
            <span>
              <span className="text-txt font-body font-semibold">{b.headline}</span>
              {b.tail && <span className="text-txt-2"> — {b.tail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </HolographicCard>
  );
}

function buildBullets({ items, events, tickers }) {
  const out = [];

  // 1. Ticker-personalized item, else top-ranked
  const tickerSet = new Set((tickers || []).map(String));
  const tickerHit = items.find(it =>
    (it.tickers || []).some(t => tickerSet.has(t)),
  );
  const top = tickerHit || items[0];
  if (top) {
    out.push({
      icon: tickerHit ? '📈' : '⭐',
      headline: top.title,
      tail: tickerHit
        ? `mentions ${top.tickers.find(t => tickerSet.has(t))}`
        : top.source_name || null,
    });
  }

  // 2. Upcoming event within 72h
  const now = Date.now();
  const soon = events.find(ev => {
    if (!ev.event_at) return false;
    const delta = new Date(ev.event_at).getTime() - now;
    return delta > 0 && delta < 72 * 3600_000;
  });
  if (soon) {
    const hoursLeft = Math.round((new Date(soon.event_at).getTime() - now) / 3600_000);
    out.push({
      icon: '📅',
      headline: soon.title,
      tail: hoursLeft < 24
        ? `in ${hoursLeft}h`
        : `in ${Math.round(hoursLeft / 24)}d`,
    });
  }

  // 3. First caribbean-tagged item (dedup against bullet 1)
  const caribbean = items.find(it =>
    it.id !== top?.id && (it.tags || []).includes('caribbean'),
  );
  if (caribbean) {
    out.push({
      icon: '🌴',
      headline: caribbean.title,
      tail: caribbean.source_name || null,
    });
  }

  return out;
}
