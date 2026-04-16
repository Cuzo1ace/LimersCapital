import useStore from '../../store/useStore';
import { logNewsRead } from '../../api/supabase';
import HolographicCard from '../ui/HolographicCard';

function fmtAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function KindChip({ sourceType }) {
  const styles = {
    curated:    { label: 'Curated',  cls: 'text-sea bg-sea/10 border-sea/25' },
    rss:        { label: 'Feed',     cls: 'text-muted bg-white/5 border-border' },
    ai_summary: { label: 'AI Brief', cls: 'text-[#bf81ff] bg-[rgba(191,129,255,0.10)] border-[rgba(191,129,255,0.3)]' },
    event:      { label: 'Event',    cls: 'text-up bg-up/10 border-up/30' },
  };
  const s = styles[sourceType] || styles.curated;
  return (
    <span className={`text-[.58rem] uppercase tracking-widest font-headline px-1.5 py-0.5 rounded border ${s.cls}`}>
      {s.label}
    </span>
  );
}

/**
 * A single news item card. Variant behavior is keyed off `source_type`.
 * Clicking records a read event (dedup'd per-item-per-day via the store).
 */
export default function NewsCard({ item }) {
  const markNewsRead = useStore(s => s.markNewsRead);
  const walletAddress = useStore(s => s.walletAddress);

  function handleOpen() {
    const newlyCounted = markNewsRead(item.id);
    if (newlyCounted) {
      logNewsRead({ walletAddress: walletAddress || 'anon', newsItemId: item.id, title: item.title });
    }
    if (item.source_url) {
      window.open(item.source_url, '_blank', 'noopener,noreferrer');
    }
  }

  const isAi = item.source_type === 'ai_summary';
  const isEvent = item.source_type === 'event';

  return (
    <HolographicCard
      as="article"
      onClick={handleOpen}
      intensity={0.45}
      tiltMax={4}
      className="group rounded-2xl border border-border p-4 cursor-pointer hover:border-white/20 bg-[var(--color-card)]"
      style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
    >
      {item.hero_image && (
        <div className="relative -m-4 mb-3 aspect-[16/9] overflow-hidden rounded-t-2xl">
          <img src={item.hero_image} alt="" loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <KindChip sourceType={item.source_type} />
        {item.source_name && (
          <span className="text-[.62rem] text-muted font-mono truncate">{item.source_name}</span>
        )}
        <span className="text-[.62rem] text-muted ml-auto flex-shrink-0">{fmtAgo(item.published_at)}</span>
      </div>

      <h3 className="text-[.95rem] md:text-[1rem] font-body font-bold text-txt leading-snug mb-2 line-clamp-3">
        {item.title}
      </h3>

      {item.summary && (
        <p className="text-[.78rem] text-txt-2 leading-relaxed line-clamp-3 mb-3">
          {item.summary}
        </p>
      )}

      {/* tag chips */}
      {item.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {item.tags.slice(0, 4).map(t => (
            <span key={t} className="text-[.58rem] text-muted bg-white/5 border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {item.source_url ? (
          <span className="text-[.7rem] text-sea group-hover:text-txt transition-colors">
            {isEvent ? 'View event' : 'Read more'} ↗
          </span>
        ) : (
          <span className="text-[.7rem] text-muted">Limer&apos;s original</span>
        )}
        {isAi && (
          <span className="text-[.58rem] text-muted italic">Not financial advice</span>
        )}
      </div>
    </HolographicCard>
  );
}
