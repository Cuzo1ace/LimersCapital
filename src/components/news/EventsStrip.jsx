import { useEffect, useState } from 'react';
import { useUpcomingEvents } from '../../hooks/useNewsFeed';
import { downloadIcs } from '../../lib/ics';
import { track } from '../../analytics/track';

function fmtCountdown(ms) {
  if (ms <= 0) return 'Now';
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Horizontal strip of upcoming events with live countdowns.
 * Retention: countdowns tick from the client clock — no server load.
 */
export default function EventsStrip() {
  const events = useUpcomingEvents(6);
  const [now, setNow] = useState(() => Date.now());

  // Tick once per minute to refresh countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!events.length) return null;

  return (
    <section aria-label="Upcoming events" className="mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-[.72rem] uppercase tracking-widest text-muted font-headline">📅 Upcoming</h3>
      </div>
      <div className="flex items-stretch gap-3 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 pb-1">
        {events.map(ev => {
          const ms = ev.event_at ? new Date(ev.event_at).getTime() - now : 0;
          const soon = ms > 0 && ms < 48 * 3600_000;
          return (
            <article
              key={ev.id}
              className={`flex-shrink-0 min-w-[250px] max-w-[300px] rounded-xl border p-3 transition-all
                ${soon ? 'border-up/40 bg-up/5' : 'border-border bg-[var(--color-card)]'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[.62rem] uppercase tracking-widest text-muted font-headline">
                  {ev.source_name || 'Event'}
                </span>
                <span className={`text-[.66rem] font-mono font-bold ${soon ? 'text-up' : 'text-txt-2'}`}>
                  {fmtCountdown(ms)}
                </span>
              </div>
              <div className="text-[.82rem] font-body font-bold text-txt leading-snug mb-1.5 line-clamp-2">
                {ev.title}
              </div>
              {ev.summary && (
                <div className="text-[.68rem] text-txt-2 leading-relaxed line-clamp-2 mb-2">
                  {ev.summary}
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[.66rem] text-sea hover:text-txt no-underline transition-colors"
                  >
                    Open details ↗
                  </a>
                )}
                <button
                  onClick={() => {
                    downloadIcs({
                      id: ev.id,
                      title: ev.title,
                      summary: ev.summary,
                      startIso: ev.event_at,
                      url: ev.source_url,
                    });
                    try { track('event_ics_download', { event_id: ev.id }); } catch {}
                  }}
                  className="text-[.66rem] text-muted hover:text-txt no-underline transition-colors cursor-pointer bg-transparent border-none p-0 ml-auto"
                  title="Download .ics — add this event to your calendar"
                >
                  📅 Add to calendar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
