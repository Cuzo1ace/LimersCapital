import useStore from '../../store/useStore';
import { logNewsRead } from '../../api/supabase';
import HolographicCard from '../ui/HolographicCard';

function fmtAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Full-bleed top-of-feed hero item. Only renders when we have something
 * worth leading with (priority > 0 or event within 7 days). Otherwise
 * NewsPage falls back to the regular grid layout.
 */
export default function NewsHero({ item }) {
  const markNewsRead = useStore(s => s.markNewsRead);
  const walletAddress = useStore(s => s.walletAddress);

  if (!item) return null;

  function handleOpen() {
    const counted = markNewsRead(item.id);
    if (counted) logNewsRead({ walletAddress: walletAddress || 'anon', newsItemId: item.id, title: item.title });
    if (item.source_url) window.open(item.source_url, '_blank', 'noopener,noreferrer');
  }

  return (
    <HolographicCard
      as="article"
      onClick={handleOpen}
      intensity={0.25}
      tiltMax={3}
      className="group rounded-2xl overflow-hidden border border-border cursor-pointer mb-5 hover:border-white/20"
      style={{
        background: item.hero_image
          ? undefined
          : 'linear-gradient(135deg, rgba(0,255,163,0.08), rgba(191,129,255,0.05) 60%, rgba(18,19,22,0.9))',
      }}
    >
      {item.hero_image ? (
        <div className="relative aspect-[21/9] md:aspect-[3/1]">
          <img src={item.hero_image} alt="" loading="eager"
            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <HeroBody item={item} />
          </div>
        </div>
      ) : (
        <div className="p-5 md:p-7">
          <HeroBody item={item} />
        </div>
      )}
    </HolographicCard>
  );
}

function HeroBody({ item }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[.6rem] uppercase tracking-widest font-headline px-2 py-0.5 rounded-full bg-sea/15 border border-sea/40 text-sea">
          ★ Featured
        </span>
        {item.source_name && (
          <span className="text-[.66rem] text-muted font-mono truncate">{item.source_name}</span>
        )}
        <span className="text-[.62rem] text-muted ml-auto">{fmtAgo(item.published_at)}</span>
      </div>
      <h2 className="text-[1.2rem] md:text-[1.6rem] font-headline font-black text-txt leading-tight mb-2">
        {item.title}
      </h2>
      {item.summary && (
        <p className="text-[.88rem] md:text-[.95rem] text-txt-2 leading-relaxed line-clamp-3 max-w-3xl">
          {item.summary}
        </p>
      )}
      {item.source_url && (
        <div className="mt-3">
          <span className="text-[.74rem] text-sea group-hover:text-txt transition-colors">
            Open full story ↗
          </span>
        </div>
      )}
    </>
  );
}
