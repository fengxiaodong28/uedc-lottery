import { describe, it, expect } from 'vitest';
import { isUserEligible, validateUserLevelConfigs, type User } from '@/types';

describe('Invalid Level Combination Detection', () => {
  describe('isUserEligible - throws on invalid combination', () => {
    it('should throw error when minLevel < maxLevel (场景20: 0,1)', () => {
      const user: User = {
        e_id: 'S20',
        name: '场景20',
        minLevel: 0,
        maxLevel: 1,
        isWinner: false
      };

      expect(() => isUserEligible(user, 0)).toThrow(
        /的等级配置无效.*minLevel\(0\) < maxLevel\(1\)/
      );
    });

    it('should throw error when minLevel < maxLevel (场景25: 1,2)', () => {
      const user: User = {
        e_id: 'S25',
        name: '场景25',
        minLevel: 1,
        maxLevel: 2,
        isWinner: false
      };

      expect(() => isUserEligible(user, 1)).toThrow(
        /的等级配置无效.*minLevel\(1\) < maxLevel\(2\)/
      );
    });

    it('should throw error when minLevel < maxLevel (场景29: 2,3)', () => {
      const user: User = {
        e_id: 'S29',
        name: '场景29',
        minLevel: 2,
        maxLevel: 3,
        isWinner: false
      };

      expect(() => isUserEligible(user, 2)).toThrow(
        /的等级配置无效.*minLevel\(2\) < maxLevel\(3\)/
      );
    });

    it('should throw error when minLevel < maxLevel (场景32: 3,4)', () => {
      const user: User = {
        e_id: 'S32',
        name: '场景32',
        minLevel: 3,
        maxLevel: 4,
        isWinner: false
      };

      expect(() => isUserEligible(user, 3)).toThrow(
        /的等级配置无效.*minLevel\(3\) < maxLevel\(4\)/
      );
    });

    it('should throw error when minLevel < maxLevel (场景34: 4,5)', () => {
      const user: User = {
        e_id: 'S34',
        name: '场景34',
        minLevel: 4,
        maxLevel: 5,
        isWinner: false
      };

      expect(() => isUserEligible(user, 4)).toThrow(
        /的等级配置无效.*minLevel\(4\) < maxLevel\(5\)/
      );
    });

    it('should NOT throw error for valid combinations (场景49: 1,0)', () => {
      const user: User = {
        e_id: 'S49',
        name: '场景49',
        minLevel: 1,
        maxLevel: 0,
        isWinner: false
      };

      expect(() => isUserEligible(user, 0)).not.toThrow();
      expect(isUserEligible(user, 0)).toBe(true);
      expect(isUserEligible(user, 1)).toBe(true);
    });

    it('should NOT throw error for valid combinations (场景16: 2,2)', () => {
      const user: User = {
        e_id: 'S16',
        name: '场景16',
        minLevel: 2,
        maxLevel: 2,
        isWinner: false
      };

      expect(() => isUserEligible(user, 2)).not.toThrow();
      expect(isUserEligible(user, 2)).toBe(true);
    });
  });

  describe('validateUserLevelConfigs - batch validation', () => {
    it('should throw error listing all invalid users', () => {
      const users: User[] = [
        { e_id: '001', name: '张三', minLevel: 0, maxLevel: 1, isWinner: false },
        { e_id: '002', name: '李四', minLevel: 1, maxLevel: 2, isWinner: false },
        { e_id: '003', name: '王五', minLevel: 4, maxLevel: 4, isWinner: false }  // Valid
      ];

      expect(() => validateUserLevelConfigs(users)).toThrow(
        /发现 2 个用户的等级配置无效/
      );
    });

    it('should include user details in error message', () => {
      const users: User[] = [
        { e_id: '001', name: '张三', minLevel: 0, maxLevel: 1, isWinner: false }
      ];

      expect(() => validateUserLevelConfigs(users)).toThrow(
        /张三 \(001\): minLevel\(0\) < maxLevel\(1\)/
      );
    });

    it('should NOT throw error when all users are valid', () => {
      const users: User[] = [
        { e_id: '001', name: '张三', minLevel: null, maxLevel: null, isWinner: false },
        { e_id: '002', name: '李四', minLevel: 2, maxLevel: 0, isWinner: false },
        { e_id: '003', name: '王五', minLevel: 4, maxLevel: 4, isWinner: false }
      ];

      expect(() => validateUserLevelConfigs(users)).not.toThrow();
    });

    it('should NOT throw error when minLevel or maxLevel is null', () => {
      const users: User[] = [
        { e_id: '001', name: '张三', minLevel: null, maxLevel: 0, isWinner: false },
        { e_id: '002', name: '李四', minLevel: 0, maxLevel: null, isWinner: false }
      ];

      expect(() => validateUserLevelConfigs(users)).not.toThrow();
    });
  });

  describe('All 13 invalid combinations should throw', () => {
    const invalidCombinations: Array<[number, number]> = [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],  // minLevel=0
      [1, 2], [1, 3], [1, 4], [1, 5],         // minLevel=1
      [2, 3], [2, 4], [2, 5],                // minLevel=2
      [3, 4], [3, 5],                        // minLevel=3
      [4, 5]                                 // minLevel=4
    ];

    it.each(invalidCombinations)('minLevel=%i, maxLevel=%i should throw', (minLevel, maxLevel) => {
      const user: User = {
        e_id: `test_${minLevel}_${maxLevel}`,
        name: `测试用户 ${minLevel},${maxLevel}`,
        minLevel,
        maxLevel,
        isWinner: false
      };

      expect(() => isUserEligible(user, 0)).toThrow(
        /的等级配置无效/
      );
    });
  });
});
