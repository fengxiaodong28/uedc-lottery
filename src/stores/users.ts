import { defineStore } from 'pinia';
import type { User } from '@/types';
import { isUserEligible, validateUserLevelConfigs } from '@/types';
import configJson from '@/config/lottery-config.json';

// 配置文件中的用户数据类型
interface ConfigUser {
  e_id: string;
  name: string;
  minLevel?: number;
  maxLevel?: number;
}

// 配置文件的整体类型
interface LotteryConfig {
  users: ConfigUser[];
  drawRounds: Array<{
    level: number;
    name: string;
    count: number;
  }>;
}

// 从配置文件读取用户数据
const DEFAULT_USERS: User[] = (configJson as LotteryConfig).users.map((u): User => ({
  e_id: u.e_id,
  name: u.name,
  minLevel: u.minLevel ?? null,
  maxLevel: u.maxLevel ?? null,
  isWinner: false,
}));

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [...DEFAULT_USERS] as User[],
  }),

  getters: {
    /**
     * Get eligible users for a specific prize level.
     * Uses isUserEligible to check both minLevel and maxLevel constraints.
     *
     * Examples:
     * - minLevel=4, maxLevel=2: Eligible for prizes 2,3,4 (二等, 三等, 四等)
     * - minLevel=null, maxLevel=5: Eligible for all prizes (no restriction)
     * - minLevel=4, maxLevel=4: Eligible only for prize 4 (四等奖 only)
     */
    eligibleUsers: (state) => (prizeLevel: number): User[] => {
      return state.users.filter(user => isUserEligible(user, prizeLevel));
    },

    /**
     * Get users who have already won.
     */
    winnerUsers: (state): User[] => {
      return state.users.filter(user => user.isWinner);
    },

    /**
     * Total count of users.
     */
    totalCount: (state): number => {
      return state.users.length;
    },

    /**
     * Count of eligible users for the currently selected prize level.
     * This will be computed dynamically based on prize selection.
     */
    eligibleCount: (state): number => {
      return state.users.filter(user => !user.isWinner).length;
    },
  },

  actions: {
    /**
     * Load users from JSON string.
     * Parses, validates, removes duplicates, and updates state.
     */
    async loadUsers(json: string): Promise<void> {
      try {
        const parsed = JSON.parse(json);

        // Remove duplicates based on e_id
        const uniqueUsers = Array.from(
          new Map((parsed as User[]).map((u: User) => [u.e_id, u])).values()
        );

        // Set default maxLevel to null (no restriction) if not specified
        this.users = uniqueUsers.map((u: User) => ({
          ...u,
          minLevel: u.minLevel ?? null,
          maxLevel: u.maxLevel ?? null,
          isWinner: false,
        }));

        // Validate level configurations (throws if invalid)
        validateUserLevelConfigs(this.users);
      } catch (error) {
        throw new Error(`Invalid user JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    /**
     * Update a user's maximum eligible prize level.
     * @param userId - The employee ID of the user
     * @param maxLevel - New max level (-1 to 5)
     */
    setUserMaxLevel(userId: string, maxLevel: number): void {
      const user = this.users.find(u => u.e_id === userId);
      if (user) {
        if (maxLevel < -1 || maxLevel > 5) {
          throw new Error('maxLevel must be between -1 and 5');
        }
        user.maxLevel = maxLevel;
      }
    },

    /**
     * Mark a user as a winner.
     * @param userId - The employee ID of the user
     */
    markAsWinner(userId: string): void {
      const user = this.users.find(u => u.e_id === userId);
      if (user && !user.isWinner) {
        user.isWinner = true;
      }
    },

    /**
     * Reset all users to non-winner status.
     * Used for pool management or starting a new event.
     */
    resetPool(): void {
      // 创建新数组触发 Vue 响应式
      this.users = this.users.map(user => ({
        ...user,
        isWinner: false,
      }));
    },

    /**
     * Look up a user by ID.
     */
    getUserById(id: string): User | undefined {
      return this.users.find(u => u.e_id === id);
    },

    /**
     * Clear all users.
     */
    clear(): void {
      this.users = [];
    },

    /**
     * Load users from persisted state.
     */
    loadFromState(users: User[]): void {
      if (Array.isArray(users)) {
        this.users = users;
      } else {
        console.error('Invalid users data from persisted state:', users);
        // 不修改当前状态，保留默认值
      }
    },
  },
});
