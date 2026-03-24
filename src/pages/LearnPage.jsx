import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { MODULES } from '../data/modules';
import { LESSONS } from '../data/lessons';
import { QUIZZES } from '../data/quizzes';
import { GLOSSARY } from '../data/glossary';
import { getTier, getNextTier } from '../data/gamification';
import BadgeGrid from '../components/gamification/BadgeGrid';
import { submitQuizToServer } from '../api/game';

export default function LearnPage() {
  const {
    xp, lessonsRead, quizResults, modulesCompleted, earnedBadges,
    currentStreak, viewedGlossaryTerms, markLessonRead, submitQuizResult,
    markGlossaryViewed,
  } = useStore();

  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);

  const tier = getTier(xp);
  const next = getNextTier(xp);
  const totalLessons = Object.keys(LESSONS).length;
  const readCount = Object.keys(lessonsRead).length;

  return (
    <div>
      {/* Progress Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        <StatCard icon={tier.icon} label="Tier" value={tier.name} sub={`${xp} XP`} color={tier.color} />
        <StatCard icon="📚" label="Lessons" value={`${readCount}/${totalLessons}`}
          sub={`${modulesCompleted.length}/${MODULES.length} modules`} color="var(--color-sea)" />
        <StatCard icon="🏅" label="Badges" value={earnedBadges.length}
          sub={`earned`} color="var(--color-sun)" />
        <StatCard icon="🔥" label="Streak" value={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`}
          sub={next ? `${next.xp - xp} XP to ${next.icon}` : 'Max tier!'} color="var(--color-coral)" />
      </div>

      {/* Active Lesson Detail */}
      {activeLesson && (
        <LessonDetail
          lesson={LESSONS[activeLesson]}
          isRead={!!lessonsRead[activeLesson]}
          onComplete={() => { markLessonRead(activeLesson); }}
          onClose={() => setActiveLesson(null)}
        />
      )}

      {/* Active Quiz */}
      {activeQuiz && (
        <QuizPanel
          quiz={QUIZZES[activeQuiz]}
          result={quizResults[activeQuiz]}
          onSubmit={(score, total, serverResult) => submitQuizResult(activeQuiz, score, total, serverResult)}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {/* Module Cards */}
      {!activeLesson && !activeQuiz && (
        <>
          <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Learning Modules</h2>
          <div className="flex flex-col gap-5 mb-7">
            {MODULES.map(mod => {
              const lessonsInMod = mod.lessons.map(id => LESSONS[id]).filter(Boolean);
              const readInMod = mod.lessons.filter(id => lessonsRead[id]).length;
              const quizResult = quizResults[mod.quizId];
              const isComplete = modulesCompleted.includes(mod.id);
              const progress = (readInMod / mod.lessons.length) * 100;
              const prereqMet = !mod.prereq || modulesCompleted.includes(mod.prereq);
              const prereqMod = mod.prereq ? MODULES.find(m => m.id === mod.prereq) : null;

              return (
                <div key={mod.id} className={`rounded-xl border p-6 transition-all relative ${isComplete ? 'border-up/30' : prereqMet ? 'border-border' : 'border-border opacity-60'}`}
                  style={{ background: 'var(--color-card)' }}>
                  {!prereqMet && (
                    <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center backdrop-blur-[2px]"
                      style={{ background: 'rgba(0,0,0,0.35)' }}>
                      <div className="text-center px-6">
                        <div className="text-2xl mb-2">🔒</div>
                        <div className="text-[.8rem] font-bold text-txt">Complete {prereqMod?.title || 'previous module'} first</div>
                        <div className="text-[.65rem] text-muted mt-1">Finish all lessons and pass the quiz to unlock</div>
                      </div>
                    </div>
                  )}
                  {/* Module header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">{mod.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-body font-bold text-[1rem] text-txt">{mod.title}</h3>
                        <span className={`text-[.6rem] px-2 py-0.5 rounded-full ${mod.tagCls}`}>{mod.tag}</span>
                        {isComplete && <span className="text-[.6rem] px-2 py-0.5 rounded-full bg-up/10 text-up">Complete ✓</span>}
                      </div>
                      <p className="text-[.75rem] text-txt-2">{mod.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[.65rem] text-muted">{readInMod}/{mod.lessons.length} lessons</div>
                      <div className="w-24 h-1.5 bg-night-3 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-sea rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
                    {lessonsInMod.map(l => {
                      const isRead = !!lessonsRead[l.id];
                      return (
                        <button key={l.id} onClick={() => setActiveLesson(l.id)}
                          className={`text-left rounded-xl px-4 py-3 border cursor-pointer transition-all hover:-translate-y-0.5
                            ${isRead ? 'border-up/25 bg-up/5' : 'border-border bg-black/20 hover:border-sea/30'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{l.emoji}</span>
                            <span className="font-body font-bold text-[.78rem] text-txt flex-1">{l.title}</span>
                            {isRead ? <span className="text-up text-sm">✓</span> : <span className="text-[.6rem] text-sea">+50 XP</span>}
                          </div>
                          <div className="text-[.68rem] text-muted line-clamp-2">{l.summary}</div>
                          <div className="text-[.58rem] text-muted mt-1">{l.readTime} min read</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quiz button */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <button onClick={() => setActiveQuiz(mod.quizId)}
                      className={`px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border transition-all
                        ${quizResult?.passed
                          ? 'border-up/30 bg-up/8 text-up'
                          : 'border-sea/30 bg-sea/8 text-sea hover:bg-sea/15'}`}>
                      {quizResult?.passed ? `✓ Quiz Passed (${quizResult.score}/${quizResult.total})` : '🧠 Take Quiz'}
                      {quizResult?.perfect && ' ⭐'}
                    </button>
                    <span className="text-[.62rem] text-muted">
                      {quizResult?.passed ? '' : `Pass to unlock: ${mod.unlockLabel}`}
                    </span>
                    {isComplete && <span className="ml-auto text-[.65rem] text-up">🔓 {mod.unlockLabel}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Glossary */}
          <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">
            Glossary ({viewedGlossaryTerms.length}/{GLOSSARY.length} viewed)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
            {GLOSSARY.map(g => {
              const viewed = viewedGlossaryTerms.includes(g.term);
              return (
                <div key={g.term}
                  onClick={() => markGlossaryViewed(g.term)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all
                    ${viewed ? 'border-sea/20 bg-sea/3' : 'border-border hover:border-sea/20'}`}
                  style={{ background: viewed ? undefined : 'var(--color-card)' }}>
                  <div className="flex items-center gap-2">
                    <div className="font-body font-bold text-[.84rem] text-sea">{g.term}</div>
                    {!viewed && <span className="text-[.55rem] text-sea">+5 XP</span>}
                    {viewed && <span className="text-up text-[.7rem]">✓</span>}
                  </div>
                  <div className="text-[.76rem] text-txt-2 leading-relaxed mt-1">{g.def}</div>
                </div>
              );
            })}
          </div>

          {/* Badges */}
          <BadgeGrid />
        </>
      )}
    </div>
  );
}

// ─── Lesson Detail View ──────────────────────────────────────────────────────
function LessonDetail({ lesson, isRead, onComplete, onClose }) {
  const [canComplete, setCanComplete] = useState(isRead);

  useEffect(() => {
    if (isRead) return;
    const timer = setTimeout(() => setCanComplete(true), 10000); // 10s reading time
    return () => clearTimeout(timer);
  }, [isRead]);

  return (
    <div className="rounded-xl border border-border p-7 mb-7" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{lesson.emoji}</span>
          <div>
            <h2 className="font-body font-bold text-[1.1rem] text-txt">{lesson.title}</h2>
            <span className="text-[.68rem] text-muted">{lesson.readTime} min read · Lesson {lesson.num}</span>
          </div>
        </div>
        <button onClick={onClose}
          className="text-muted hover:text-txt cursor-pointer bg-transparent border-none text-xl">✕</button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {lesson.content.map((para, i) => (
          <p key={i} className="text-[.82rem] text-txt-2 leading-relaxed">{para}</p>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {isRead ? (
          <div className="flex items-center gap-2 text-up text-[.82rem]">
            <span>✓</span> <span>Lesson completed</span>
          </div>
        ) : (
          <button onClick={() => { onComplete(); }}
            disabled={!canComplete}
            className={`px-5 py-2.5 rounded-xl font-body font-bold text-[.82rem] cursor-pointer border-none transition-all
              ${canComplete
                ? 'bg-up text-night hover:brightness-90'
                : 'bg-muted/20 text-muted cursor-not-allowed'}`}>
            {canComplete ? '✓ Mark as Complete (+50 XP)' : 'Reading... (10s)'}
          </button>
        )}
        <button onClick={onClose}
          className="px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border border-border text-muted bg-transparent hover:text-txt">
          ← Back to modules
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Panel ──────────────────────────────────────────────────────────────
// Answers are validated server-side via /game/quiz-submit.
// The client sends user selections; the server returns correct/incorrect + explanations.
function QuizPanel({ quiz, result, onSubmit, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(!!result?.passed);
  const [showResults, setShowResults] = useState(!!result?.passed);
  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState(null); // { correct: bool[], explanations: string[], score, total, passed, perfect }
  const [submitError, setSubmitError] = useState(null);

  const questions = quiz.questions;
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuizToServer(quiz.id, answers, totalQ);
      setServerResult(result);
      onSubmit(result.score, result.total, result);
      setSubmitted(true);
      setShowResults(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const score = serverResult?.score ?? 0;
  const passed = serverResult?.passed ?? false;

  return (
    <div className="rounded-xl border border-border p-7 mb-7" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-body font-bold text-[1.1rem] text-txt">🧠 {quiz.title}</h2>
        <button onClick={onClose}
          className="text-muted hover:text-txt cursor-pointer bg-transparent border-none text-xl">✕</button>
      </div>

      {result?.passed && !Object.keys(answers).length ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-3">{result.perfect ? '⭐' : '✓'}</div>
          <div className="text-up font-bold text-[1rem] mb-1">Quiz Passed!</div>
          <div className="text-muted text-[.8rem]">Score: {result.score}/{result.total}{result.perfect ? ' — Perfect!' : ''}</div>
          <button onClick={() => { setAnswers({}); setSubmitted(false); setShowResults(false); setServerResult(null); }}
            className="mt-4 px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border border-border text-sea bg-transparent hover:bg-sea/8">
            Retake Quiz
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 mb-5">
            {questions.map((q, qi) => (
              <div key={qi}>
                <p className="font-body font-bold text-[.88rem] text-txt mb-3">
                  {qi + 1}. {q.q}
                </p>
                <div className="flex flex-col gap-2">
                  {q.opts.map((opt, oi) => {
                    let cls = 'border-border bg-black/20 text-txt-2 hover:border-sea/30';
                    if (showResults && serverResult) {
                      if (serverResult.correct[qi] && answers[qi] === oi) cls = 'border-up text-up bg-up/10';
                      else if (!serverResult.correct[qi] && answers[qi] === oi) cls = 'border-down text-down bg-down/10';
                      else if (serverResult.correctAnswers && serverResult.correctAnswers[qi] === oi) cls = 'border-up text-up bg-up/10';
                    } else if (answers[qi] === oi) {
                      cls = 'border-sea text-sea bg-sea/8';
                    }
                    return (
                      <button key={oi}
                        disabled={submitted || submitting}
                        onClick={() => setAnswers({ ...answers, [qi]: oi })}
                        className={`text-left rounded-xl px-4 py-2.5 text-[.78rem] font-mono border cursor-pointer transition-all ${cls} disabled:cursor-default`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    );
                  })}
                </div>
                {showResults && serverResult && !serverResult.correct[qi] && serverResult.explanations?.[qi] && (
                  <div className="mt-2 text-[.74rem] text-coral bg-down/8 border border-down/20 rounded-lg px-3 py-2">
                    {serverResult.explanations[qi]}
                  </div>
                )}
                {showResults && serverResult && serverResult.correct[qi] && serverResult.explanations?.[qi] && (
                  <div className="mt-2 text-[.74rem] text-up bg-up/8 border border-up/20 rounded-lg px-3 py-2">
                    Correct! {serverResult.explanations[qi]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="rounded-xl p-3 mb-4 border border-down/30 bg-down/8 text-down text-[.78rem]">
              {submitError}
            </div>
          )}

          {!submitted ? (
            <button onClick={handleSubmit} disabled={answeredCount < totalQ || submitting}
              className="px-6 py-3 rounded-xl font-body font-bold text-[.85rem] cursor-pointer border-none bg-sea text-night transition-all hover:brightness-90 disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQ} answered)`}
            </button>
          ) : (
            <div className={`rounded-xl p-4 border ${passed ? 'border-up/30 bg-up/8' : 'border-down/30 bg-down/8'}`}>
              <div className={`font-bold text-[1rem] mb-1 ${passed ? 'text-up' : 'text-down'}`}>
                {passed ? '🎉 Passed!' : '❌ Not quite'} — {score}/{totalQ}
                {score === totalQ && ' ⭐ Perfect!'}
              </div>
              <div className="text-[.78rem] text-txt-2">
                {passed
                  ? `+${score === totalQ ? '150' : '100'} XP earned!`
                  : `You need ${Math.ceil(totalQ * 0.7)} correct to pass. Try again!`}
              </div>
              {!passed && (
                <button onClick={() => { setAnswers({}); setSubmitted(false); setShowResults(false); setServerResult(null); setSubmitError(null); }}
                  className="mt-3 px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border border-border text-sea bg-transparent hover:bg-sea/8">
                  Retry Quiz
                </button>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={onClose}
        className="mt-4 px-4 py-2 rounded-lg text-[.75rem] font-mono cursor-pointer border border-border text-muted bg-transparent hover:text-txt">
        ← Back to modules
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[.66rem] text-muted uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-headline text-[1.6rem] font-black" style={{ color }}>{value}</div>
      {sub && <div className="text-[.68rem] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
