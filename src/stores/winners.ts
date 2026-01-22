import { defineStore } from 'pinia';
import type { Winner, User, PrizeLevel } from '@/types';

// 简化的奖品信息接口
interface PrizeInfo {
  level: number;
  name: string;
  count: number;
  remaining: number;
}

export const useWinnerStore = defineStore('winners', {
  state: () => ({
    winners: [] as Winner[],
  }),

  getters: {
    /**
     * Get winners grouped by prize level.
     */
    winnersByLevel: (state) => (level: number): Winner[] => {
      return state.winners.filter(w => w.prizeLevel === level);
    },

    /**
     * Get set of user IDs who have won (for exclusion from eligible pool).
     */
    winnerUserIds: (state): Set<string> => {
      return new Set(state.winners.map(w => w.userId));
    },

    /**
     * Total count of winners.
     */
    totalWinners: (state): number => {
      return state.winners.length;
    },

    /**
     * Get winners in chronological order (by timestamp).
     */
    chronological: (state): Winner[] => {
      return [...state.winners].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
  },

  actions: {
    /**
     * Add a new winner.
     * Creates a Winner entity from User and PrizeInfo.
     */
    addWinner(user: User, prize: PrizeLevel | PrizeInfo, roundTimestamp?: string): void {
      // Check if user already won
      if (this.winnerUserIds.has(user.e_id)) {
        throw new Error(`User ${user.name} has already won a prize`);
      }

      const winner: Winner = {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        userId: user.e_id,
        userName: user.name,
        prizeLevel: prize.level,
        prizeName: prize.name,
        timestamp: roundTimestamp || new Date().toISOString(),
      };

      this.winners.push(winner);
    },

    /**
     * Export all winners as JSON string.
     * Returns formatted export with event date, winners array, and summary.
     */
    exportResults(): string {
      const summary: Record<number, number> = {};

      // Count winners by prize level
      for (const winner of this.winners) {
        summary[winner.prizeLevel] = (summary[winner.prizeLevel] || 0) + 1;
      }

      const exportData = {
        eventDate: new Date().toISOString(),
        winners: this.winners,
        summary: {
          totalWinners: this.winners.length,
          prizesAwarded: summary,
        },
      };

      return JSON.stringify(exportData, null, 2);
    },

    /**
     * Clear all winners.
     * Used for starting a new event.
     */
    clearHistory(): void {
      this.winners = [];
    },

    /**
     * Load winners from persisted state.
     */
    loadFromState(winners: Winner[]): void {
      if (Array.isArray(winners)) {
        this.winners = winners;
      } else {
        console.error('Invalid winners data from persisted state:', winners);
        // 不修改当前状态，保留默认值
      }
    },
  },
});
