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
 * @property {string} e_id - Unique employee identifier
 * @property {string} name - Display name
 * @property {number} maxLevel - Maximum eligible prize level (-1 to 5)
 *   - -1: No-win pool (never eligible)
 *   - 0: Special prize only
 *   - 1: First prize and above
 *   - 5: All prizes (default)
 * @property {boolean} isWinner - Whether user has already won (computed)
 */
export interface User {
  e_id: string;
  name: string;
  maxLevel: number;
  isWinner?: boolean;
}

/**
 * Zod schema for validating User entities.
 */
export const UserSchema = z.object({
  e_id: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  maxLevel: z.number().int().min(-1).max(5).optional().default(5),
  isWinner: z.boolean().optional().default(false),
});

/**
 * Type for user input JSON (raw data from file).
 * maxLevel is optional in input, defaults to 5.
 */
export type UserInput = Omit<User, 'maxLevel' | 'isWinner'> & {
  maxLevel?: number;
};

/**
 * Zod schema for user input JSON array.
 */
export const UserInputSchema = z.array(UserSchema.partial({
  maxLevel: true,
  isWinner: true,
}).extend({
  maxLevel: z.number().int().min(-1).max(5).optional(),
}));

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
 * Zod schema for prize input JSON (from file).
 */
export const PrizeInputSchema = z.object({
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
    prizesAwarded: z.record(z.number().int().nonnegative()),
  }),
});

// ============================================================================
// STATE PERSISTENCE
// ============================================================================

/**
 * Application state persisted to localStorage.
 */
export interface PersistedState {
  version: string;
  timestamp: string;
  users: User[];
  prizes: PrizeLevel[];
  winners: Winner[];
  selectedLevel: number | null;
}

/**
 * Zod schema for persisted state validation.
 */
export const PersistedStateSchema = z.object({
  version: z.string(),
  timestamp: z.string().datetime(),
  users: z.array(UserSchema),
  prizes: z.array(PrizeLevelSchema),
  winners: z.array(WinnerSchema),
  selectedLevel: z.number().int().min(0).max(5).nullable(),
});

// ============================================================================
// ELIGIBILITY UTILITIES
// ============================================================================

/**
 * Check if a user is eligible for a specific prize level.
 *
 * @param user - The user to check
 * @param prizeLevel - The prize level being drawn
 * @returns true if user can win this prize level
 */
export function isUserEligible(user: User, prizeLevel: number): boolean {
  // No-win pool
  if (user.maxLevel === -1) {
    return false;
  }
  // Already won
  if (user.isWinner) {
    return false;
  }
  // Level check (user.maxLevel must be >= prizeLevel)
  return user.maxLevel >= prizeLevel;
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
 * Generate unique winner ID.
 */
export function generateWinnerId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create Winner entity from User and PrizeLevel.
 */
export function createWinner(user: User, prize: PrizeLevel): Winner {
  return {
    id: generateWinnerId(),
    userId: user.e_id,
    userName: user.name,
    prizeLevel: prize.level,
    prizeName: prize.name,
    timestamp: new Date().toISOString(),
  };
}
