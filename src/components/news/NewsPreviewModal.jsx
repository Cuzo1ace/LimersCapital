import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { logNewsRead } from '../../api/supabase';
import { getSourceBrand, placeholderStyle } from '../../lib/newsBrand';

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
 * Full-screen preview modal opened when a bento tile is clicked.
 * The gallery "wow moment" — expanded hero (or branded placeholder),
 * full summary, tags, and a prominent CTA to read the source article.
 *
 * Fires markNewsRead + logNewsRead on open (counts preview as engagement).
 */
export default function NewsPreviewModal({ item, onClose }) {
  const markNewsRead = useStore(s => s.markNewsRead);
  const walletAddress = useStore(s => s.walletAddress);

  // Mark as read on open (dedup'd per-day in store).
  useEffect(() => {
    if (!item?.id) return;
    const counted = markNewsRead(item.id);
    if (counted) {
      logNewsRead({
        walletAddress: walletAddress || 'anon',
        newsItemId: item.id,
        title: item.title,
      });
    }
  }, [item?.id, markNewsRead, walletAddress]);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  const brand = getSourceBrand(item.source_name);
  const hasImage = !!item.hero_image;

  return (
    <AnimatePresence>
      <motion.div
        key="news-modal-backdrop"
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(10px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        <motion.article
          key="news-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ y: 24, scale: 0.97, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 24, scale: 0.97, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="relative rounded-2xl overflow-hidden border border-border max-h-[92vh] overflow-y-auto"
          style={{
            width: 'min(760px, 100%)',
            background: 'var(--color-night-2)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          {/* Hero media — image OR branded gradient */}
          <div className="relative aspect-[16/9] overflow-hidden" style={!hasImage ? placeholderStyle(item.source_name) : undefined}>
            {hasImage ? (
              <img
                src={item.hero_image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[6rem] md:text-[8rem] opacity-30 select-none">{brand.glyph}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer border-none backdrop-blur-sm transition-colors text-[.95rem]"
            >
              ✕
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[.62rem] uppercase tracking-widest font-headline px-2 py-0.5 rounded-full border"
                  style={{ color: brand.accent, borderColor: brand.accent + '66' }}
                >
                  {item.source_type === 'event' ? 'Event' : item.source_type === 'ai_summary' ? 'AI Brief' : 'Story'}
                </span>
                {item.source_name && (
                  <span className="text-[.7rem] text-white/80 font-mono truncate">{item.source_name}</span>
                )}
                <span className="text-[.66rem] text-white/60 ml-auto">{fmtAgo(item.published_at)}</span>
              </div>
              <h2 className="text-[1.2rem] md:text-[1.6rem] font-headline font-black text-white leading-tight">
                {item.title}
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 md:p-6">
            {item.summary && (
              <p className="text-[.88rem] md:text-[.95rem] text-txt-2 leading-relaxed mb-4">
                {item.summary}
              </p>
            )}

            {/* Tags + tickers */}
            {(item.tags?.length > 0 || item.tickers?.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {(item.tickers || []).map(t => (
                  <span key={`tk-${t}`} className="text-[.66rem] font-mono font-bold px-2 py-0.5 rounded border"
                    style={{ color: brand.accent, borderColor: brand.accent + '55', background: brand.accent + '12' }}>
                    ${t}
                  </span>
                ))}
                {(item.tags || []).slice(0, 6).map(tag => (
                  <span key={`tg-${tag}`} className="text-[.6rem] text-muted bg-white/5 border border-border rounded px-2 py-0.5 uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* AI disclaimer */}
            {item.source_type === 'ai_summary' && (
              <p className="text-[.66rem] text-muted italic mb-4">
                Summary generated by AI from the source article. Not financial advice.
              </p>
            )}

            {/* Primary CTA */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <span className="text-[.68rem] text-muted">
                Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-border rounded text-[.64rem] font-mono">Esc</kbd> to close
              </span>
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg font-headline uppercase tracking-widest text-[.72rem] no-underline transition-all hover:-translate-y-0.5"
                  style={{
                    background: brand.gradient,
                    color: '#0d0e10',
                    boxShadow: `0 4px 14px ${brand.accent}55`,
                  }}
                >
                  Read full article ↗
                </a>
              ) : (
                <span className="text-[.72rem] text-muted italic">Limer's original — no external link</span>
              )}
            </div>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  );
}
