import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { MODULES, LEVELS, LEVEL_ORDER } from '../data/modules';
import { LESSONS } from '../data/lessons';
import { QUIZZES } from '../data/quizzes';
import { GLOSSARY } from '../data/glossary';
import { getTier, getNextTier } from '../data/gamification';
import BadgeGrid from '../components/gamification/BadgeGrid';
import SkillMap from '../components/gamification/SkillMap';
import DisclaimerBar from '../components/DisclaimerBar';
import { submitQuizToServer } from '../api/game';

/**
 * Check if a module is accessible within a level.
 * A module is accessible if:
 * 1. It's the first module in the level, OR
 * 2. The previous module in the level has its quiz passed
 * 3. AND any explicit prereq (mod.prereq) is met
 */
function isModuleAccessible(mod, idx, levelModules, quizResults, modulesCompleted) {
  // Explicit prereq check
  if (mod.prereq && !modulesCompleted.includes(mod.prereq)) return false;
  // First module in level is always accessible
  if (idx === 0) return true;
  // Previous module in level must have quiz passed
  const prevMod = levelModules[idx - 1];
  return !!quizResults[prevMod.quizId]?.passed;
}

/**
 * Find which module a lesson belongs to within levelModules.
 */
function findModuleForLesson(lessonId, levelModules) {
  return levelModules.find(mod => mod.lessons.includes(lessonId));
}

export default function LearnPage() {
  const {
    xp, lessonsRead, quizResults, modulesCompleted, earnedBadges,
    currentStreak, viewedGlossaryTerms, markLessonRead, submitQuizResult,
    markGlossaryViewed,
  } = useStore();

  const activeLevel = useStore(s => s.activeLevel);
  const setActiveLevel = useStore(s => s.setActiveLevel);
  const hasSeenLearnHero = useStore(s => s.hasSeenLearnHero);
  const setHasSeenLearnHero = useStore(s => s.setHasSeenLearnHero);

  const [activeLesson, setActiveLesson] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [contentTab, setContentTab] = useState('lessons'); // 'lessons' | 'glossary' | 'badges'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const tier = getTier(xp);
  const next = getNextTier(xp);
  const totalLessons = Object.keys(LESSONS).length;
  const readCount = Object.keys(lessonsRead).length;
  const showHero = !hasSeenLearnHero && modulesCompleted.length === 0;

  // Current level data
  const level = LEVELS[activeLevel] || LEVELS.basics;
  const levelModules = level.modules.map(id => MODULES.find(m => m.id === id)).filter(Boolean);
  const levelLessonIds = levelModules.flatMap(m => m.lessons);
  const levelLessonsRead = levelLessonIds.filter(id => lessonsRead[id]).length;
  const levelProgress = levelLessonIds.length ? Math.round((levelLessonsRead / levelLessonIds.length) * 100) : 0;

  // Prev/Next navigation within level (respects module quiz gates)
  const currentIdx = activeLesson ? levelLessonIds.indexOf(activeLesson) : -1;
  const currentMod = activeLesson ? findModuleForLesson(activeLesson, levelModules) : null;
  const currentModIdx = currentMod ? levelModules.indexOf(currentMod) : -1;
  const isLastInModule = currentMod ? activeLesson === currentMod.lessons[currentMod.lessons.length - 1] : false;
  const isFirstInModule = currentMod ? activeLesson === currentMod.lessons[0] : false;

  // Previous: can go back freely within a module, or to prev module if accessible
  let prevLessonId = null;
  if (currentIdx > 0) {
    const candidateId = levelLessonIds[currentIdx - 1];
    const candidateMod = findModuleForLesson(candidateId, levelModules);
    // Same module → always OK. Different module → check accessibility
    if (candidateMod === currentMod) {
      prevLessonId = candidateId;
    } else {
      const candidateModIdx = levelModules.indexOf(candidateMod);
      if (isModuleAccessible(candidateMod, candidateModIdx, levelModules, quizResults, modulesCompleted)) {
        prevLessonId = candidateId;
      }
    }
  }

  // Next: block crossing into next module if current module's quiz isn't passed
  let nextLessonId = null;
  let showTakeQuiz = false; // true when at last lesson → prompt quiz instead of next module
  if (currentIdx >= 0 && currentIdx < levelLessonIds.length - 1) {
    const candidateId = levelLessonIds[currentIdx + 1];
    const candidateMod = findModuleForLesson(candidateId, levelModules);
    if (candidateMod === currentMod) {
      nextLessonId = candidateId;
    } else if (quizResults[currentMod.quizId]?.passed) {
      // Current module quiz passed → can advance
      const candidateModIdx = levelModules.indexOf(candidateMod);
      if (isModuleAccessible(candidateMod, candidateModIdx, levelModules, quizResults, modulesCompleted)) {
        nextLessonId = candidateId;
      }
    } else {
      // At boundary, quiz not passed → show "Take Quiz" prompt
      showTakeQuiz = true;
    }
  } else if (isLastInModule && currentMod && !quizResults[currentMod.quizId]?.passed) {
    showTakeQuiz = true;
  }

  // Smart level detection on mount
  useEffect(() => {
    if (modulesCompleted.length > 0) {
      const smart = LEVEL_ORDER.find(lvl =>
        LEVELS[lvl].modules.some(id => !modulesCompleted.includes(id))
      ) || 'advanced';
      if (smart !== activeLevel) setActiveLevel(smart);
    }
  }, []);

  function handleLevelSwitch(lvl) {
    setActiveLevel(lvl);
    setActiveLesson(null);
    setActiveQuiz(null);
    setContentTab('lessons');
    setMobileSidebarOpen(false);
  }

  return (
    <div>
      {/* Learn Hero — Why Learn? */}
      {showHero && (
        <div className="relative rounded-xl border border-sea/25 mb-7 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06) 0%, rgba(191,129,255,.04) 100%)' }}>
          <button onClick={() => setHasSeenLearnHero(true)}
            className="absolute top-4 right-4 text-muted hover:text-txt cursor-pointer bg-transparent border-none text-lg z-10">
            &#10005;
          </button>
          <div className="px-6 py-7 md:px-8 md:py-9">
            <h2 className="font-headline text-[1.5rem] md:text-[1.8rem] font-black text-txt mb-2">
              Learn Before You Earn
            </h2>
            <p className="text-[.88rem] text-txt-2 mb-6 max-w-lg">
              In the lime, we teach each other. Complete modules to unlock trading features, earn Limer Points, and level up your tier.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-sea/20 bg-sea/5 px-4 py-4">
                <div className="text-2xl mb-2">&#128275;</div>
                <div className="font-body font-bold text-[.88rem] text-sea mb-1">Unlock Features</div>
                <div className="text-[.75rem] text-txt-2">TTSE trading, limit orders, portfolio tools — all gated behind learning.</div>
              </div>
              <div className="rounded-xl border border-sun/20 bg-sun/5 px-4 py-4">
                <div className="text-2xl mb-2">&#11088;</div>
                <div className="font-body font-bold text-[.88rem] text-sun mb-1">Earn LP & XP</div>
                <div className="text-[.75rem] text-txt-2">50 XP per lesson, 100+ per quiz, LP for every milestone you hit.</div>
              </div>
              <div className="rounded-xl border border-coral/20 bg-coral/5 px-4 py-4">
                <div className="text-2xl mb-2">&#128737;</div>
                <div className="font-body font-bold text-[.88rem] text-coral mb-1">Protect Yourself</div>
                <div className="text-[.75rem] text-txt-2">Understand before you trade. No rug pulls, no blind moves.</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap text-[.78rem] font-mono mb-5">
              <span className="px-3 py-1.5 rounded-lg bg-sea/15 text-sea border border-sea/25 font-bold">Learn</span>
              <span className="text-muted">&#8594;</span>
              <span className="px-3 py-1.5 rounded-lg bg-sun/15 text-sun border border-sun/25">Earn LP</span>
              <span className="text-muted">&#8594;</span>
              <span className="px-3 py-1.5 rounded-lg bg-coral/15 text-coral border border-coral/25">Trade</span>
              <span className="text-muted">&#8594;</span>
              <span className="px-3 py-1.5 rounded-lg bg-[rgba(45,155,86,.15)] text-[#2D9B56] border border-[rgba(45,155,86,.25)]">Own $LIMER</span>
            </div>
            <button
              onClick={() => { setHasSeenLearnHero(true); setActiveLesson('1-1'); }}
              className="px-6 py-3 rounded-xl font-body font-bold text-[.88rem] cursor-pointer border-none bg-sea text-night transition-all hover:brightness-90"
              style={{ boxShadow: '0 0 20px rgba(0,255,163,.25)' }}>
              Start Module 1 &#8594;
            </button>
          </div>
        </div>
      )}

      {/* Skill Map */}
      <div className="mb-7">
        <SkillMap />
      </div>

      {/* Progress Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        <StatCard icon={tier.icon} label="Tier" value={tier.name} sub={`${xp} XP`} color={tier.color} />
        <StatCard icon="📚" label="Lessons" value={`${readCount}/${totalLessons}`}
          sub={`${modulesCompleted.length}/${MODULES.length} modules`} color="var(--color-sea)" />
        <StatCard icon="🏅" label="Badges" value={earnedBadges.length}
          sub="earned" color="var(--color-sun)" />
        <StatCard icon="🔥" label="Streak" value={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`}
          sub={next ? `${next.xp - xp} XP to ${next.icon}` : 'Max tier!'} color="var(--color-coral)" />
      </div>

      {/* Sidebar + Content Layout */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24">
            <LevelSidebar
              activeLevel={activeLevel}
              onLevelSwitch={handleLevelSwitch}
              levelModules={levelModules}
              levelProgress={levelProgress}
              level={level}
              lessonsRead={lessonsRead}
              quizResults={quizResults}
              modulesCompleted={modulesCompleted}
              activeLesson={activeLesson}
              setActiveLesson={setActiveLesson}
              setActiveQuiz={setActiveQuiz}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Disclaimer Bar */}
          <div className="flex justify-end mb-3">
            <DisclaimerBar />
          </div>
          {/* Mobile Level Selector */}
          <div className="lg:hidden mb-4">
            <div className="flex gap-2 mb-3">
              {LEVEL_ORDER.map(lvl => {
                const l = LEVELS[lvl];
                const isActive = lvl === activeLevel;
                return (
                  <button key={lvl} onClick={() => handleLevelSwitch(lvl)}
                    className={`flex-1 py-2.5 rounded-xl text-[.75rem] font-body font-bold cursor-pointer border transition-all
                      ${isActive ? 'border-sea/40 bg-sea/10 text-sea' : 'border-border bg-black/20 text-muted hover:text-txt'}`}>
                    {l.icon} {l.label}
                  </button>
                );
              })}
            </div>
            {/* Mobile progress bar */}
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[.7rem] text-muted font-mono">{level.label} Progress</span>
              <span className="text-[.7rem] font-bold text-sea font-mono">{levelProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-night-3 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-sea rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>

          {/* Content Tabs */}
          {!activeLesson && !activeQuiz && (
            <div className="flex gap-1 border-b border-border mb-5">
              {[
                { id: 'lessons', label: 'Lessons', count: `${levelLessonsRead}/${levelLessonIds.length}` },
                { id: 'glossary', label: 'Glossary', count: `${viewedGlossaryTerms.length}/${GLOSSARY.length}` },
                { id: 'badges', label: 'Badges', count: earnedBadges.length },
              ].map(tab => (
                <button key={tab.id} onClick={() => setContentTab(tab.id)}
                  className={`px-4 py-2.5 text-[.78rem] font-body font-bold cursor-pointer bg-transparent border-none border-b-2 transition-all
                    ${contentTab === tab.id
                      ? 'border-sea text-sea'
                      : 'border-transparent text-muted hover:text-txt'}`}>
                  {tab.label} <span className="text-[.65rem] font-mono opacity-60">({tab.count})</span>
                </button>
              ))}
            </div>
          )}

          {/* Active Lesson Detail */}
          {activeLesson && (
            <LessonDetail
              lesson={LESSONS[activeLesson]}
              isRead={!!lessonsRead[activeLesson]}
              onComplete={() => markLessonRead(activeLesson)}
              onClose={() => setActiveLesson(null)}
              onPrev={prevLessonId ? () => setActiveLesson(prevLessonId) : null}
              onNext={showTakeQuiz
                ? () => { setActiveLesson(null); setActiveQuiz(currentMod.quizId); }
                : nextLessonId ? () => setActiveLesson(nextLessonId) : null}
              prevLabel={prevLessonId ? LESSONS[prevLessonId]?.title : null}
              nextLabel={showTakeQuiz ? '🧠 Take Quiz' : nextLessonId ? LESSONS[nextLessonId]?.title : null}
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

          {/* Level Overview — module cards for current level */}
          {!activeLesson && !activeQuiz && contentTab === 'lessons' && (
            <LevelOverview
              levelModules={levelModules}
              lessonsRead={lessonsRead}
              quizResults={quizResults}
              modulesCompleted={modulesCompleted}
              setActiveLesson={setActiveLesson}
              setActiveQuiz={setActiveQuiz}
            />
          )}

          {/* Glossary Tab */}
          {!activeLesson && !activeQuiz && contentTab === 'glossary' && (
            <GlossarySection
              glossary={GLOSSARY}
              viewedTerms={viewedGlossaryTerms}
              onView={markGlossaryViewed}
            />
          )}

          {/* Badges Tab */}
          {!activeLesson && !activeQuiz && contentTab === 'badges' && <BadgeGrid />}
        </div>
      </div>
    </div>
  );
}

// ─── Level Sidebar (Desktop) ──────────────────────────────────────────────────
function LevelSidebar({ activeLevel, onLevelSwitch, levelModules, levelProgress, level, lessonsRead, quizResults, modulesCompleted, activeLesson, setActiveLesson, setActiveQuiz }) {
  return (
    <div className="rounded-xl border border-border p-4" style={{ background: 'var(--color-card)' }}>
      {/* Level pills */}
      <div className="text-[.65rem] text-muted uppercase tracking-widest mb-2 font-mono">Course Navigation</div>
      <div className="flex flex-col gap-1.5 mb-4">
        {LEVEL_ORDER.map(lvl => {
          const l = LEVELS[lvl];
          const isActive = lvl === activeLevel;
          return (
            <button key={lvl} onClick={() => onLevelSwitch(lvl)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[.78rem] font-body cursor-pointer border transition-all text-left
                ${isActive ? 'border-sea/30 bg-sea/8 text-sea font-bold' : 'border-transparent bg-transparent text-muted hover:text-txt hover:bg-white/3'}`}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>

      {/* Level progress */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[.65rem] text-muted font-mono">{level.label} Progress</span>
        <span className="text-[.65rem] font-bold text-sea font-mono">{levelProgress}%</span>
      </div>
      <div className="w-full h-1.5 bg-night-3 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-sea rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
      </div>

      {/* Lesson tree */}
      <div className="flex flex-col gap-3">
        {levelModules.map((mod, modIdx) => {
          const accessible = isModuleAccessible(mod, modIdx, levelModules, quizResults, modulesCompleted);
          return (
          <div key={mod.id} className={accessible ? '' : 'opacity-40'}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{accessible ? mod.icon : '🔒'}</span>
              <span className="text-[.7rem] font-body font-bold text-txt truncate">{mod.title}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-5">
              {mod.lessons.map(lessonId => {
                const lesson = LESSONS[lessonId];
                if (!lesson) return null;
                const isRead = !!lessonsRead[lessonId];
                const isCurrent = lessonId === activeLesson;
                return (
                  <button key={lessonId}
                    onClick={() => accessible && setActiveLesson(lessonId)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[.7rem] border-none bg-transparent text-left transition-all
                      ${!accessible ? 'text-muted/50 cursor-not-allowed' : isCurrent ? 'bg-sea/10 text-sea font-bold cursor-pointer' : isRead ? 'text-up/80 cursor-pointer' : 'text-muted hover:text-txt cursor-pointer'}`}>
                    <span className="text-[.65rem] w-3.5 shrink-0 text-center">
                      {!accessible ? '🔒' : isCurrent ? '›' : isRead ? '✓' : '○'}
                    </span>
                    <span className="truncate">{lesson.title}</span>
                  </button>
                );
              })}
              {/* Quiz row */}
              <button
                onClick={() => accessible && setActiveQuiz(mod.quizId)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[.7rem] border-none bg-transparent text-left transition-all
                  ${!accessible ? 'text-muted/50 cursor-not-allowed' : quizResults[mod.quizId]?.passed ? 'text-up/80 cursor-pointer' : 'text-coral/80 hover:text-coral cursor-pointer'}`}>
                <span className="text-[.65rem] w-3.5 shrink-0 text-center">
                  {!accessible ? '🔒' : quizResults[mod.quizId]?.passed ? '✓' : '🧠'}
                </span>
                <span className="truncate">Quiz</span>
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Level Overview ───────────────────────────────────────────────────────────
function LevelOverview({ levelModules, lessonsRead, quizResults, modulesCompleted, setActiveLesson, setActiveQuiz }) {
  return (
    <div className="flex flex-col gap-5">
      {levelModules.map((mod, modIdx) => {
        const lessonsInMod = mod.lessons.map(id => LESSONS[id]).filter(Boolean);
        const readInMod = mod.lessons.filter(id => lessonsRead[id]).length;
        const quizResult = quizResults[mod.quizId];
        const isComplete = modulesCompleted.includes(mod.id);
        const progress = (readInMod / mod.lessons.length) * 100;
        const accessible = isModuleAccessible(mod, modIdx, levelModules, quizResults, modulesCompleted);
        const prevMod = modIdx > 0 ? levelModules[modIdx - 1] : null;

        return (
          <div key={mod.id} className={`rounded-xl border p-6 transition-all relative ${isComplete ? 'border-up/30' : accessible ? 'border-border' : 'border-border opacity-60'}`}
            style={{ background: 'var(--color-card)' }}>
            {!accessible && (
              <div className="absolute inset-0 z-10 rounded-xl flex items-center justify-center backdrop-blur-[2px]"
                style={{ background: 'rgba(0,0,0,0.35)' }}>
                <div className="text-center px-6">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="text-[.8rem] font-bold text-txt">Complete {prevMod?.title || 'previous module'} first</div>
                  <div className="text-[.65rem] text-muted mt-1">Finish all lessons and pass the quiz to unlock</div>
                </div>
              </div>
            )}
            {/* Module header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">{mod.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-body font-bold text-[1rem] text-txt">{mod.title}</h3>
                  <span className={`text-[.6rem] px-2 py-0.5 rounded-full ${mod.tagCls}`}>{mod.tag}</span>
                  {isComplete && <span className="text-[.6rem] px-2 py-0.5 rounded-full bg-up/10 text-up">Complete ✓</span>}
                </div>
                <p className="text-[.75rem] text-txt-2">{mod.description}</p>
                {!isComplete && mod.unlockLabel && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[.62rem] text-sea/80 font-mono">🔓 Unlocks: {mod.unlockLabel}</span>
                  </div>
                )}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-[.65rem] text-muted">{readInMod}/{mod.lessons.length} lessons</div>
                <div className="w-24 h-1.5 bg-night-3 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-sea rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 mb-3">
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
            <div className="flex items-center gap-3 pt-3 border-t border-border flex-wrap">
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
  );
}

// ─── Glossary Section ─────────────────────────────────────────────────────────
function GlossarySection({ glossary, viewedTerms, onView }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {glossary.map(g => {
        const viewed = viewedTerms.includes(g.term);
        return (
          <div key={g.term}
            onClick={() => onView(g.term)}
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
  );
}

// ─── Lesson Detail View ──────────────────────────────────────────────────────
function LessonDetail({ lesson, isRead, onComplete, onClose, onPrev, onNext, prevLabel, nextLabel }) {
  const [canComplete, setCanComplete] = useState(isRead);

  useEffect(() => {
    if (isRead) return;
    setCanComplete(false);
    const timer = setTimeout(() => setCanComplete(true), 10000); // 10s reading time
    return () => clearTimeout(timer);
  }, [isRead, lesson?.id]);

  if (!lesson) return null;

  return (
    <div className="rounded-xl border border-border p-7 mb-5" style={{ background: 'var(--color-card)' }}>
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

      {/* Complete / Back */}
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
          ← Back to level
        </button>
      </div>

      {/* Previous / Next navigation */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border gap-3">
        <button onClick={onPrev} disabled={!onPrev}
          className="px-4 py-2 rounded-lg text-[.73rem] font-mono cursor-pointer border border-border text-muted bg-transparent hover:text-txt transition-all disabled:opacity-25 disabled:cursor-not-allowed truncate max-w-[45%]">
          ← {prevLabel || 'Previous'}
        </button>
        <button onClick={onNext} disabled={!onNext}
          className="px-4 py-2 rounded-lg text-[.73rem] font-mono cursor-pointer border border-sea/30 text-sea bg-transparent hover:bg-sea/8 transition-all disabled:opacity-25 disabled:cursor-not-allowed truncate max-w-[45%]">
          {nextLabel || 'Next'} →
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Panel ──────────────────────────────────────────────────────────────
// Answers are validated server-side via /game/quiz-submit.
function QuizPanel({ quiz, result, onSubmit, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(!!result?.passed);
  const [showResults, setShowResults] = useState(!!result?.passed);
  const [submitting, setSubmitting] = useState(false);
  const [serverResult, setServerResult] = useState(null);
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
    <div className="rounded-xl border border-border p-7 mb-5" style={{ background: 'var(--color-card)' }}>
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
        ← Back to level
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
