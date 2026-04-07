import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { getMicroLesson } from '../data/microLessons';

/**
 * MicroLesson — Enhanced tooltip with first-encounter teaching.
 *
 * On first encounter: pulsing dot indicator, click to expand full lesson.
 * After viewed: standard tooltip behavior on hover.
 * Awards 5 XP + 1 LP per unique concept learned.
 *
 * @param {string} concept — slug matching a micro-lesson (e.g. 'leverage')
 * @param {React.ReactNode} children — the text to wrap
 */
export default function MicroLesson({ concept, children }) {
  const viewedMicroLessons = useStore(s => s.viewedMicroLessons);
  const viewMicroLesson = useStore(s => s.viewMicroLesson);
  const setActiveTab = useStore(s => s.setActiveTab);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState('bottom');
  const ref = useRef(null);

  const lesson = getMicroLesson(concept);
  const isViewed = viewedMicroLessons.includes(concept);

  // Auto-position
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos(rect.bottom > window.innerHeight - 220 ? 'top' : 'bottom');
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

  if (!lesson) {
    return <span>{children}</span>;
  }

  const handleOpen = () => {
    setOpen(true);
    if (!isViewed) {
      viewMicroLesson(concept);
    }
  };

  const handleLearnMore = (e) => {
    e.stopPropagation();
    setActiveTab('learn');
    setOpen(false);
  };

  // After viewed: simple hover tooltip
  if (isViewed) {
    return (
      <span
        ref={ref}
        className="relative inline-flex items-center cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        tabIndex={0}
        role="button"
        aria-label={`${lesson.title}: ${lesson.content}`}
      >
        <span className="border-b border-dotted border-muted/60 text-inherit">
          {children}
        </span>
        {open && (
          <span
            className={`absolute z-50 w-[280px] px-3.5 py-3 rounded-xl text-[.72rem] leading-relaxed
              border border-sea/20 text-txt-2 shadow-lg shadow-black/40 pointer-events-none
              ${pos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2`}
            style={{ background: 'rgba(13,17,23,.97)', backdropFilter: 'blur(12px)' }}
            role="tooltip"
          >
            <span className="block font-bold text-sea text-[.68rem] mb-1">{lesson.title}</span>
            {lesson.content}
          </span>
        )}
      </span>
    );
  }

  // First encounter: pulsing indicator + expandable lesson
  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
        aria-label={`Learn about ${lesson.title}`}
      >
        <span className="border-b border-dashed border-[#00ffa3]/40 text-inherit">
          {children}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#00ffa3] flex-shrink-0"
          style={{ animation: 'pulse 2s ease-in-out infinite', boxShadow: '0 0 6px rgba(0,255,163,.5)' }}
        />
      </button>

      {open && (
        <span
          className={`absolute z-50 w-[300px] rounded-xl text-[.72rem] leading-relaxed
            border shadow-lg shadow-black/50 pointer-events-auto
            ${pos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2`}
          style={{
            background: 'linear-gradient(135deg, rgba(13,17,23,.98), rgba(22,30,41,.98))',
            border: '1px solid rgba(0,255,163,.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-sea/15">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[.6rem] font-mono font-bold text-[#00ffa3] uppercase tracking-wider">
                Micro-Lesson
              </span>
              <span className="text-[.55rem] text-muted">+5 XP</span>
            </div>
            <div className="font-body font-bold text-[.82rem] text-txt">{lesson.title}</div>
          </div>

          {/* Content */}
          <div className="px-4 py-3 text-txt-2">
            {lesson.content}
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center gap-2">
            {lesson.lessonId && (
              <button
                onClick={handleLearnMore}
                className="text-[.66rem] font-bold px-2.5 py-1 rounded-lg bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/25 hover:bg-[#00ffa3]/20 transition-all cursor-pointer"
              >
                📚 Full Lesson
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="text-[.66rem] px-2.5 py-1 rounded-lg text-muted hover:text-txt border border-border hover:border-txt/30 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </span>
      )}
    </span>
  );
}
