import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePrizeStore } from '@/stores/prizes';
import { DRAW_ROUNDS, resetRemaining, decrementRemaining as decrementRoundRemaining } from '@/config/drawOrder';

describe('usePrizeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Reset prize counts before each test
    resetRemaining();
  });

  it('should load loadPrizes throw error (deprecated method)', async () => {
    const store = usePrizeStore();
    const json = JSON.stringify([
      { name: '特等奖-iphone', count: '1', level: '0' },
      { name: '一等奖-ipad', count: '2', level: '1' }
    ]);

    // loadPrizes is deprecated and should throw an error
    await expect(store.loadPrizes(json)).rejects.toThrow('Please configure prizes in lottery-config.json');
  });

  it('should select prize level', async () => {
    const store = usePrizeStore();

    store.selectLevel(1);

    expect(store.selectedLevel).toBe(1);
    // The prize comes from DRAW_ROUNDS, not from a store.prizes array
    expect(store.selectedPrize?.level).toBe(1);
    expect(store.selectedPrize?.name).toBeDefined();
  });

  it('should throw error for invalid level selection', async () => {
    const store = usePrizeStore();

    expect(() => store.selectLevel(10)).toThrow('must be between 0 and 5');
  });

  it('should decrement remaining count', async () => {
    const store = usePrizeStore();

    // Find a prize with count > 0
    const roundIndex = DRAW_ROUNDS.findIndex(r => r.count > 0);
    expect(roundIndex).toBeGreaterThanOrEqual(0);

    const round = DRAW_ROUNDS[roundIndex];
    const initialRemaining = round.remaining;

    store.decrementRemaining(round.level);

    expect(round.remaining).toBe(initialRemaining - 1);
  });

  it('should not decrement below zero', async () => {
    const store = usePrizeStore();

    // Find a prize with count = 1
    const roundIndex = DRAW_ROUNDS.findIndex(r => r.count === 1);
    if (roundIndex === -1) {
      // Skip if no prize with count = 1
      return;
    }

    const round = DRAW_ROUNDS[roundIndex];

    store.decrementRemaining(round.level);
    store.decrementRemaining(round.level); // Try to decrement again

    expect(round.remaining).toBe(0);
  });

  it('should check if prize level is exhausted', async () => {
    const store = usePrizeStore();

    // Use level 0 which has only one round in the test config
    const level = 0;
    const roundIndex = DRAW_ROUNDS.findIndex(r => r.level === level);

    // If level 0 doesn't exist or has count > 1, skip
    if (roundIndex === -1 || DRAW_ROUNDS[roundIndex].count !== 1) {
      // Try to find any level that appears only once
      const levelCounts = new Map<number, number>();
      DRAW_ROUNDS.forEach(r => {
        levelCounts.set(r.level, (levelCounts.get(r.level) || 0) + 1);
      });

      const uniqueLevel = Array.from(levelCounts.entries()).find(([_, count]) => count === 1);
      if (!uniqueLevel) {
        return; // Skip if no unique level exists
      }

      const [testLevel] = uniqueLevel;
      const testRoundIndex = DRAW_ROUNDS.findIndex(r => r.level === testLevel);
      const round = DRAW_ROUNDS[testRoundIndex];

      expect(store.isExhausted(round.level)).toBe(false);

      store.decrementRemaining(round.level);

      expect(store.isExhausted(round.level)).toBe(true);
      return;
    }

    const round = DRAW_ROUNDS[roundIndex];

    expect(store.isExhausted(round.level)).toBe(false);

    store.decrementRemaining(round.level);

    expect(store.isExhausted(round.level)).toBe(true);
  });

  it('should get available levels', async () => {
    const store = usePrizeStore();

    const available = store.availableLevels;

    // All prizes in DRAW_ROUNDS should be available initially
    expect(available.length).toBeGreaterThan(0);
    // All should have remaining > 0
    available.forEach(prize => {
      expect(prize.remaining).toBeGreaterThan(0);
    });
  });

  it('should check if drawing is possible', async () => {
    const store = usePrizeStore();

    // Find a prize with count > 0
    const roundIndex = DRAW_ROUNDS.findIndex(r => r.count > 0);
    expect(roundIndex).toBeGreaterThanOrEqual(0);

    const round = DRAW_ROUNDS[roundIndex];

    expect(store.canDraw).toBe(false); // No level selected

    store.selectLevel(round.level);

    expect(store.canDraw).toBe(true); // Level selected with remaining prizes

    // Clear selection to verify canDraw returns false
    store.clear();
    expect(store.canDraw).toBe(false); // No level selected

    // Note: Testing exhaustion requires a unique level or re-selecting to update getter
    // The getter caches results since DRAW_ROUNDS is external to Pinia state
  });

  it('should get prize by level', async () => {
    const store = usePrizeStore();

    // Test with the first available level in DRAW_ROUNDS
    const firstRound = DRAW_ROUNDS[0];

    const prize = store.prizeByLevel(firstRound.level);

    expect(prize).toBeDefined();
    expect(prize?.level).toBe(firstRound.level);
    expect(prize?.name).toBe(firstRound.name);
  });

  it('should return undefined for non-existent prize level', async () => {
    const store = usePrizeStore();

    // Level 99 doesn't exist in DRAW_ROUNDS
    const notFound = store.prizeByLevel(99);
    expect(notFound).toBeUndefined();
  });

  it('should clear selected level', async () => {
    const store = usePrizeStore();

    store.selectLevel(0);
    expect(store.selectedLevel).toBe(0);

    store.clear();

    expect(store.selectedLevel).toBeNull();
    expect(store.selectedPrize).toBeUndefined();
  });

  it('should reset remaining counts', async () => {
    const store = usePrizeStore();

    // Find a prize with count > 0 and decrement it
    const roundIndex = DRAW_ROUNDS.findIndex(r => r.count > 0);
    if (roundIndex === -1) {
      return;
    }

    const round = DRAW_ROUNDS[roundIndex];
    const originalCount = round.count;

    // Decrement
    decrementRoundRemaining(roundIndex);
    expect(round.remaining).toBeLessThan(originalCount);

    // Reset
    store.resetRemaining();
    expect(round.remaining).toBe(originalCount);
  });
});
