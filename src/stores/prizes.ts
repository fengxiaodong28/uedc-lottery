import { defineStore } from 'pinia';
import type { PrizeLevel } from '@/types';
import { DRAW_ROUNDS, decrementRemaining as decrementRoundRemaining, resetRemaining as resetDrawOrderRemaining } from '@/config/drawOrder';

// Prizes store 现在作为 drawRounds 的适配器
export const usePrizeStore = defineStore('prizes', {
  state: () => ({
    selectedLevel: null as number | null,
  }),

  getters: {
    /**
     * Get prize by level number (获取第一个匹配的奖品)
     */
    prizeByLevel: () => (level: number): PrizeLevel | undefined => {
      const round = DRAW_ROUNDS.find(r => r.level === level);
      if (!round) return undefined;
      return {
        level: round.level,
        name: round.name,
        count: round.count,
        remaining: round.remaining,
      };
    },

    /**
     * Get only prizes that still have remaining quantity.
     */
    availableLevels: (): PrizeLevel[] => {
      return DRAW_ROUNDS
        .filter(p => p.remaining > 0)
        .map(p => ({
          level: p.level,
          name: p.name,
          count: p.count,
          remaining: p.remaining,
        }));
    },

    /**
     * Check if a prize level is exhausted (no remaining prizes).
     */
    isExhausted: () => (level: number): boolean => {
      const rounds = DRAW_ROUNDS.filter(r => r.level === level);
      return rounds.every(r => r.remaining <= 0);
    },

    /**
     * Get the currently selected prize.
     */
    selectedPrize: (state): PrizeLevel | undefined => {
      if (state.selectedLevel === null) return undefined;
      const round = DRAW_ROUNDS.find(r => r.level === state.selectedLevel);
      if (!round) return undefined;
      return {
        level: round.level,
        name: round.name,
        count: round.count,
        remaining: round.remaining,
      };
    },

    /**
     * Check if drawing is possible (has selected level with remaining prizes).
     */
    canDraw: (state): boolean => {
      if (state.selectedLevel === null) return false;
      const rounds = DRAW_ROUNDS.filter(r => r.level === state.selectedLevel);
      return rounds.some(r => r.remaining > 0);
    },
  },

  actions: {
    /**
     * Load prizes from JSON string.
     * 注意：现在奖品配置在 drawRounds 中，此方法保留用于兼容性
     */
    async loadPrizes(_json: string): Promise<void> {
      throw new Error('Please configure prizes in lottery-config.json drawRounds instead');
    },

    /**
     * Select a prize level for drawing.
     * @param level - The prize level to select (0-5)
     */
    selectLevel(level: number): void {
      if (level < 0 || level > 5) {
        throw new Error('Level must be between 0 and 5');
      }
      this.selectedLevel = level;
    },

    /**
     * Decrement remaining count for a prize level.
     * 注意：实际由 drawOrder 模块管理剩余数量
     */
    decrementRemaining(level: number): void {
      // 找到第一个匹配该等级且有剩余的轮次并减少
      for (let i = 0; i < DRAW_ROUNDS.length; i++) {
        const round = DRAW_ROUNDS[i];
        if (round.level === level && round.remaining > 0) {
          decrementRoundRemaining(i);
          return;
        }
      }
    },

    /**
     * Clear all prizes.
     */
    clear(): void {
      this.selectedLevel = null;
    },

    /**
     * Reset all prize remaining counts.
     */
    resetRemaining(): void {
      resetDrawOrderRemaining();
    },
  },
});
