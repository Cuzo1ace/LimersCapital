import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowTrackCard from '../ui/GlowTrackCard';

/**
 * GlossaryCategorySection — collapsible accordion for one category of glossary terms.
 *
 * Shows category header (icon · label · viewed/total counter) with click-to-expand
 * grid of term cards. Auto-collapses categories where every term has been viewed,
 * but stays expandable.
 */
export default function GlossaryCategorySection({ category, terms, viewedTerms, onSelectTerm, defaultOpen }) {
  const viewedCount = terms.filter(t => viewedTerms.includes(t.term)).length;
  const total = terms.length;
  const allViewed = viewedCount === total;
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="rounded-xl border border-border overflow-hidden mb-3" style={{ background: 'var(--color-card)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-transparent border-none text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-[1.2rem]" aria-hidden="true">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body font-bold text-[.92rem] text-txt">{category.label}</span>
            <span className="text-[.65rem] font-mono text-muted">({total})</span>
            {allViewed && <span className="text-up text-[.7rem]" aria-label="all terms viewed">✓</span>}
          </div>
          <div className="text-[.7rem] text-txt-2 mt-0.5">{category.tagline}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-[.7rem] font-mono text-muted">{viewedCount}/{total}</div>
          <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full transition-all" style={{ width: `${total ? (viewedCount / total) * 100 : 0}%`, background: 'var(--color-sea)' }} />
          </div>
          <span className={`text-muted text-[.8rem] transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true">›</span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4 pt-1">
              {terms.map(term => {
                const viewed = viewedTerms.includes(term.term);
                return (
                  <GlowTrackCard
                    key={term.term}
                    glowColor={viewed ? 'green' : 'purple'}
                    onClick={() => onSelectTerm(term)}
                    className={`p-3.5 transition-all ${viewed ? 'bg-sea/3' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-body font-bold text-[.84rem] text-sea">{term.term}</div>
                      {!viewed && <span className="text-[.55rem] text-sea">+5 XP</span>}
                      {viewed && <span className="text-up text-[.7rem]">✓</span>}
                    </div>
                    <div className="text-[.74rem] text-txt-2 leading-relaxed">{term.def}</div>
                    {term.metaphor && (
                      <div className="text-[.7rem] text-coral italic mt-2 leading-relaxed">
                        <span className="not-italic font-mono text-[.6rem] text-muted mr-1">METAPHOR ·</span>
                        {term.metaphor}
                      </div>
                    )}
                  </GlowTrackCard>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
