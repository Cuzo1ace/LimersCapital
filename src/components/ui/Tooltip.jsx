import { useState, useRef, useEffect } from 'react';

/**
 * Hover/tap tooltip for explaining crypto jargon inline.
 * Renders as an <abbr>-style dotted underline with a popover on hover/focus.
 *
 * @param {string} term     – The visible text (e.g. "TVL")
 * @param {string} def      – Plain-English definition
 * @param {string} icon     – Optional leading icon (default "?")
 * @param {boolean} inline  – If true, renders inline with dotted underline. If false, renders as icon-only button.
 */
export default function Tooltip({ term, def, icon, inline = true, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState('bottom');
  const ref = useRef(null);
  const tipRef = useRef(null);

  // Auto-position: flip above if near bottom of viewport
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos(rect.bottom > window.innerHeight - 160 ? 'top' : 'bottom');
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  if (inline) {
    return (
      <span
        ref={ref}
        className="relative inline-flex items-center cursor-help group"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        role="button"
        aria-label={`${term}: ${def}`}
      >
        <span className="border-b border-dotted border-muted/60 text-inherit">
          {children || term}
        </span>
        {open && (
          <span
            ref={tipRef}
            className={`absolute z-50 w-[260px] px-3 py-2.5 rounded-lg text-[.72rem] leading-relaxed
              bg-[#1a1d21] border border-sea/20 text-txt-2 shadow-lg shadow-black/40
              pointer-events-none animate-in fade-in duration-150
              ${pos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2`}
            role="tooltip"
          >
            <span className="block font-bold text-sea text-[.68rem] mb-1">{term}</span>
            {def}
          </span>
        )}
      </span>
    );
  }

  // Icon-only mode (for "?" buttons next to stat cards)
  return (
    <span ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-white/8 border border-white/15 text-muted text-[.55rem]
          flex items-center justify-center cursor-pointer hover:bg-sea/15 hover:text-sea hover:border-sea/30
          transition-all flex-shrink-0"
        aria-label={`What is ${term}?`}
      >
        {icon || '?'}
      </button>
      {open && (
        <span
          className={`absolute z-50 w-[260px] px-3 py-2.5 rounded-lg text-[.72rem] leading-relaxed
            bg-[#1a1d21] border border-sea/20 text-txt-2 shadow-lg shadow-black/40
            ${pos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0`}
          role="tooltip"
        >
          <span className="block font-bold text-sea text-[.68rem] mb-1">{term}</span>
          {def}
        </span>
      )}
    </span>
  );
}

/**
 * Auto-tooltip: wraps text and automatically adds tooltips for any glossary terms found.
 * Usage: <AutoTooltip glossary={GLOSSARY}>Some text about TVL and RWA</AutoTooltip>
 */
export function GlossaryTip({ term }) {
  // Import-free: looks up from the global glossary map
  const DEFS = getGlossaryMap();
  const def = DEFS[term.toUpperCase()] || DEFS[term];
  if (!def) return <span>{term}</span>;
  return <Tooltip term={term} def={def} inline>{term}</Tooltip>;
}

// Lazy-loaded glossary map singleton
let _glossaryMap = null;
function getGlossaryMap() {
  if (!_glossaryMap) {
    try {
      // Dynamic require won't work in ESM, so we hardcode the most common terms
      _glossaryMap = {};
    } catch { _glossaryMap = {}; }
  }
  return _glossaryMap;
}

// Pre-built map for use across pages — import { GLOSSARY_MAP } from './Tooltip'
export let GLOSSARY_MAP = {};
export function setGlossaryMap(glossary) {
  GLOSSARY_MAP = {};
  glossary.forEach(g => { GLOSSARY_MAP[g.term.toUpperCase()] = g.def; GLOSSARY_MAP[g.term] = g.def; });
  _glossaryMap = GLOSSARY_MAP;
}
