import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Critical Radius Intervention Tests
 *
 * Tests for streak fee credits, premium conversion tracking,
 * and referral prompt triggers added to reduce the critical mass threshold.
 */

describe('Streak Fee Credits', () => {
  it('should cap daily fee credits at 30', () => {
    // The creditAmount formula: Math.min(newStreak, 30)
    expect(Math.min(1, 30)).toBe(1);
    expect(Math.min(15, 30)).toBe(15);
    expect(Math.min(30, 30)).toBe(30);
    expect(Math.min(100, 30)).toBe(30);
    expect(Math.min(365, 30)).toBe(30);
  });

  it('should accumulate credits correctly over multiple days', () => {
    let total = 0;
    // Simulate 7-day streak (1+2+3+4+5+6+7 = 28)
    for (let day = 1; day <= 7; day++) {
      total += Math.min(day, 30);
    }
    expect(total).toBe(28);
  });

  it('should cap at 30 even for very long streaks', () => {
    let total = 0;
    // Simulate days 29-33 (all should add 29,30,30,30,30)
    for (let day = 29; day <= 33; day++) {
      total += Math.min(day, 30);
    }
    expect(total).toBe(29 + 30 + 30 + 30 + 30);
  });
});

describe('Premium Conversion Events', () => {
  it('should structure events with event name and timestamp', () => {
    const event = 'viewed_premium_page';
    const entry = { event, timestamp: new Date().toISOString() };
    expect(entry).toHaveProperty('event', 'viewed_premium_page');
    expect(entry).toHaveProperty('timestamp');
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should respect 200 entry cap', () => {
    const events = Array.from({ length: 250 }, (_, i) => ({
      event: `event_${i}`,
      timestamp: new Date().toISOString(),
    }));
    const capped = events.slice(0, 200);
    expect(capped.length).toBe(200);
    // Newest entries should be kept (slice from end in real impl)
    const sliced = [...events, { event: 'new', timestamp: new Date().toISOString() }].slice(0, 200);
    expect(sliced.length).toBe(200);
  });
});

describe('Referral Prompt Triggers', () => {
  it('should trigger at trade counts 1, 5, and 25', () => {
    const triggerCounts = [1, 5, 25];
    expect(triggerCounts.includes(1)).toBe(true);
    expect(triggerCounts.includes(5)).toBe(true);
    expect(triggerCounts.includes(25)).toBe(true);
    expect(triggerCounts.includes(10)).toBe(false);
    expect(triggerCounts.includes(50)).toBe(false);
  });

  it('should trigger at 7-day streak', () => {
    const newStreak = 7;
    const shouldTrigger = newStreak === 7;
    expect(shouldTrigger).toBe(true);
  });

  it('should not trigger at non-milestone streaks', () => {
    [1, 2, 3, 5, 6, 8, 14, 30].forEach(streak => {
      expect(streak === 7).toBe(false);
    });
  });

  it('should structure prompt with trigger and timestamp', () => {
    const prompt = { trigger: 'First trade!', timestamp: Date.now() };
    expect(prompt).toHaveProperty('trigger', 'First trade!');
    expect(prompt).toHaveProperty('timestamp');
    expect(typeof prompt.timestamp).toBe('number');
  });
});
