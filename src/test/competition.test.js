/**
 * Trading Competition — Scoring Engine & Leaderboard Tests
 *
 * Validates the competition scoring math and leaderboard generation.
 * These functions are Rust-portable:
 *
 *   pub fn calc_competition_score(pnl: f64, win_rate: f64, max_dd: f64, daily_returns: &[f64], trades: u32) -> u64
 *   pub fn get_competition_status(now: i64, start: i64, end: i64) -> Status
 */
import { describe, it, expect } from 'vitest';
import {
  COMPETITION,
  PRIZES,
  calcCompetitionScore,
  getCompetitionStatus,
  generateCompetitionLeaderboard,
} from '../data/competition';

// ── Competition Config ─────────────────────────────────────

describe('Competition Config', () => {
  it('has required fields', () => {
    expect(COMPETITION.id).toBe('season-1');
    expect(COMPETITION.name).toBeDefined();
    expect(COMPETITION.startDate).toBeDefined();
    expect(COMPETITION.endDate).toBeDefined();
    expect(COMPETITION.initialBalance).toBe(100_000);
  });

  it('start date is before end date', () => {
    const start = new Date(COMPETITION.startDate);
    const end = new Date(COMPETITION.endDate);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it('season is ~4 weeks', () => {
    const start = new Date(COMPETITION.startDate);
    const end = new Date(COMPETITION.endDate);
    const days = (end - start) / 86400000;
    expect(days).toBeGreaterThanOrEqual(25);
    expect(days).toBeLessThanOrEqual(35);
  });

  it('has 5+ rules', () => {
    expect(COMPETITION.rules.length).toBeGreaterThanOrEqual(5);
  });
});

// ── Prizes ────────────────────────────────────────────────

describe('Competition Prizes', () => {
  it('has 6 prize tiers', () => {
    expect(PRIZES).toHaveLength(6);
  });

  it('every prize has rank, prize, icon, color', () => {
    PRIZES.forEach(p => {
      expect(p).toHaveProperty('rank');
      expect(p).toHaveProperty('prize');
      expect(p).toHaveProperty('icon');
      expect(p).toHaveProperty('color');
    });
  });

  it('top 3 include dNFT', () => {
    PRIZES.slice(0, 3).forEach(p => {
      expect(p.prize.toLowerCase()).toContain('dnft');
    });
  });

  it('all finishers get LP multiplier', () => {
    const allFinishers = PRIZES.find(p => p.rank === 'All Finishers');
    expect(allFinishers).toBeDefined();
    expect(allFinishers.prize.toLowerCase()).toContain('lp multiplier');
  });
});

// ── Scoring Function ──────────────────────────────────────

describe('calcCompetitionScore', () => {
  it('returns baseline score for zero performance (risk mgmt still scores)', () => {
    const score = calcCompetitionScore(0, 0, 0, [], 0);
    // 0% drawdown = perfect risk management (20 pts), everything else is 0
    expect(score).toBe(20);
  });

  it('max score is 100', () => {
    const score = calcCompetitionScore(200, 1.0, 0, [5, 5, 5, 5, 5], 100);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('negative PnL yields lower score', () => {
    const positive = calcCompetitionScore(20, 0.65, 10, [1, 1, 1], 15);
    const negative = calcCompetitionScore(-20, 0.65, 10, [1, 1, 1], 15);
    expect(positive).toBeGreaterThan(negative);
  });

  it('higher win rate yields higher score', () => {
    const low = calcCompetitionScore(10, 0.40, 10, [], 10);
    const high = calcCompetitionScore(10, 0.75, 10, [], 10);
    expect(high).toBeGreaterThan(low);
  });

  it('lower drawdown yields higher score', () => {
    const tight = calcCompetitionScore(10, 0.60, 5, [], 10);
    const loose = calcCompetitionScore(10, 0.60, 30, [], 10);
    expect(tight).toBeGreaterThan(loose);
  });

  it('more trades yields higher activity score (up to cap)', () => {
    const few = calcCompetitionScore(10, 0.60, 10, [], 3);
    const many = calcCompetitionScore(10, 0.60, 10, [], 15);
    expect(many).toBeGreaterThan(few);
  });

  it('10+ trades gives full activity score', () => {
    const ten = calcCompetitionScore(10, 0.60, 10, [], 10);
    const hundred = calcCompetitionScore(10, 0.60, 10, [], 100);
    expect(ten).toBe(hundred); // Activity score is capped at 10 trades
  });

  it('consistency (Sharpe) component adds points with good daily returns', () => {
    const noReturns = calcCompetitionScore(10, 0.60, 10, [], 10);
    const steady = calcCompetitionScore(10, 0.60, 10, [2, 1.5, 2.5, 1, 2], 10);
    expect(steady).toBeGreaterThan(noReturns);
  });

  it('volatile daily returns reduce consistency score vs steady', () => {
    const steady = calcCompetitionScore(10, 0.60, 10, [2, 2, 2, 2, 2], 10);
    const volatile = calcCompetitionScore(10, 0.60, 10, [10, -5, 15, -8, 3], 10);
    expect(steady).toBeGreaterThanOrEqual(volatile);
  });

  it('PnL capped at 100% for scoring', () => {
    const at100 = calcCompetitionScore(100, 0.60, 10, [], 10);
    const at200 = calcCompetitionScore(200, 0.60, 10, [], 10);
    expect(at100).toBe(at200); // Both get max 40 PnL points
  });

  it('negative PnL contributes 0 PnL points (not negative)', () => {
    const score = calcCompetitionScore(-30, 0.60, 10, [], 10);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('returns integer', () => {
    const score = calcCompetitionScore(15.5, 0.653, 8.2, [1.1, 2.3], 7);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ── Competition Status ────────────────────────────────────

describe('getCompetitionStatus', () => {
  const start = new Date(COMPETITION.startDate);
  const end = new Date(COMPETITION.endDate);

  it('returns upcoming before start', () => {
    const before = new Date(start.getTime() - 86400000); // 1 day before
    const status = getCompetitionStatus(before);
    expect(status.status).toBe('upcoming');
    expect(status.daysLeft).toBeGreaterThan(0);
  });

  it('returns live during competition', () => {
    const mid = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
    const status = getCompetitionStatus(mid);
    expect(status.status).toBe('live');
    expect(status.progress).toBeGreaterThan(0);
    expect(status.progress).toBeLessThan(1);
  });

  it('returns ended after end date', () => {
    const after = new Date(end.getTime() + 86400000);
    const status = getCompetitionStatus(after);
    expect(status.status).toBe('ended');
    expect(status.daysLeft).toBe(0);
  });

  it('progress increases over time', () => {
    const early = new Date(start.getTime() + 86400000); // day 1
    const late = new Date(end.getTime() - 86400000); // last day
    const statusEarly = getCompetitionStatus(early);
    const statusLate = getCompetitionStatus(late);
    expect(statusLate.progress).toBeGreaterThan(statusEarly.progress);
  });
});

// ── Leaderboard Generation ────────────────────────────────

describe('generateCompetitionLeaderboard', () => {
  const userStats = {
    pnlPct: 15.0,
    trades: 20,
    wins: 13,
    maxDrawdown: 8.0,
    dailyReturns: [1, 1.5, 2, 0.5, 1, 1.2, 0.8],
  };

  it('includes user entry', () => {
    const lb = generateCompetitionLeaderboard(userStats);
    const user = lb.find(e => e.isUser);
    expect(user).toBeDefined();
    expect(user.name).toBe('You');
  });

  it('has 21 entries (20 competitors + user)', () => {
    const lb = generateCompetitionLeaderboard(userStats);
    expect(lb).toHaveLength(21);
  });

  it('entries are sorted by score descending', () => {
    const lb = generateCompetitionLeaderboard(userStats);
    for (let i = 1; i < lb.length; i++) {
      expect(lb[i - 1].score).toBeGreaterThanOrEqual(lb[i].score);
    }
  });

  it('every entry has a rank', () => {
    const lb = generateCompetitionLeaderboard(userStats);
    lb.forEach((e, i) => {
      expect(e.rank).toBe(i + 1);
    });
  });

  it('every entry has required fields', () => {
    const lb = generateCompetitionLeaderboard(userStats);
    lb.forEach(e => {
      expect(e).toHaveProperty('name');
      expect(e).toHaveProperty('pnlPct');
      expect(e).toHaveProperty('trades');
      expect(e).toHaveProperty('winRate');
      expect(e).toHaveProperty('score');
      expect(e).toHaveProperty('rank');
      expect(e).toHaveProperty('style');
    });
  });

  it('user rank changes with better stats', () => {
    const weak = generateCompetitionLeaderboard({ pnlPct: -10, trades: 2, wins: 0, maxDrawdown: 20, dailyReturns: [] });
    const strong = generateCompetitionLeaderboard({ pnlPct: 30, trades: 50, wins: 35, maxDrawdown: 3, dailyReturns: [2, 2, 2, 2, 2] });
    const weakRank = weak.find(e => e.isUser).rank;
    const strongRank = strong.find(e => e.isUser).rank;
    expect(strongRank).toBeLessThan(weakRank); // Better rank = lower number
  });
});
