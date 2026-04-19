/**
 * Curriculum data shapes consumed by @limers/curriculum. These are JSDoc
 * contracts so consuming apps can type-check without us forcing TypeScript.
 *
 * @typedef {Object} Level
 * @property {string} id            — e.g. "basics"
 * @property {string} label         — human-readable, e.g. "Basics"
 * @property {string} icon          — an emoji or single character glyph
 * @property {string} color         — a CSS color/custom-property reference
 * @property {string[]} modules     — module ids that belong to this level
 * @property {string} description
 *
 * @typedef {Object} Module
 * @property {string} id            — stable unique id, e.g. "module-1"
 * @property {string} title
 * @property {string} description
 * @property {string} icon
 * @property {string} tag           — short label describing the module
 * @property {string} [tagCls]      — optional Tailwind classes for the tag chip
 * @property {string[]} lessons     — lesson ids in this module
 * @property {string} quizId
 * @property {string[]} [unlocks]   — feature keys unlocked on completion
 * @property {string} [unlockLabel] — display string for the unlock reward
 *
 * @typedef {Object} Lesson
 * @property {string} id            — e.g. "1-1"
 * @property {string} moduleId
 * @property {string} title
 * @property {string[]} content     — an array of markdown-friendly paragraphs
 * @property {number} readTime      — estimated minutes to read
 *
 * @typedef {Object} QuizQuestion
 * @property {string} q             — question text
 * @property {string[]} a           — answer options
 * @property {number} correct       — index of the correct answer in `a`
 * @property {string} [explain]     — optional post-answer explanation
 *
 * @typedef {Object} Quiz
 * @property {string} id            — e.g. "quiz-1"
 * @property {string} moduleId
 * @property {string} title
 * @property {QuizQuestion[]} questions
 * @property {number} [passScore]   — defaults to 0.7 (70%)
 *
 * @typedef {Object} Curriculum
 * @property {Record<string, Level>} levels
 * @property {Module[]} modules
 * @property {Lesson[]} lessons
 * @property {Quiz[]} quizzes
 */

export const CURRICULUM_SCHEMA_VERSION = '0.1.0';
