import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSourceBrand } from '../../lib/newsBrand';
import TiltCard from '../ui/TiltCard';

/**
 * Click-to-reveal card anchored to a bubble in NewsBubbleMap.
 *
 * The card is an HTML overlay positioned in the bubble map's viewport
 * by the parent (via `style`). Three variants:
 *
 *   • item    — full headline + summary + source CTA + "Open fully"
 *   • ticker  — symbol, mention count, top articles, "Filter feed"
 *   • tag     — tag name, count, top articles, "Filter feed"
 *
 * Props:
 *   node           — the d3 node data { kind, id, label, item?, ticker?, tag?, count? }
 *   items          — full news feed (for ticker/tag top-article lookup)
 *   style          — absolute positioning style (left/top/transform)
 *   onClose        — close handler
 *   onOpenModal    — open the full NewsPreviewModal (item cards)
 *   onFilterFeed   — apply a filter chip + exit map view
 *   onOpenItem     — open another item's popover (used by "related articles")
 */
export default function BubblePopover({
  node,
  items = [],
  style,
  onClose,
  onOpenModal,
  onFilterFeed,
  onOpenItem,
}) {
  if (!node) return null;

  return (
    <motion.div
      role="dialog"
      aria-label={`Details: ${node.label}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ type: 'spring', stiffness: 480, damping: 28 }}
      className="absolute z-[60] w-[280px] md:w-[320px] pointer-events-auto"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <TiltCard
        tiltLimit={8}
        scale={1.02}
        perspective={1400}
        effect="evade"
        spotlight
        className="rounded-xl border backdrop-blur-xl"
        style={{
          background: 'rgba(13,14,16,0.92)',
          borderColor: 'rgba(255,255,255,0.14)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,163,0.06)',
        }}
      >
        {/* Pointer from bubble to card (small tick on top-left) */}
        <div
          className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 border-l border-t pointer-events-none z-20"
          style={{
            background: 'rgba(13,14,16,0.92)',
            borderColor: 'rgba(255,255,255,0.14)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close card"
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-txt hover:bg-white/5 cursor-pointer border-none bg-transparent text-[.72rem] transition-colors z-20"
        >
          ✕
        </button>

        {node.kind === 'item' && (
          <ItemCard node={node} onClose={onClose} onOpenModal={onOpenModal} />
        )}
        {node.kind === 'ticker' && (
          <TickerCard node={node} items={items} onFilterFeed={onFilterFeed} onOpenItem={onOpenItem} />
        )}
        {node.kind === 'tag' && (
          <TagCard node={node} items={items} onFilterFeed={onFilterFeed} onOpenItem={onOpenItem} />
        )}
      </TiltCard>
    </motion.div>
  );
}

// ── Item variant ────────────────────────────────────────────
function ItemCard({ node, onClose, onOpenModal }) {
  const item = node.item;
  const brand = getSourceBrand(item.source_name);
  const ago = fmtAgo(item.published_at);

  return (
    <div className="p-4">
      <div className="flex items-center gap-1.5 pr-6 mb-1.5">
        <span
          className="text-[.58rem] uppercase tracking-widest font-headline px-1.5 py-0.5 rounded border"
          style={{ color: brand.accent, borderColor: brand.accent + '66', background: brand.accent + '12' }}
        >
          {item.source_type === 'event' ? 'Event' : item.source_type === 'ai_summary' ? 'AI Brief' : 'Story'}
        </span>
        <span className="text-[.62rem] text-muted font-mono truncate">{item.source_name}</span>
        <span className="text-[.58rem] text-muted ml-auto flex-shrink-0">{ago}</span>
      </div>

      <h3 className="text-[.86rem] md:text-[.92rem] font-body font-bold text-txt leading-snug mb-2">
        {item.title}
      </h3>

      {item.summary && (
        <p className="text-[.72rem] text-txt-2 leading-relaxed line-clamp-4 mb-3">
          {item.summary}
        </p>
      )}

      {/* Tag + ticker chips */}
      {(item.tickers?.length > 0 || item.tags?.length > 0) && (
        <div className="flex items-center gap-1 flex-wrap mb-3">
          {(item.tickers || []).slice(0, 3).map(t => (
            <span key={`tk-${t}`} className="text-[.56rem] font-mono font-bold px-1.5 py-0.5 rounded border"
              style={{ color: brand.accent, borderColor: brand.accent + '55', background: brand.accent + '12' }}>
              ${t}
            </span>
          ))}
          {(item.tags || []).slice(0, 4).map(tag => (
            <span key={`tg-${tag}`} className="text-[.54rem] text-muted bg-white/5 border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {item.source_url ? (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 text-center px-3 py-1.5 rounded-md font-headline uppercase tracking-widest text-[.62rem] no-underline transition-all hover:-translate-y-px"
            style={{
              background: brand.gradient,
              color: '#0d0e10',
              boxShadow: `0 4px 12px ${brand.accent}44`,
            }}
          >
            Read ↗
          </a>
        ) : (
          <span className="flex-1 text-center text-[.62rem] text-muted italic py-1.5">Limer's original</span>
        )}
        <button
          onClick={() => onOpenModal?.(item)}
          className="px-2.5 py-1.5 rounded-md text-[.62rem] font-headline uppercase tracking-widest text-muted hover:text-txt hover:bg-white/5 border border-border bg-transparent cursor-pointer transition-colors"
          title="Open full preview"
        >
          Full
        </button>
      </div>
    </div>
  );
}

// ── Ticker variant ──────────────────────────────────────────
function TickerCard({ node, items, onFilterFeed, onOpenItem }) {
  const related = useMemo(
    () => items.filter(it => (it.tickers || []).some(t =>
      String(t).toUpperCase() === String(node.ticker).toUpperCase()
    )).slice(0, 3),
    [items, node.ticker],
  );
  const chip = mapTagToChip(node.ticker?.toLowerCase()) || 'all';

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 pr-6 mb-1.5">
        <span className="text-[1.1rem] font-headline font-black" style={{ color: '#00ffa3' }}>
          ${node.ticker}
        </span>
        <span className="text-[.62rem] text-muted font-mono">
          {node.count} {node.count === 1 ? 'mention' : 'mentions'}
        </span>
      </div>
      <p className="text-[.7rem] text-txt-2 leading-relaxed mb-3">
        Ticker bubble — size scales with how often ${node.ticker} appears across the feed.
      </p>

      {related.length > 0 && (
        <div className="mb-3">
          <div className="text-[.54rem] uppercase tracking-widest text-muted font-headline mb-1.5">
            Recent coverage
          </div>
          <ul className="flex flex-col gap-1">
            {related.map(it => (
              <li key={it.id}>
                <button
                  onClick={() => onOpenItem?.(it)}
                  className="w-full text-left text-[.68rem] text-txt-2 hover:text-txt line-clamp-1 bg-transparent border-none cursor-pointer p-0 transition-colors"
                >
                  · {it.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => onFilterFeed?.(chip)}
        className="w-full px-3 py-1.5 rounded-md font-headline uppercase tracking-widest text-[.62rem] bg-sea/15 border border-sea/40 text-sea hover:bg-sea/25 cursor-pointer transition-colors"
      >
        Filter feed by ${node.ticker} →
      </button>
    </div>
  );
}

// ── Tag variant ─────────────────────────────────────────────
function TagCard({ node, items, onFilterFeed, onOpenItem }) {
  const related = useMemo(
    () => items.filter(it => (it.tags || []).includes(node.tag)).slice(0, 3),
    [items, node.tag],
  );
  const chip = mapTagToChip(node.tag);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 pr-6 mb-1.5">
        <span className="text-[1rem] font-headline font-black text-[#bf81ff]">
          #{node.tag}
        </span>
        <span className="text-[.62rem] text-muted font-mono">
          {node.count} {node.count === 1 ? 'article' : 'articles'}
        </span>
      </div>
      <p className="text-[.7rem] text-txt-2 leading-relaxed mb-3">
        Tag bubble — groups articles that share this topic across the feed.
      </p>

      {related.length > 0 && (
        <div className="mb-3">
          <div className="text-[.54rem] uppercase tracking-widest text-muted font-headline mb-1.5">
            Recent coverage
          </div>
          <ul className="flex flex-col gap-1">
            {related.map(it => (
              <li key={it.id}>
                <button
                  onClick={() => onOpenItem?.(it)}
                  className="w-full text-left text-[.68rem] text-txt-2 hover:text-txt line-clamp-1 bg-transparent border-none cursor-pointer p-0 transition-colors"
                >
                  · {it.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => onFilterFeed?.(chip)}
        className="w-full px-3 py-1.5 rounded-md font-headline uppercase tracking-widest text-[.62rem] bg-[rgba(191,129,255,0.15)] border border-[rgba(191,129,255,0.4)] text-[#bf81ff] hover:bg-[rgba(191,129,255,0.22)] cursor-pointer transition-colors"
      >
        Filter feed by #{node.tag} →
      </button>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────
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

function mapTagToChip(tag) {
  if (!tag) return 'all';
  const t = String(tag).toLowerCase();
  if (t === 'solana' || t === 'sol') return 'solana';
  if (t === 'ttse') return 'ttse';
  if (t === 'caribbean') return 'caribbean';
  if (t === 'education' || t === 'learn') return 'learn';
  if (t === 'event' || t === 'events' || t === 'hackathon') return 'events';
  return 'all';
}
