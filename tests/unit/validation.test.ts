import { describe, it, expect } from 'vitest';
import { validateUserJson, validatePrizeJson, checkDuplicateUsers, checkDuplicatePrizes } from '@/utils/validation';

describe('validateUserJson', () => {
  it('should validate valid user JSON', () => {
    const json = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' }
    ]);

    const result = validateUserJson(json);
    expect(result).toHaveLength(2);
    expect(result[0].e_id).toBe('001');
    expect(result[0].minLevel).toBe(null); // Default value (no minimum restriction)
    expect(result[0].maxLevel).toBe(null); // Default value (no maximum restriction)
  });

  it('should reject invalid JSON', () => {
    expect(() => validateUserJson('invalid json')).toThrow('Invalid JSON format');
  });

  it('should reject non-array data', () => {
    const json = JSON.stringify({ e_id: '001', name: '张三' });
    expect(() => validateUserJson(json)).toThrow('must be an array');
  });

  it('should reject empty array', () => {
    const json = JSON.stringify([]);
    expect(() => validateUserJson(json)).toThrow('cannot be empty');
  });

  it('should reject missing required fields', () => {
    const json = JSON.stringify([{ e_id: '001' }]);
    expect(() => validateUserJson(json)).toThrow('Validation failed');
  });

  it('should reject invalid maxLevel values', () => {
    const json = JSON.stringify([
      { e_id: '001', name: '张三', maxLevel: 10 }
    ]);
    expect(() => validateUserJson(json)).toThrow('Validation failed');
  });
});

describe('validatePrizeJson', () => {
  it('should validate valid prize JSON', () => {
    const json = JSON.stringify([
      { name: '特等奖-iphone', count: '1', level: '0' },
      { name: '一等奖-ipad', count: '2', level: '1' }
    ]);

    const result = validatePrizeJson(json);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('特等奖-iphone');
  });

  it('should reject invalid JSON', () => {
    expect(() => validatePrizeJson('invalid json')).toThrow('Invalid JSON format');
  });

  it('should reject non-array data', () => {
    const json = JSON.stringify({ name: '特等奖', count: '1', level: '0' });
    expect(() => validatePrizeJson(json)).toThrow('must be an array');
  });

  it('should reject empty array', () => {
    const json = JSON.stringify([]);
    expect(() => validatePrizeJson(json)).toThrow('cannot be empty');
  });

  it('should reject invalid level values', () => {
    const json = JSON.stringify([
      { name: '特等奖', count: '1', level: '10' }
    ]);
    expect(() => validatePrizeJson(json)).toThrow('Validation failed');
  });
});

describe('checkDuplicateUsers', () => {
  it('should detect duplicate user IDs', () => {
    const users = [
      { e_id: '001', name: '张三', maxLevel: 5, isWinner: false },
      { e_id: '002', name: '李四', maxLevel: 5, isWinner: false },
      { e_id: '001', name: '张三', maxLevel: 5, isWinner: false }
    ];

    const result = checkDuplicateUsers(users);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates).toContain('001');
    expect(result.unique).toHaveLength(2);
  });

  it('should return unique when no duplicates', () => {
    const users = [
      { e_id: '001', name: '张三', maxLevel: 5, isWinner: false },
      { e_id: '002', name: '李四', maxLevel: 5, isWinner: false }
    ];

    const result = checkDuplicateUsers(users);
    expect(result.hasDuplicates).toBe(false);
    expect(result.unique).toHaveLength(2);
  });
});

describe('checkDuplicatePrizes', () => {
  it('should detect duplicate prize levels', () => {
    const prizes = [
      { level: 0, name: '特等奖-1', count: 1, remaining: 1 },
      { level: 1, name: '一等奖', count: 2, remaining: 2 },
      { level: 0, name: '特等奖-2', count: 1, remaining: 1 }
    ];

    const result = checkDuplicatePrizes(prizes);
    expect(result.hasDuplicates).toBe(true);
    expect(result.duplicates).toContain(0);
    expect(result.unique).toHaveLength(2);
  });

  it('should return unique when no duplicates', () => {
    const prizes = [
      { level: 0, name: '特等奖', count: 1, remaining: 1 },
      { level: 1, name: '一等奖', count: 2, remaining: 2 }
    ];

    const result = checkDuplicatePrizes(prizes);
    expect(result.hasDuplicates).toBe(false);
    expect(result.unique).toHaveLength(2);
  });
});
