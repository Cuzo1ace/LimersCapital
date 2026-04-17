import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSourceBrand, placeholderStyle } from '../../lib/newsBrand';
import NewsPreviewModal from './NewsPreviewModal';

/**
 * Bento-style news grid — adapted from 21st.dev's InteractiveBentoGallery
 * for a text-first news feed.
 *
 * What's kept from the original:
 *   • Staggered scroll-in animation
 *   • Varying tile spans (visual rhythm)
 *   • Playful drag (non-persistent reorder within the current session)
 *   • Hover scale
 *
 * What's adapted:
 *   • No internal gallery modal viewer — we use NewsPreviewModal with a
 *     prominent "Read full article" external CTA (retention loop).
 *   • Most cards have no hero_image → branded gradient placeholder with
 *     source-specific accent (see `lib/newsBrand.js`).
 *   • Drag does NOT persist (per product decision: ranking should win
 *     between sessions; drag is just playful tactility).
 *
 * Tile span logic:
 *   priority >= 50            → col-span-2 row-span-2 (hero)
 *   priority >= 30 (or image) → col-span-2 row-span-1 (wide)
 *   else                      → col-span-1 row-span-1 (standard)
 */

function tileSpan(item) {
  const p = Number(item.priority || 0);
  if (p >= 50) return 'md:col-span-2 md:row-span-2';
  if (p >= 30 || item.hero_image) return 'md:col-span-2 md:row-span-1';
  return 'md:col-span-1 md:row-span-1';
}

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

export default function BentoNewsGrid({ items }) {
  const [selected, setSelected] = useState(null);

  if (!items.length) {
    return (
      <div className="py-10 text-center text-muted text-[.8rem]">
        No items match this filter.
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[140px] md:auto-rows-[160px]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
        }}
      >
        {items.map((item, index) => (
          <BentoTile
            key={item.id}
            item={item}
            index={index}
            onClick={() => setSelected(item)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {selected && (
          <NewsPreviewModal item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function BentoTile({ item, index, onClick }) {
  const brand = getSourceBrand(item.source_name);
  const hasImage = !!item.hero_image;
  const span = tileSpan(item);

  return (
    <motion.article
      className={`relative overflow-hidden rounded-2xl cursor-pointer border border-border group select-none ${span}`}
      variants={{
        hidden: { y: 40, scale: 0.92, opacity: 0 },
        visible: {
          y: 0,
          scale: 1,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 340,
            damping: 26,
            delay: Math.min(index * 0.04, 0.6),
          },
        },
      }}
      whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
        // Gradient goes on the article itself when there's no image.
        // Single-layer paint dodges the Tailwind-gradient-veil stacking
        // issue we hit with two nested `absolute inset-0` divs.
        ...(!hasImage ? placeholderStyle(item.source_name) : null),
      }}
    >
      {/* Image fill (only when we have one) */}
      {hasImage && (
        <img
          src={item.hero_image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      )}

      {/* Source glyph — decorative, centered */}
      {!hasImage && (
        <span
          className="absolute inset-0 flex items-center justify-center text-[3.5rem] md:text-[5rem] opacity-20 select-none transition-transform duration-500 group-hover:scale-110 pointer-events-none"
          aria-hidden="true"
        >
          {brand.glyph}
        </span>
      )}

      {/* Readability veil — only at the bottom, lets gradient shine at top */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 40%, transparent 100%)',
        }}
      />

      {/* Meta chip (top-left) */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <span
          className="text-[.56rem] uppercase tracking-widest font-headline px-1.5 py-0.5 rounded border backdrop-blur-sm"
          style={{
            color: brand.accent,
            borderColor: brand.accent + '66',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          {item.source_type === 'event' ? 'Event' : item.source_type === 'ai_summary' ? 'AI' : 'News'}
        </span>
      </div>

      {/* Date (top-right) */}
      <div className="absolute top-2.5 right-2.5">
        <span className="text-[.56rem] text-white/70 font-mono">{fmtAgo(item.published_at)}</span>
      </div>

      {/* Title + summary (bottom, grows with span size) */}
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        {item.source_name && (
          <div className="text-[.58rem] text-white/70 font-mono truncate mb-1">{item.source_name}</div>
        )}
        <h3 className={`font-body font-bold text-white leading-snug line-clamp-3 ${
          span.includes('row-span-2')
            ? 'text-[1rem] md:text-[1.2rem]'
            : 'text-[.78rem] md:text-[.88rem]'
        }`}>
          {item.title}
        </h3>
        {(span.includes('row-span-2') || span.includes('col-span-2')) && item.summary && (
          <p className="text-[.7rem] md:text-[.76rem] text-white/70 leading-relaxed line-clamp-2 mt-1.5">
            {item.summary}
          </p>
        )}
      </div>
    </motion.article>
  );
}
