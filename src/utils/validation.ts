import { UserInputItemSchema, PrizeInputItemSchema, type User, type PrizeLevel } from '@/types';

/**
 * Validate user JSON data.
 * @param json - JSON string to validate
 * @returns Array of validated users
 * @throws Error with validation message if invalid
 */
export function validateUserJson(json: string): User[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('User data must be an array');
  }

  if (parsed.length === 0) {
    throw new Error('User data cannot be empty');
  }

  // Validate each user with Zod schema
  const validated: User[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const result = UserInputItemSchema.safeParse(parsed[i]);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) =>
        `[${i}].${issue.path.join('.')}: ${issue.message}`
      );
      errors.push(...errorMessages);
    } else {
      // Apply default values
      validated.push({
        e_id: result.data.e_id,
        name: result.data.name,
        minLevel: result.data.minLevel ?? null, // Default to null (no minimum restriction)
        maxLevel: result.data.maxLevel ?? null, // Default to null (no maximum restriction)
        isWinner: false,
      });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  return validated;
}

/**
 * Validate prize JSON data.
 * @param json - JSON string to validate
 * @returns Array of validated prizes
 * @throws Error with validation message if invalid
 */
export function validatePrizeJson(json: string): PrizeLevel[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Prize data must be an array');
  }

  if (parsed.length === 0) {
    throw new Error('Prize data cannot be empty');
  }

  // Validate each prize with Zod schema
  const validated: PrizeLevel[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const result = PrizeInputItemSchema.safeParse(parsed[i]);

    if (!result.success) {
      const errorMessages = result.error.issues.map((issue) =>
        `[${i}].${issue.path.join('.')}: ${issue.message}`
      );
      errors.push(...errorMessages);
    } else {
      // Parse strings to numbers
      validated.push({
        level: parseInt(result.data.level, 10),
        name: result.data.name,
        count: parseInt(result.data.count, 10),
        remaining: parseInt(result.data.count, 10),
      });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join('; ')}`);
  }

  return validated;
}

/**
 * Check for duplicate user IDs.
 * @param users - Array of users to check
 * @returns Object with duplicate info
 */
export function checkDuplicateUsers(users: User[]): {
  hasDuplicates: boolean;
  duplicates: string[];
  unique: User[];
} {
  const idMap = new Map<string, User>();
  const duplicateIds = new Set<string>();

  for (const user of users) {
    if (idMap.has(user.e_id)) {
      duplicateIds.add(user.e_id);
    } else {
      idMap.set(user.e_id, user);
    }
  }

  return {
    hasDuplicates: duplicateIds.size > 0,
    duplicates: Array.from(duplicateIds),
    unique: Array.from(idMap.values()),
  };
}

/**
 * Check for duplicate prize levels.
 * @param prizes - Array of prizes to check
 * @returns Object with duplicate info
 */
export function checkDuplicatePrizes(prizes: PrizeLevel[]): {
  hasDuplicates: boolean;
  duplicates: number[];
  unique: PrizeLevel[];
} {
  const levelMap = new Map<number, PrizeLevel>();
  const duplicateLevels = new Set<number>();

  for (const prize of prizes) {
    if (levelMap.has(prize.level)) {
      duplicateLevels.add(prize.level);
    } else {
      levelMap.set(prize.level, prize);
    }
  }

  return {
    hasDuplicates: duplicateLevels.size > 0,
    duplicates: Array.from(duplicateLevels),
    unique: Array.from(levelMap.values()),
  };
}
