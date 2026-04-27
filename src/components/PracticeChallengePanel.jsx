import { useState } from 'react';
import useStore from '../store/useStore';
import { PRACTICE_CHALLENGES } from '../data/practiceChallenges';
import { TargetIcon, CheckIcon, InsightIcon } from './icons';

const DIFF_COLORS = {
  beginner:     { bg: 'bg-up/10',    text: 'text-up',    border: 'border-up/20' },
  intermediate: { bg: 'bg-sun/10',   text: 'text-sun',   border: 'border-sun/20' },
  advanced:     { bg: 'bg-coral/10', text: 'text-coral', border: 'border-coral/20' },
};

/**
 * PracticeChallengePanel — Collapsible panel on TradePage showing practice challenges.
 *
 * Displays available challenges with real-time completion tracking.
 */
export default function PracticeChallengePanel() {
  const completedChallenges = useStore(s => s.completedPracticeChallenges);
  const activeChallengeId = useStore(s => s.activePracticeChallenge);
  const setActiveChallenge = useStore(s => s.setActivePracticeChallenge);
  const [expanded, setExpanded] = useState(false);

  const completedCount = completedChallenges.length;
  const totalCount = PRACTICE_CHALLENGES.length;
  const activeChallenge = PRACTICE_CHALLENGES.find(c => c.id === activeChallengeId);

  return (
    <div
      className="rounded-xl border border-sea/15 overflow-hidden mb-4"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--color-sea) 3%, transparent), color-mix(in srgb, var(--color-sea) 1%, transparent))',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer bg-transparent border-none"
      >
        <div className="flex items-center gap-2">
          <TargetIcon size={14} className="text-sea" />
          <span className="text-[.66rem] font-mono font-bold text-sea uppercase tracking-wider">
            Practice Challenges
          </span>
          <span className="text-[.6rem] font-mono text-muted">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeChallenge && !completedChallenges.includes(activeChallenge.id) && (
            <span className="text-[.58rem] text-sun font-mono">
              Active: {activeChallenge.title}
            </span>
          )}
          <span
            className="text-muted text-[.7rem] transition-transform"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Active challenge summary (when collapsed) */}
      {!expanded && activeChallenge && !completedChallenges.includes(activeChallenge.id) && (
        <div className="px-4 pb-3 border-t border-border/50">
          <div className="text-[.72rem] text-txt mt-2">{activeChallenge.objective}</div>
          <div className="text-[.6rem] text-muted mt-1 flex items-center gap-1">
            <InsightIcon size={11} className="text-sun" />
            {activeChallenge.hint}
          </div>
        </div>
      )}

      {/* Expanded challenge list */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3">
          <div className="flex flex-col gap-2">
            {PRACTICE_CHALLENGES.map(ch => {
              const isCompleted = completedChallenges.includes(ch.id);
              const isActive = activeChallengeId === ch.id;
              const dc = DIFF_COLORS[ch.difficulty] || DIFF_COLORS.beginner;

              return (
                <div
                  key={ch.id}
                  className={`rounded-lg border p-3 transition-all ${
                    isCompleted ? 'border-up/20 opacity-60' :
                    isActive ? 'border-sea/30 bg-sea/5' :
                    'border-border hover:border-txt/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[.55rem] font-mono px-1.5 py-0.5 rounded-full border ${dc.bg} ${dc.text} ${dc.border}`}>
                          {ch.difficulty}
                        </span>
                        <span className="font-body font-bold text-[.76rem] text-txt inline-flex items-center gap-1">
                          {isCompleted && <CheckIcon size={12} className="text-up" />}
                          {ch.title}
                        </span>
                      </div>
                      <div className="text-[.68rem] text-txt-2 leading-relaxed">{ch.objective}</div>
                      {!isCompleted && isActive && (
                        <div className="text-[.6rem] text-muted mt-1 flex items-center gap-1">
                          <InsightIcon size={11} className="text-sun" />
                          {ch.hint}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[.55rem] text-sea">+{ch.xpReward} XP</span>
                        <span className="text-[.55rem] text-palm">+{ch.lpReward} LP</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button
                        onClick={() => setActiveChallenge(isActive ? null : ch.id)}
                        className={`text-[.62rem] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex-shrink-0
                          ${isActive
                            ? 'border-muted text-muted hover:text-txt'
                            : 'border-sea/25 bg-sea/10 text-sea hover:bg-sea/20'
                          }`}
                      >
                        {isActive ? 'Deselect' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1 rounded-full overflow-hidden bg-txt/5">
          <div
            className="h-full rounded-full bg-sea transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
