/**
 * Gamification data shapes. JSDoc-only so consumers can type-check without
 * being forced onto TypeScript.
 *
 * Badge state contract — the default `check(state)` functions bundled in
 * `@limers/gamification/badges` expect the consuming app to hand them a
 * `StateSnapshot` matching this shape. Extra fields are ignored.
 *
 * @typedef {Object} Tier
 * @property {number} level        — 1..N, higher is better
 * @property {number} xp           — XP threshold to reach this tier
 * @property {string} name         — human-readable label
 * @property {string} color        — hex or CSS custom property
 * @property {string} icon         — emoji / single-char glyph
 *
 * @typedef {Object} Badge
 * @property {string} id
 * @property {string} title
 * @property {string} desc
 * @property {string} icon
 * @property {'milestone' | 'skill' | 'special' | 'lp'} cat
 * @property {(state: StateSnapshot) => boolean} check
 *
 * @typedef {Object} LPAction
 * @property {string} action
 * @property {number | string} lp
 * @property {boolean} multiplied
 * @property {string} icon
 * @property {string} [note]
 *
 * @typedef {Object} LeaderboardEntry
 * @property {string} name
 * @property {number} lp
 * @property {boolean} isUser
 * @property {number} rank
 *
 * @typedef {Object} StateSnapshot
 * @property {Record<string, true>} [lessonsRead]
 * @property {Record<string, { perfect?: boolean, passed?: boolean }>} [quizResults]
 * @property {Array<{ side: string, market: string, total: number }>} [trades]
 * @property {Array<{ market: string }>} [holdings]
 * @property {string[]} [viewedGlossaryTerms]
 * @property {number} [longestStreak]
 * @property {number} [quizStreak]
 * @property {number} [limerPoints]
 * @property {Array<unknown>} [lpReferrals]
 * @property {Array<unknown>} [lpSimPositions]
 * @property {string[]} [modulesCompleted]
 * @property {boolean} [visitedLPArmy]
 * @property {boolean} [viewedFlywheel]
 * @property {number} [agentSqueezeUses]
 * @property {string[]} [teachingMomentsViewed]
 * @property {string[]} [viewedDailyKnowledge]
 * @property {Record<string, unknown>} [tradeJournal]
 * @property {string[]} [viewedMicroLessons]
 * @property {string[]} [completedPracticeChallenges]
 * @property {number} [perpTradeCount]
 */

export const GAMIFICATION_SCHEMA_VERSION = '0.1.0';
