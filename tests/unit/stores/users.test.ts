import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/users';

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should load users from JSON', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' }
    ]);

    await store.loadUsers(json);

    expect(store.users).toHaveLength(2);
    expect(store.users[0].e_id).toBe('001');
    expect(store.users[0].maxLevel).toBeNull(); // Default is null (no restriction)
    expect(store.users[0].isWinner).toBe(false);
  });

  it('should remove duplicate users when loading', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' },
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);

    expect(store.users).toHaveLength(2);
  });

  it('should set default maxLevel to null when not specified', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);

    expect(store.users[0].maxLevel).toBeNull();
  });

  it('should preserve custom maxLevel when specified', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三', maxLevel: 2 }
    ]);

    await store.loadUsers(json);

    expect(store.users[0].maxLevel).toBe(2);
  });

  it('should filter eligible users by prize level', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }, // null, null = can win all
      { e_id: '002', name: '李四', maxLevel: 1 }, // can win 1,2,3,4,5
      { e_id: '003', name: '王五', maxLevel: 4 }  // can win 4,5
    ]);

    await store.loadUsers(json);

    // For level 5 (五等奖): 001 (null), 002 (5>=1), 003 (5>=4) are all eligible
    const eligible5 = store.eligibleUsers(5);
    expect(eligible5).toHaveLength(3);

    // For level 1 (一等奖): 001 (null), 002 (1>=1) are eligible, 003 (1<4) is not
    const eligible1 = store.eligibleUsers(1);
    expect(eligible1).toHaveLength(2);

    // For level 0 (特等奖): only 001 (null) is eligible, 002 (0<1) is not
    const eligible0 = store.eligibleUsers(0);
    expect(eligible0).toHaveLength(1);
  });

  it('should exclude winners from eligible pool', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' }
    ]);

    await store.loadUsers(json);

    store.markAsWinner('001');

    const eligible = store.eligibleUsers(5);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].e_id).toBe('002');
  });

  it('should set user max level', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);

    store.setUserMaxLevel('001', 2);

    expect(store.users[0].maxLevel).toBe(2);
  });

  it('should throw error for invalid maxLevel', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);

    expect(() => store.setUserMaxLevel('001', 10)).toThrow('must be between -1 and 5');
  });

  it('should reset pool', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' },
      { e_id: '002', name: '李四' }
    ]);

    await store.loadUsers(json);
    store.markAsWinner('001');

    expect(store.winnerUsers).toHaveLength(1);

    store.resetPool();

    expect(store.winnerUsers).toHaveLength(0);
    expect(store.users[0].isWinner).toBe(false);
    expect(store.users[1].isWinner).toBe(false);
  });

  it('should get user by ID', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);

    const user = store.getUserById('001');
    expect(user).toBeDefined();
    expect(user?.name).toBe('张三');

    const notFound = store.getUserById('999');
    expect(notFound).toBeUndefined();
  });

  it('should clear all users', async () => {
    const store = useUserStore();
    const json = JSON.stringify([
      { e_id: '001', name: '张三' }
    ]);

    await store.loadUsers(json);
    expect(store.users).toHaveLength(1);

    store.clear();

    expect(store.users).toHaveLength(0);
  });
});
