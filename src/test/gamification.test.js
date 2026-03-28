/**
 * Gamification Engine — Tier, XP, LP, Badge Tests
 *
 * Rust-portable structures:
 *
 *   #[derive(Clone)]
 *   pub struct Tier { pub level: u8, pub xp: u64, pub name: String }
 *
 *   pub fn get_tier(xp: u64) -> Tier
 *   pub fn get_lp_multiplier(tier_level: u8) -> f64
 *   pub fn check_badge(badge_id: &str, state: &UserState) -> bool
 */
import { describe, it, expect } from 'vitest';
import { TIERS, getTier, getNextTier, XP_VALUES } from '../data/gamification';
import { LP_MULTIPLIERS, getLPMultiplier } from '../data/lp';
import { BADGES } from '../data/badges';

// ── Tier System ──────────────────────────────────────────────

describe('Tier System', () => {
  it('TIERS has exactly 10 levels', () => {
    expect(TIERS).toHaveLength(10);
  });

  it('tiers are sorted ascending by XP', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].xp).toBeGreaterThan(TIERS[i - 1].xp);
    }
  });

  it('tier levels are sequential 1-10', () => {
    TIERS.forEach((t, i) => expect(t.level).toBe(i + 1));
  });

  it('getTier returns correct tier for exact thresholds', () => {
    expect(getTier(0).level).toBe(1);
    expect(getTier(200).level).toBe(2);
    expect(getTier(500).level).toBe(3);
    expect(getTier(1000).level).toBe(4);
    expect(getTier(15000).level).toBe(10);
  });

  it('getTier returns correct tier for in-between values', () => {
    expect(getTier(150).level).toBe(1);  // below 200
    expect(getTier(350).level).toBe(2);  // between 200-500
    expect(getTier(999).level).toBe(3);  // just below 1000
    expect(getTier(1001).level).toBe(4); // just above 1000
  });

  it('getTier returns max tier for very high XP', () => {
    expect(getTier(999999).level).toBe(10);
  });

  it('getNextTier returns next tier or null at max', () => {
    expect(getNextTier(0).level).toBe(2);       // at tier 1, next is 2
    expect(getNextTier(150).level).toBe(2);      // still tier 1
    expect(getNextTier(200).level).toBe(3);      // at tier 2, next is 3
    expect(getNextTier(15000)).toBeNull();        // max tier
    expect(getNextTier(999999)).toBeNull();       // way past max
  });

  it('every tier has required fields', () => {
    TIERS.forEach(t => {
      expect(t).toHaveProperty('level');
      expect(t).toHaveProperty('xp');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('color');
      expect(t).toHaveProperty('icon');
      expect(typeof t.name).toBe('string');
      expect(t.name.length).toBeGreaterThan(0);
    });
  });
});

// ── XP Values ────────────────────────────────────────────────

describe('XP Values', () => {
  it('all XP values are positive integers', () => {
    Object.entries(XP_VALUES).forEach(([key, val]) => {
      expect(val).toBeGreaterThan(0);
      expect(Number.isInteger(val)).toBe(true);
    });
  });

  it('quiz perfect > quiz pass > lesson read', () => {
    expect(XP_VALUES.quizPerfect).toBeGreaterThan(XP_VALUES.quizPass);
    expect(XP_VALUES.quizPass).toBeGreaterThan(XP_VALUES.lessonRead);
  });

  it('module complete is highest single-action XP', () => {
    const singleActions = ['lessonRead', 'quizPass', 'quizPerfect', 'moduleComplete', 'firstTrade', 'dailyStreak'];
    const moduleXP = XP_VALUES.moduleComplete;
    singleActions.filter(a => a !== 'moduleComplete').forEach(a => {
      expect(moduleXP).toBeGreaterThanOrEqual(XP_VALUES[a]);
    });
  });

  it('LP academy XP > base XP for same action type', () => {
    expect(XP_VALUES.lpLessonRead).toBeGreaterThan(XP_VALUES.lessonRead);
    expect(XP_VALUES.lpQuizPass).toBeGreaterThan(XP_VALUES.quizPass);
    expect(XP_VALUES.lpQuizPerfect).toBeGreaterThan(XP_VALUES.quizPerfect);
    expect(XP_VALUES.lpModuleComplete).toBeGreaterThan(XP_VALUES.moduleComplete);
  });

  it('required keys exist for core actions', () => {
    const required = ['lessonRead', 'quizPass', 'quizPerfect', 'moduleComplete',
      'firstTrade', 'tenTrades', 'fiftyTrades', 'dailyStreak', 'glossaryTerm',
      'ttseTrade', 'firstLimitOrder', 'priceAlertTriggered'];
    required.forEach(key => {
      expect(XP_VALUES).toHaveProperty(key);
    });
  });
});

// ── LP Multipliers ───────────────────────────────────────────

describe('LP Multipliers', () => {
  it('every tier level (1-10) has a multiplier', () => {
    for (let i = 1; i <= 10; i++) {
      expect(LP_MULTIPLIERS[i]).toBeDefined();
      expect(LP_MULTIPLIERS[i]).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('multipliers increase with tier level', () => {
    for (let i = 2; i <= 10; i++) {
      expect(LP_MULTIPLIERS[i]).toBeGreaterThan(LP_MULTIPLIERS[i - 1]);
    }
  });

  it('tier 1 multiplier is exactly 1.0 (no boost)', () => {
    expect(LP_MULTIPLIERS[1]).toBe(1.0);
  });

  it('tier 10 multiplier is 5.0x (max boost)', () => {
    expect(LP_MULTIPLIERS[10]).toBe(5.0);
  });

  it('getLPMultiplier returns 1.0 for invalid tier', () => {
    expect(getLPMultiplier(0)).toBe(1.0);
    expect(getLPMultiplier(11)).toBe(1.0);
    expect(getLPMultiplier(undefined)).toBe(1.0);
  });

  it('getLPMultiplier matches direct lookup', () => {
    for (let i = 1; i <= 10; i++) {
      expect(getLPMultiplier(i)).toBe(LP_MULTIPLIERS[i]);
    }
  });
});

// ── Badge System ─────────────────────────────────────────────

describe('Badge System', () => {
  it('all badges have required fields', () => {
    BADGES.forEach(b => {
      expect(b).toHaveProperty('id');
      expect(b).toHaveProperty('title');
      expect(b).toHaveProperty('desc');
      expect(b).toHaveProperty('icon');
      expect(b).toHaveProperty('cat');
      expect(b).toHaveProperty('check');
      expect(typeof b.check).toBe('function');
    });
  });

  it('badge IDs are unique', () => {
    const ids = BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('badge count fits in u32 bitmap (max 32)', () => {
    expect(BADGES.length).toBeLessThanOrEqual(32);
  });

  it('categories are valid', () => {
    const validCats = ['milestone', 'skill', 'special', 'lp'];
    BADGES.forEach(b => {
      expect(validCats).toContain(b.cat);
    });
  });

  it('first_lesson badge checks lessonsRead count', () => {
    const badge = BADGES.find(b => b.id === 'first_lesson');
    expect(badge.check({ lessonsRead: {} })).toBe(false);
    expect(badge.check({ lessonsRead: { '1-1': true } })).toBe(true);
  });

  it('ten_trades badge checks trade count', () => {
    const badge = BADGES.find(b => b.id === 'ten_trades');
    expect(badge.check({ trades: new Array(9) })).toBe(false);
    expect(badge.check({ trades: new Array(10) })).toBe(true);
  });

  it('perfect_quiz badge checks quiz results', () => {
    const badge = BADGES.find(b => b.id === 'perfect_quiz');
    expect(badge.check({ quizResults: {} })).toBe(false);
    expect(badge.check({ quizResults: { 'quiz-1': { perfect: true } } })).toBe(true);
    expect(badge.check({ quizResults: { 'quiz-1': { perfect: false } } })).toBe(false);
  });

  it('streak_7 badge checks longest streak', () => {
    const badge = BADGES.find(b => b.id === 'streak_7');
    expect(badge.check({ longestStreak: 6 })).toBe(false);
    expect(badge.check({ longestStreak: 7 })).toBe(true);
  });

  it('lp_100 badge checks limer points', () => {
    const badge = BADGES.find(b => b.id === 'lp_100');
    expect(badge.check({ limerPoints: 99 })).toBe(false);
    expect(badge.check({ limerPoints: 100 })).toBe(true);
  });

  it('yield_farmer requires all 3 LP modules', () => {
    const badge = BADGES.find(b => b.id === 'yield_farmer');
    expect(badge.check({ modulesCompleted: ['module-5', 'module-6'] })).toBe(false);
    expect(badge.check({ modulesCompleted: ['module-5', 'module-6', 'module-7'] })).toBe(true);
  });
});
