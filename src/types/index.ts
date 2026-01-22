/**
 * Lottery Application Type Definitions
 *
 * This file defines the TypeScript interfaces and Zod schemas for the lottery
 * application domain. These contracts are used throughout the application for
 * type safety and validation.
 *
 * Feature: 001-lottery-app
 * Phase: 1 - Design & Contracts
 */

import { z } from 'zod';

// ============================================================================
// PRIZE LEVEL DEFINITIONS
// ============================================================================

/**
 * Prize level enumeration with Chinese names.
 * Level 0 is the highest prize (Special), Level 5 is the lowest (5th Prize).
 */
export const PRIZE_LEVELS = {
  SPECIAL: 0,    // 特等奖
  FIRST: 1,      // 一等奖
  SECOND: 2,     // 二等奖
  THIRD: 3,      // 三等奖
  FOURTH: 4,     // 四等奖
  FIFTH: 5,      // 五等奖
} as const;

/**
 * Prize level names in Chinese and English.
 */
export const PRIZE_LEVEL_NAMES: Record<number, { zh: string; en: string }> = {
  0: { zh: '特等奖', en: 'Special Prize' },
  1: { zh: '一等奖', en: 'First Prize' },
  2: { zh: '二等奖', en: 'Second Prize' },
  3: { zh: '三等奖', en: 'Third Prize' },
  4: { zh: '四等奖', en: 'Fourth Prize' },
  5: { zh: '五等奖', en: 'Fifth Prize' },
};

/**
 * Get prize level name by level number.
 */
export function getPrizeLevelName(level: number, locale: 'zh' | 'en' = 'zh'): string {
  return PRIZE_LEVEL_NAMES[level]?.[locale] || `Level ${level}`;
}

// ============================================================================
// USER ENTITIES
// ============================================================================

/**
 * User entity representing a lottery participant.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * PRIZE LEVEL SYSTEM (倒序系统)
 * ════════════════════════════════════════════════════════════════════════════
 * Level 0 = 特等奖 (Special Prize, 最高/最好)
 * Level 1 = 一等奖 (First Prize)
 * Level 2 = 二等奖 (Second Prize)
 * Level 3 = 三等奖 (Third Prize)
 * Level 4 = 四等奖 (Fourth Prize)
 * Level 5 = 五等奖 (Fifth Prize, 最低/最差)
 *
 * 数字越小 = 奖项越好 (Lower number = Better prize)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * minLevel / maxLevel LOGIC
 * ════════════════════════════════════════════════════════════════════════════
 * minLevel=n: "至少中n等奖" = Can win n OR BETTER
 *   → prizeLevel <= n (排除比n更差的等级)
 *   → minLevel=4: 可中 {0,1,2,3,4} (特等~四等)
 *   → minLevel=0: 可中 {0} (只能特等)
 *
 * maxLevel=n: "最多中n等奖" = Can win n OR WORSE
 *   → prizeLevel >= n (排除比n更好的等级)
 *   → maxLevel=2: 可中 {2,3,4,5} (二等~五等)
 *   → maxLevel=5: 可中 {5} (只能五等)
 *   → maxLevel=0: 可中全部 {0,1,2,3,4,5} (0是最小值，所有等级都>=0，等同于无限制)
 *
 * 可中奖 = minLevel约束 ∩ maxLevel约束 (交集)
 *
 * ════════════════════════════════════════════════════════════════════════════
 * EXAMPLES / 场景示例
 * ════════════════════════════════════════════════════════════════════════════
 * 配置示例                    | 可中奖等级          | 说明
 * ---------------------------|--------------------|--------------------
 * minLevel=null, maxLevel=null | [0,1,2,3,4,5]     | 无限制
 * minLevel=4, maxLevel=null    | [0,1,2,3,4]       | 至少四等(特等~四等)
 * minLevel=null, maxLevel=2    | [2,3,4,5]         | 最多二等(二等~五等)
 * minLevel=4, maxLevel=4       | [4]               | 只能四等
 * minLevel=3, maxLevel=2       | [2,3]             | 二等、三等(交集)
 * minLevel=2, maxLevel=1       | [1,2]             | 一等、二等(交集)
 * minLevel=0, maxLevel=0       | [0]               | 只能特等
 *
 * @property {string} e_id - Unique employee identifier
 * @property {string} name - Display name
 * @property {number} minLevel - Minimum prize level (at least n or better)
 *   null/undefined = no minimum restriction
 * @property {number} maxLevel - Maximum prize level (at most n or worse)
 *   null/undefined = no maximum restriction
 * @property {boolean} isWinner - Whether user has already won (computed)
 */
export interface User {
  e_id: string;
  name: string;
  minLevel?: number | null;
  maxLevel?: number | null;
  isWinner?: boolean;
}

/**
 * Zod schema for validating User entities.
 */
export const UserSchema = z.object({
  e_id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  minLevel: z.number().int().min(0).max(5).optional().nullable(),
  maxLevel: z.number().int().min(0).max(5).optional().nullable(),
  isWinner: z.boolean().optional().default(false),
});

/**
 * Zod schema for individual user input (raw data from file).
 * Both minLevel and maxLevel are optional in input.
 * - minLevel defaults to null (no minimum restriction)
 * - maxLevel defaults to null (no maximum restriction, can win all prizes)
 */
export const UserInputItemSchema = z.object({
  e_id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  minLevel: z.number().int().min(0).max(5).optional().nullable(),
  maxLevel: z.number().int().min(0).max(5).optional().nullable(),
});

// ============================================================================
// PRIZE LEVEL ENTITIES
// ============================================================================

/**
 * Prize level entity representing a category of prizes.
 *
 * @property {number} level - Prize level identifier (0-5)
 * @property {string} name - Human-readable prize name
 * @property {number} count - Total quantity of this prize
 * @property {number} remaining - Prizes still available (computed)
 */
export interface PrizeLevel {
  level: number;
  name: string;
  count: number;
  remaining: number;
}

/**
 * Zod schema for validating PrizeLevel entities.
 */
export const PrizeLevelSchema = z.object({
  level: z.number().int().min(0).max(5),
  name: z.string().min(1, 'Prize name is required'),
  count: z.number().int().positive('Count must be positive'),
  remaining: z.number().int().min(0),
});

/**
 * Type for prize input JSON (raw data from file).
 * count and level are strings in input format.
 */
export type PrizeInput = {
  name: string;
  count: string;  // String in input, parsed to number
  level: string;  // String in input, parsed to number
};

/**
 * Zod schema for individual prize input (raw data from file).
 */
export const PrizeInputItemSchema = z.object({
  name: z.string().min(1, 'Prize name is required'),
  count: z.string().regex(/^\d+$/, 'Count must be a positive integer'),
  level: z.string().regex(/^[0-5]$/, 'Level must be between 0 and 5'),
});

// ============================================================================
// WINNER ENTITIES
// ============================================================================

/**
 * Winner entity representing a lottery outcome.
 *
 * @property {string} id - Unique winner identifier (auto-generated)
 * @property {string} userId - Reference to User.e_id
 * @property {string} userName - Name of winner (copied from User)
 * @property {number} prizeLevel - Prize level won (0-5)
 * @property {string} prizeName - Name of prize won (copied from Prize)
 * @property {string} timestamp - ISO 8601 datetime of draw
 */
export interface Winner {
  id: string;
  userId: string;
  userName: string;
  prizeLevel: number;
  prizeName: string;
  timestamp: string;
}

/**
 * Zod schema for validating Winner entities.
 */
export const WinnerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  userName: z.string().min(1),
  prizeLevel: z.number().int().min(0).max(5),
  prizeName: z.string().min(1),
  timestamp: z.string().datetime(),
});

// ============================================================================
// EXPORT DATA STRUCTURES
// ============================================================================

/**
 * Summary statistics for exported results.
 */
export interface WinnerSummary {
  totalWinners: number;
  prizesAwarded: Record<number, number>;  // level -> count
}

/**
 * Complete export structure for winner results.
 */
export interface WinnerExport {
  eventDate: string;  // ISO 8601
  winners: Winner[];
  summary: WinnerSummary;
}

/**
 * Zod schema for winner export validation.
 */
export const WinnerExportSchema = z.object({
  eventDate: z.string().datetime(),
  winners: z.array(WinnerSchema),
  summary: z.object({
    totalWinners: z.number().int().nonnegative(),
    prizesAwarded: z.record(z.string(), z.number().int().nonnegative()),
  }),
});

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Application state persisted to localStorage.
 * Note: prizes are managed in drawOrder.ts and don't need separate persistence
 */
export interface PersistedState {
  version: string;
  timestamp: string;
  users: User[];
  winners: Winner[];
}

/**
 * Zod schema for persisted state validation.
 */
export const PersistedStateSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  users: z.array(UserSchema),
  winners: z.array(WinnerSchema),
});

// ============================================================================
// ELIGIBILITY UTILITIES
// ============================================================================

/**
 * Check if a user is eligible for a specific prize level.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * ELIGIBILITY LOGIC
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 用户可中奖的条件：
 * 1. 还没有中奖 (user.isWinner = false)
 * 2. 满足 minLevel 约束: prizeLevel <= user.minLevel (如果设置了)
 * 3. 满足 maxLevel 约束: prizeLevel >= user.maxLevel (如果设置了)
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ 可中奖 = (未中奖) AND (prizeLevel <= minLevel) AND (prizeLevel >= maxLevel) │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ⚠️ **无效组合检测**: 如果 minLevel < maxLevel，会抛出错误
 *    例如：minLevel=0, maxLevel=1 是无效的（要求 prizeLevel <= 0 且 >= 1，不可能）
 *
 * @param user - The user to check
 * @param prizeLevel - The prize level being drawn (0-5, 倒序系统)
 * @returns true if user can win this prize level
 * @throws Error if user has invalid level configuration (minLevel < maxLevel)
 *
 * @example
 * // 用户: minLevel=3, maxLevel=2
 * // 可中奖: {2,3} (二等、三等)
 * isUserEligible(user, 2) // true
 * isUserEligible(user, 3) // true
 * isUserEligible(user, 1) // false (比maxLevel更好)
 * isUserEligible(user, 4) // false (比minLevel更差)
 *
 * @example
 * // 用户: minLevel=0, maxLevel=1 (无效配置)
 * isUserEligible(user, 0) // throws Error: Invalid level configuration
 */
export function isUserEligible(user: User, prizeLevel: number): boolean {
  // Already won
  if (user.isWinner) {
    return false;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 无效组合检测: minLevel < maxLevel 会导致交集为空
  // ════════════════════════════════════════════════════════════════════════════
  if (
    user.minLevel !== null &&
    user.minLevel !== undefined &&
    user.maxLevel !== null &&
    user.maxLevel !== undefined &&
    user.minLevel < user.maxLevel
  ) {
    throw new Error(
      `用户 "${user.name}" (${user.e_id}) 的等级配置无效：` +
      `minLevel(${user.minLevel}) < maxLevel(${user.maxLevel}) 会导致无法中奖。` +
      `请修正配置，参考 docs/level-combinations.md 文档。`
    );
  }

  // Level checks for inverted levels (0=highest/Special, 5=lowest/Fifth)

  // Check minLevel constraint: user can win prizeLevel OR BETTER
  // i.e., prizeLevel must be <= minLevel (excludes levels worse/higher numbers)
  if (user.minLevel !== null && user.minLevel !== undefined) {
    if (prizeLevel > user.minLevel) {
      return false; // Can't win prizes worse than minLevel
    }
  }

  // Check maxLevel constraint: user can win prizeLevel OR WORSE
  // i.e., prizeLevel must be >= maxLevel (excludes levels better/lower numbers)
  // maxLevel=null means no upper limit
  if (user.maxLevel !== null && user.maxLevel !== undefined) {
    if (prizeLevel < user.maxLevel) {
      return false; // Can't win prizes better than maxLevel
    }
  }

  return true;
}

/**
 * Filter users by eligibility for a prize level.
 *
 * @param users - All users
 * @param prizeLevel - The prize level being drawn
 * @returns Array of eligible users
 */
export function filterEligibleUsers(users: User[], prizeLevel: number): User[] {
  return users.filter(user => isUserEligible(user, prizeLevel));
}

/**
 * Validate user level configurations.
 * Checks for invalid combinations where minLevel < maxLevel.
 *
 * @param users - Users to validate
 * @returns Object with validation results
 * @throws Error with details of all invalid configurations found
 *
 * @example
 * const users = [
 *   { e_id: '001', name: '张三', minLevel: 0, maxLevel: 1 },  // Invalid
 *   { e_id: '002', name: '李四', minLevel: 2, maxLevel: 1 }   // Valid
 * ];
 * validateUserLevelConfigs(users); // Throws Error with details
 */
export function validateUserLevelConfigs(users: User[]): void {
  const invalidUsers: Array<{ user: User; reason: string }> = [];

  for (const user of users) {
    if (
      user.minLevel !== null &&
      user.minLevel !== undefined &&
      user.maxLevel !== null &&
      user.maxLevel !== undefined &&
      user.minLevel < user.maxLevel
    ) {
      invalidUsers.push({
        user,
        reason: `minLevel(${user.minLevel}) < maxLevel(${user.maxLevel})`,
      });
    }
  }

  if (invalidUsers.length > 0) {
    const errorLines = invalidUsers.map(
      ({ user, reason }) => `  - ${user.name} (${user.e_id}): ${reason}`
    );
    throw new Error(
      `发现 ${invalidUsers.length} 个用户的等级配置无效：\n` +
        errorLines.join('\n') +
        '\n请修正配置，参考 docs/level-combinations.md 文档。'
    );
  }
}

