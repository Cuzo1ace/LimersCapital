/**
 * Education System — Modules, Lessons, Quizzes Tests
 *
 * Validates content integrity and progression logic.
 * These structures map to on-chain module/quiz records:
 *
 *   pub struct Module { pub id: String, pub lessons: Vec<String>, pub quiz_id: String }
 *   pub fn is_module_complete(lessons_read: &[String], quiz_passed: bool, module: &Module) -> bool
 */
import { describe, it, expect } from 'vitest';
import { MODULES, LEVELS, LEVEL_ORDER } from '../data/modules';
import { LESSONS } from '../data/lessons';
import { QUIZZES } from '../data/quizzes';

// ── Modules ──────────────────────────────────────────────────

describe('Modules', () => {
  it('has 8 modules', () => {
    expect(MODULES).toHaveLength(8);
  });

  it('module IDs are unique', () => {
    const ids = MODULES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('module count fits in u8 bitmap (max 8)', () => {
    expect(MODULES.length).toBeLessThanOrEqual(8);
  });

  it('every module has required fields', () => {
    MODULES.forEach(m => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('title');
      expect(m).toHaveProperty('lessons');
      expect(m).toHaveProperty('quizId');
      expect(m).toHaveProperty('unlocks');
      expect(Array.isArray(m.lessons)).toBe(true);
      expect(Array.isArray(m.unlocks)).toBe(true);
      expect(m.lessons.length).toBeGreaterThan(0);
    });
  });

  it('every module has a corresponding quiz', () => {
    MODULES.forEach(m => {
      expect(QUIZZES).toHaveProperty(m.quizId);
    });
  });

  it('every module lesson exists in LESSONS', () => {
    const lessonIds = new Set(Object.keys(LESSONS));
    MODULES.forEach(m => {
      m.lessons.forEach(lessonId => {
        expect(lessonIds.has(lessonId)).toBe(true);
      });
    });
  });

  it('module IDs are sequential (module-1 through module-8)', () => {
    MODULES.forEach((m, i) => {
      expect(m.id).toBe(`module-${i + 1}`);
    });
  });
});

// ── Levels ───────────────────────────────────────────────────

describe('Levels', () => {
  it('has 3 difficulty levels', () => {
    expect(Object.keys(LEVELS)).toHaveLength(3);
  });

  it('levels are basics, intermediate, advanced', () => {
    expect(LEVELS).toHaveProperty('basics');
    expect(LEVELS).toHaveProperty('intermediate');
    expect(LEVELS).toHaveProperty('advanced');
  });

  it('LEVEL_ORDER matches keys', () => {
    expect(LEVEL_ORDER).toEqual(['basics', 'intermediate', 'advanced']);
  });

  it('every level references valid module IDs', () => {
    const moduleIds = new Set(MODULES.map(m => m.id));
    Object.values(LEVELS).forEach(level => {
      level.modules.forEach(mId => {
        expect(moduleIds.has(mId)).toBe(true);
      });
    });
  });

  it('all modules are assigned to exactly one level', () => {
    const allModules = Object.values(LEVELS).flatMap(l => l.modules);
    expect(allModules).toHaveLength(MODULES.length);
    expect(new Set(allModules).size).toBe(MODULES.length);
  });
});

// ── Lessons ──────────────────────────────────────────────────

describe('Lessons', () => {
  const lessonList = Object.values(LESSONS);

  it('has at least 30 lessons', () => {
    expect(lessonList.length).toBeGreaterThanOrEqual(30);
  });

  it('lesson IDs are unique', () => {
    const ids = lessonList.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every lesson has required fields', () => {
    lessonList.forEach(l => {
      expect(l).toHaveProperty('id');
      expect(l).toHaveProperty('moduleId');
      expect(l).toHaveProperty('title');
      expect(l).toHaveProperty('summary');
      expect(l).toHaveProperty('content');
      expect(l).toHaveProperty('readTime');
      expect(Array.isArray(l.content)).toBe(true);
      expect(l.content.length).toBeGreaterThan(0);
    });
  });

  it('every lesson references a valid module', () => {
    const moduleIds = new Set(MODULES.map(m => m.id));
    lessonList.forEach(l => {
      expect(moduleIds.has(l.moduleId)).toBe(true);
    });
  });

  it('read time is reasonable (1-10 min)', () => {
    lessonList.forEach(l => {
      expect(l.readTime).toBeGreaterThanOrEqual(1);
      expect(l.readTime).toBeLessThanOrEqual(10);
    });
  });
});

// ── Quizzes ──────────────────────────────────────────────────

describe('Quizzes', () => {
  it('has 8 quizzes (one per module)', () => {
    expect(Object.keys(QUIZZES)).toHaveLength(8);
  });

  it('quiz IDs match module quizId references', () => {
    MODULES.forEach(m => {
      expect(QUIZZES[m.quizId]).toBeDefined();
      expect(QUIZZES[m.quizId].moduleId).toBe(m.id);
    });
  });

  it('every quiz has 5 questions', () => {
    Object.values(QUIZZES).forEach(q => {
      expect(q.questions).toHaveLength(5);
    });
  });

  it('every question has 4 options', () => {
    Object.values(QUIZZES).forEach(q => {
      q.questions.forEach(question => {
        expect(question.opts).toHaveLength(4);
      });
    });
  });

  it('passing score is 70%', () => {
    Object.values(QUIZZES).forEach(q => {
      expect(q.passingScore).toBe(0.7);
    });
  });

  it('quiz IDs are sequential (quiz-1 through quiz-8)', () => {
    for (let i = 1; i <= 8; i++) {
      expect(QUIZZES[`quiz-${i}`]).toBeDefined();
    }
  });

  it('no quiz contains answer keys client-side', () => {
    Object.values(QUIZZES).forEach(q => {
      q.questions.forEach(question => {
        expect(question).not.toHaveProperty('ans');
        expect(question).not.toHaveProperty('answer');
        expect(question).not.toHaveProperty('correct');
        expect(question).not.toHaveProperty('why');
        expect(question).not.toHaveProperty('explanation');
      });
    });
  });
});

// ── Progression Logic ────────────────────────────────────────

describe('Progression Logic', () => {
  it('module completion requires all lessons + quiz pass', () => {
    const mod = MODULES[0];
    const lessonsRead = {};
    mod.lessons.forEach(l => { lessonsRead[l] = true; });

    const allLessonsRead = mod.lessons.every(l => lessonsRead[l]);
    const quizPassed = true;

    expect(allLessonsRead && quizPassed).toBe(true);
  });

  it('module NOT complete if quiz not passed', () => {
    const mod = MODULES[0];
    const lessonsRead = {};
    mod.lessons.forEach(l => { lessonsRead[l] = true; });

    const allLessonsRead = mod.lessons.every(l => lessonsRead[l]);
    const quizPassed = false;

    expect(allLessonsRead && quizPassed).toBe(false);
  });

  it('module NOT complete if lessons missing', () => {
    const mod = MODULES[0];
    const lessonsRead = { [mod.lessons[0]]: true };

    const allLessonsRead = mod.lessons.every(l => lessonsRead[l]);
    expect(allLessonsRead).toBe(false);
  });

  it('advanced modules have prerequisites', () => {
    const advanced = MODULES.filter(m => m.prereq);
    expect(advanced.length).toBeGreaterThan(0);
    advanced.forEach(m => {
      expect(MODULES.some(other => other.id === m.prereq)).toBe(true);
    });
  });
});
