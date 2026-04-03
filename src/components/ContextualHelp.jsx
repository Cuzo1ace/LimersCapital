import { useState } from 'react';

/**
 * Collapsible help sidebar/panel for complex pages.
 * Shows plain-English explanations of what the user is looking at.
 *
 * @param {Array<{title, content}>} items - Help topics for this page
 * @param {string} pageTitle - Name of the current page
 */
export default function ContextualHelp({ items, pageTitle }) {
  const [open, setOpen] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!items || items.length === 0) return null;

  return (
    <>
      {/* Floating help button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full
            bg-sea/20 border border-sea/40 text-sea text-lg
            flex items-center justify-center cursor-pointer
            hover:bg-sea/30 hover:scale-105 transition-all shadow-lg shadow-sea/10"
          aria-label="Open help panel"
        >
          ?
        </button>
      )}

      {/* Help panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[320px] max-h-[70vh] overflow-y-auto
          bg-[#0d0e10] border border-sea/25 rounded-2xl shadow-2xl shadow-black/50">
          <div className="sticky top-0 bg-[#0d0e10] border-b border-white/8 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[.6rem] text-sea uppercase tracking-widest">Help</div>
              <div className="text-[.78rem] font-bold text-txt">{pageTitle}</div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-muted text-lg bg-transparent border-none cursor-pointer hover:text-txt leading-none">
              &times;
            </button>
          </div>

          <div className="p-3">
            {items.map((item, i) => (
              <div key={i} className="mb-1">
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? -1 : i)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[.76rem] font-bold text-txt
                    bg-transparent border-none cursor-pointer hover:bg-white/5 transition-colors
                    flex items-center justify-between gap-2"
                >
                  <span>{item.title}</span>
                  <span className="text-muted text-[.6rem]">{expandedIdx === i ? '▾' : '▸'}</span>
                </button>
                {expandedIdx === i && (
                  <div className="px-3 pb-3 text-[.72rem] text-txt-2 leading-relaxed">
                    {item.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
