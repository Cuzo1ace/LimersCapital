import { useState } from 'react';
import useStore from '../store/useStore';
import { MODULES } from '../data/modules';
import { LESSONS } from '../data/lessons';
import { getCurriculumMeta } from '../data/curriculum';

/**
 * CurriculumMode — Stripped-down educational view for classroom use.
 *
 * Shows only: modules, lessons (with learning objectives + rubrics),
 * quizzes, glossary, and progress tracking.
 *
 * Hides: trading UI, wallet connection, portfolio, perpetuals,
 * Jupiter swap, competitions, referral prompts, gamification sidebar.
 */
export default function CurriculumMode({ onExit }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const lessonsRead = useStore(s => s.lessonsRead);
  const markLessonRead = useStore(s => s.markLessonRead);
  const modulesCompleted = useStore(s => s.modulesCompleted);

  // Module list view
  if (!selectedModule) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: 'rgba(0,200,180,0.15)', color: '#00C8B4' }}>
              Curriculum Mode
            </div>
            <h1 className="text-2xl font-bold text-white">Financial Literacy Curriculum</h1>
            <p className="text-white/60 text-sm mt-1">8 modules covering blockchain, Caribbean markets, DeFi, and ownership economics</p>
          </div>
          {onExit && (
            <button onClick={onExit} className="text-sm text-white/50 hover:text-white/80 transition-colors">
              Exit Curriculum Mode
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {MODULES.map((mod, i) => {
            const isComplete = modulesCompleted.includes(mod.id);
            const lessonsInModule = mod.lessons || [];
            const readCount = lessonsInModule.filter(l => lessonsRead[l]).length;

            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="text-left p-5 rounded-xl border transition-all hover:scale-[1.01]"
                style={{
                  background: isComplete ? 'rgba(0,200,180,0.08)' : 'rgba(255,255,255,0.03)',
                  borderColor: isComplete ? 'rgba(0,200,180,0.3)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mod.emoji || '📚'}</span>
                    <div>
                      <h3 className="font-semibold text-white">{mod.title}</h3>
                      <p className="text-white/50 text-xs mt-0.5">
                        {readCount}/{lessonsInModule.length} lessons read
                        {isComplete && ' — Complete'}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/30 text-sm">Module {i + 1}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Lesson detail view
  if (selectedLesson) {
    const lesson = LESSONS[selectedLesson];
    const curriculum = getCurriculumMeta(selectedLesson);
    const isRead = lessonsRead[selectedLesson];

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedLesson(null)}
          className="text-sm text-white/50 hover:text-white/80 mb-6 transition-colors"
        >
          &larr; Back to {selectedModule.title}
        </button>

        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: 'rgba(0,200,180,0.15)', color: '#00C8B4' }}>
          Curriculum Mode
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          <span className="mr-2">{lesson.emoji}</span>
          {lesson.title}
        </h1>
        <p className="text-white/50 text-sm mb-6">{lesson.readTime} min read</p>

        {/* Learning Objectives */}
        {curriculum && (
          <div className="mb-6 p-4 rounded-xl border" style={{ background: 'rgba(0,200,180,0.05)', borderColor: 'rgba(0,200,180,0.15)' }}>
            <h3 className="text-sm font-bold text-[#00C8B4] mb-2">Learning Objectives</h3>
            <ul className="space-y-1.5">
              {curriculum.learningObjectives.map((obj, i) => (
                <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                  <span className="text-[#00C8B4] mt-0.5 text-xs">&#9679;</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lesson Content */}
        <div className="space-y-4 mb-6">
          {lesson.content.map((paragraph, i) => (
            <p key={i} className="text-white/80 text-sm leading-relaxed">{paragraph}</p>
          ))}
        </div>

        {/* Assessment Rubric */}
        {curriculum && (
          <div className="mb-6 p-4 rounded-xl border" style={{ background: 'rgba(255,202,58,0.05)', borderColor: 'rgba(255,202,58,0.15)' }}>
            <h3 className="text-sm font-bold text-[#FFCA3A] mb-2">Assessment Rubric</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-green-400 font-medium">Excellent:</span> <span className="text-white/70">{curriculum.assessmentRubric.excellent}</span></div>
              <div><span className="text-yellow-400 font-medium">Proficient:</span> <span className="text-white/70">{curriculum.assessmentRubric.proficient}</span></div>
              <div><span className="text-orange-400 font-medium">Developing:</span> <span className="text-white/70">{curriculum.assessmentRubric.developing}</span></div>
            </div>
          </div>
        )}

        {/* Mark as Read */}
        {!isRead && (
          <button
            onClick={() => markLessonRead(selectedLesson)}
            className="w-full py-3 rounded-xl font-medium text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #00C8B4, #2D9B56)', color: '#fff' }}
          >
            Mark as Complete
          </button>
        )}
        {isRead && (
          <div className="text-center text-sm text-[#00C8B4] font-medium py-3">
            Lesson completed
          </div>
        )}
      </div>
    );
  }

  // Module lesson list view
  const lessonsInModule = (selectedModule.lessons || []).map(id => ({ id, ...LESSONS[id] })).filter(l => l.title);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => setSelectedModule(null)}
        className="text-sm text-white/50 hover:text-white/80 mb-6 transition-colors"
      >
        &larr; Back to all modules
      </button>

      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: 'rgba(0,200,180,0.15)', color: '#00C8B4' }}>
        Curriculum Mode
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        <span className="mr-2">{selectedModule.emoji || '📚'}</span>
        {selectedModule.title}
      </h1>
      <p className="text-white/50 text-sm mb-6">{selectedModule.desc}</p>

      <div className="space-y-3">
        {lessonsInModule.map(lesson => {
          const isRead = lessonsRead[lesson.id];
          return (
            <button
              key={lesson.id}
              onClick={() => setSelectedLesson(lesson.id)}
              className="w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.005]"
              style={{
                background: isRead ? 'rgba(0,200,180,0.05)' : 'rgba(255,255,255,0.03)',
                borderColor: isRead ? 'rgba(0,200,180,0.2)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lesson.emoji}</span>
                  <div>
                    <h3 className="font-medium text-white text-sm">{lesson.title}</h3>
                    <p className="text-white/40 text-xs mt-0.5">{lesson.readTime} min read</p>
                  </div>
                </div>
                {isRead && <span className="text-[#00C8B4] text-xs font-medium">Done</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
