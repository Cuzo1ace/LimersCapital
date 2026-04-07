import { useEffect, useState } from 'react';
import useStore from '../../store/useStore';

/**
 * PostTradeInsight — Slide-up teaching card shown after trade execution.
 *
 * Displays contextual insight about what the user just did, links to
 * related lessons, and awards XP for first-time views.
 */
export default function PostTradeInsight() {
  const insight = useStore(s => s.pendingTeachingMoment);
  const dismiss = useStore(s => s.dismissTeachingMoment);
  const viewInsight = useStore(s => s.viewTeachingMoment);
  const setActiveTab = useStore(s => s.setActiveTab);
  const markGlossaryViewed = useStore(s => s.markGlossaryViewed);
  const [expanded, setExpanded] = useState(false);

  // Auto-dismiss after 20s
  useEffect(() => {
    if (!insight) return;
    setExpanded(false);
    const timer = setTimeout(() => dismiss(), 20000);
    return () => clearTimeout(timer);
  }, [insight?.id]);

  // Award XP on first view
  useEffect(() => {
    if (insight) viewInsight(insight.id);
  }, [insight?.id]);

  if (!insight) return null;

  const handleLearnMore = () => {
    if (insight.lessonId) {
      setActiveTab('learn');
    }
    dismiss();
  };

  const handleGlossaryTerm = (term) => {
    markGlossaryViewed(term);
  };

  return (
    <div
      className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-5 z-[998] animate-[slideUp_0.4s_ease] max-w-[400px]"
      style={{
        background: 'linear-gradient(135deg, rgba(13,17,23,.97), rgba(22,30,41,.97))',
        border: '1px solid rgba(0,255,163,.25)',
        borderLeft: '3px solid #00ffa3',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 12px 40px rgba(0,0,0,.5), 0 0 30px rgba(0,255,163,.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[.7rem] font-mono font-bold text-[#00ffa3] uppercase tracking-wider">
              Trade Insight
            </span>
            <span className="text-[.6rem] text-muted">+5 XP</span>
          </div>
          <div className="font-body font-bold text-[.88rem] text-txt leading-snug mb-1.5">
            {insight.title}
          </div>
          <div className="text-[.76rem] text-txt-2 leading-relaxed">
            {insight.insight}
          </div>

          {/* Caribbean context (if available) */}
          {insight.caribbeanContext && (
            <div
              className="mt-2 text-[.7rem] leading-relaxed rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,202,58,.06)', color: '#FFCA3A', border: '1px solid rgba(255,202,58,.15)' }}
            >
              🌴 {insight.caribbeanContext}
            </div>
          )}

          {/* Glossary terms */}
          {insight.glossaryTerms?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {insight.glossaryTerms.map(term => (
                <button
                  key={term}
                  onClick={() => handleGlossaryTerm(term)}
                  className="text-[.62rem] font-mono px-2 py-0.5 rounded-full border border-[#00ffa3]/20 bg-[#00ffa3]/5 text-[#00ffa3] hover:bg-[#00ffa3]/15 transition-colors cursor-pointer"
                >
                  📖 {term}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {insight.lessonId && (
              <button
                onClick={handleLearnMore}
                className="text-[.72rem] font-bold px-3 py-1.5 rounded-lg bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/25 hover:bg-[#00ffa3]/20 transition-all cursor-pointer"
              >
                📚 Learn More
              </button>
            )}
            <button
              onClick={dismiss}
              className="text-[.72rem] px-3 py-1.5 rounded-lg text-muted hover:text-txt border border-border hover:border-txt/30 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-muted hover:text-txt text-sm cursor-pointer transition-colors"
          style={{ background: 'none', border: 'none', padding: '2px' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
