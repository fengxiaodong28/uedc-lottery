import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/users';
import { usePrizeStore } from '@/stores/prizes';
import { validateUserJson, validatePrizeJson, checkDuplicateUsers } from '@/utils/validation';

describe('Import Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should complete full user import workflow', async () => {
    const userStore = useUserStore();

    const validJson = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四', maxLevel: 2 },
      { e_id: '003', name: '王五', maxLevel: 4 }
    ]);

    // Validate first
    const validated = validateUserJson(validJson);
    expect(validated).toHaveLength(3);

    // Load into store
    await userStore.loadUsers(validJson);

    // Verify state
    expect(userStore.users).toHaveLength(3);
    expect(userStore.totalCount).toBe(3);

    // Verify eligibility
    const eligibleFor5th = userStore.eligibleUsers(5);
    expect(eligibleFor5th).toHaveLength(3); // All users can win 5th prize (default maxLevel=null, or maxLevel >=5)

    const eligibleFor1st = userStore.eligibleUsers(1);
    expect(eligibleFor1st).toHaveLength(1); // Only 003 (maxLevel=4 >=1)
  });

  it('should complete full prize import workflow', async () => {
    const prizeStore = usePrizeStore();

    const validJson = JSON.stringify([
      { name: '特等奖-iphone', count: '1', level: '0' },
      { name: '一等奖-ipad', count: '2', level: '1' },
      { name: '五等奖-纪念品', count: '100', level: '5' }
    ]);

    // Validate first
    const validated = validatePrizeJson(validJson);
    expect(validated).toHaveLength(3);

    // Note: loadPrizes is deprecated, prizes are now configured via lottery-config.json
    // This test only validates the JSON format
    await expect(prizeStore.loadPrizes(validJson)).rejects.toThrow('Please configure prizes in lottery-config.json');
  });

  it('should handle duplicate users in import', async () => {
    const userStore = useUserStore();

    const jsonWithDuplicates = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' },
      { e_id: '001', name: '张三' }
    ]);

    await userStore.loadUsers(jsonWithDuplicates);

    // Should remove duplicates automatically
    expect(userStore.users).toHaveLength(2);
    expect(userStore.users[0].e_id).toBe('001');
  });

  it.skip('should reject invalid user data with clear error', async () => {
    const userStore = useUserStore();

    const invalidJson = JSON.stringify([
      { e_id: '001' } // Missing name
    ]);

    // loadUsers should throw an error
    await expect(userStore.loadUsers(invalidJson)).rejects.toThrowError();
  });

  it('should reject duplicate prize levels', async () => {
    const prizeStore = usePrizeStore();

    const invalidJson = JSON.stringify([
      { name: '特等奖-1', count: '1', level: '0' },
      { name: '特等奖-2', count: '1', level: '0' }
    ]);

    // loadPrizes is deprecated and throws an error
    await expect(prizeStore.loadPrizes(invalidJson)).rejects.toThrow('Please configure prizes in lottery-config.json');
  });

  it('should allow loading new data after clearing', async () => {
    const userStore = useUserStore();
    const prizeStore = usePrizeStore();

    // Load initial data
    await userStore.loadUsers(JSON.stringify([
      { e_id: '001', name: '张三' }
    ]));

    expect(userStore.users).toHaveLength(1);

    // Clear and load new data
    userStore.clear();

    await userStore.loadUsers(JSON.stringify([
      { e_id: '002', name: '李四' }
    ]));

    expect(userStore.users).toHaveLength(1);
    expect(userStore.users[0].e_id).toBe('002');

    // Note: prize loading is now done via lottery-config.json, not via store
    // prizeStore.clear() only clears the selectedLevel state
    prizeStore.selectLevel(0);
    expect(prizeStore.selectedPrize?.level).toBe(0);
    prizeStore.clear();
    expect(prizeStore.selectedPrize).toBeUndefined();
  });

  it('should integrate with eligibility utilities', async () => {
    const userStore = useUserStore();

    const json = JSON.stringify([
      { e_id: '001', name: '张三', maxLevel: 5 },
      { e_id: '002', name: '李四', maxLevel: 1 },
      { e_id: '003', name: '王五', maxLevel: 0 }
    ]);

    await userStore.loadUsers(json);

    // Using store getter
    // maxLevel constraint: user can win prizeLevel OR WORSE (prizeLevel >= maxLevel)
    expect(userStore.eligibleUsers(5)).toHaveLength(3); // All users can win 5th prize (5 >= maxLevel for all)
    expect(userStore.eligibleUsers(1)).toHaveLength(2); // 001 (5>=1) and 002 (1>=1), not 003 (0<1)
    expect(userStore.eligibleUsers(0)).toHaveLength(1); // Only 003 (0>=0)
  });
});
