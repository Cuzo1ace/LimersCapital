import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { getDailyKnowledge, CATEGORY_ICONS, CATEGORY_COLORS } from '../data/dailyKnowledge';

/**
 * DailyKnowledgeCard — Rotating knowledge card on the Dashboard.
 *
 * Shows a new fact/tip every day so returning users always learn something.
 * Awards 5 XP + 2 LP on first daily view.
 */
export default function DailyKnowledgeCard() {
  const viewedDailyKnowledge = useStore(s => s.viewedDailyKnowledge);
  const lastDailyKnowledgeDate = useStore(s => s.lastDailyKnowledgeDate);
  const viewDailyKnowledge = useStore(s => s.viewDailyKnowledge);
  const setActiveTab = useStore(s => s.setActiveTab);
  const [dismissed, setDismissed] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const knowledge = getDailyKnowledge(new Date(), viewedDailyKnowledge);

  // Award XP on first view each day
  useEffect(() => {
    if (knowledge && lastDailyKnowledgeDate !== today) {
      viewDailyKnowledge(knowledge.id, today);
    }
  }, [knowledge?.id, today]);

  if (!knowledge || dismissed) return null;

  const icon = CATEGORY_ICONS[knowledge.cat] || '💡';
  const color = CATEGORY_COLORS[knowledge.cat] || '#00ffa3';
  const isNew = lastDailyKnowledgeDate !== today;

  return (
    <div
      className="rounded-xl border p-5 mb-6 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
        borderColor: `${color}30`,
      }}
    >
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[.6rem] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
          >
            {icon} {knowledge.cat}
          </span>
          <span className="text-[.6rem] font-mono text-muted uppercase tracking-wider">
            Daily Knowledge
          </span>
          {isNew && (
            <span className="text-[.55rem] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/20">
              +5 XP
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-txt text-sm cursor-pointer transition-colors flex-shrink-0"
          style={{ background: 'none', border: 'none', padding: '2px' }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <div className="font-body font-bold text-[.95rem] text-txt mb-2">
        {knowledge.title}
      </div>

      {/* Content */}
      <div className="text-[.78rem] text-txt-2 leading-relaxed mb-3">
        {knowledge.content}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3">
        {knowledge.relatedLessonId && (
          <button
            onClick={() => setActiveTab('learn')}
            className="text-[.7rem] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all"
            style={{
              background: `${color}10`,
              color,
              borderColor: `${color}25`,
            }}
          >
            📚 Related Lesson
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-[.7rem] px-3 py-1.5 rounded-lg text-muted hover:text-txt border border-border hover:border-txt/30 transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
