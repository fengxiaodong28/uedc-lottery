import type { User, Winner } from '@/types';

const STORAGE_KEY = 'lottery_app_state';
const STORAGE_VERSION = '1.2';
const DEBOUNCE_MS = 1000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 扩展的持久化状态接口
interface ExtendedPersistedState {
  version: string;
  timestamp: string;
  users: User[];
  winners: Winner[];
  completedRounds: number;
  // 当前是否正在展示结果
  isRevealing: boolean;
  // 当前轮次的中奖者
  currentRoundWinners: Array<{ id: string; name: string }>;
  // 当前轮次的奖品名称
  currentPrizeName: string;
  // drawOrder 中的 remaining 值会由 drawOrder 模块自己管理
}

/**
 * Save state to localStorage with debouncing.
 */
export function saveState(
  users: User[],
  winners: Winner[],
  completedRounds: number,
  isRevealing: boolean,
  currentRoundWinners: Array<{ id: string; name: string }>,
  currentPrizeName: string
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    try {
      const persistData: ExtendedPersistedState = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        users,
        winners,
        completedRounds,
        isRevealing,
        currentRoundWinners,
        currentPrizeName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistData));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, DEBOUNCE_MS);
}

/**
 * Load state from localStorage.
 */
export function loadState(): ExtendedPersistedState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    console.log('📦 Raw localStorage data:', data ? data.substring(0, 200) + '...' : 'null');

    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log('📦 Parsed state:', parsed);

    // 版本迁移：从旧版本升级到新版本
    if (parsed.version !== STORAGE_VERSION) {
      console.log(`Migrating state from version ${parsed.version || 'unknown'} to ${STORAGE_VERSION}`);
      // 迁移：添加缺失的 completedRounds 字段
      if (typeof parsed.completedRounds !== 'number') {
        // 根据 winners 数量推算 completedRounds
        // 每次抽奖的 winners 有相同的 timestamp，按 timestamp 分组
        const rounds = new Set();
        parsed.winners?.forEach((w: Winner) => {
          if (w.timestamp) {
            rounds.add(w.timestamp);
          }
        });
        parsed.completedRounds = rounds.size;
        console.log('📦 Calculated completedRounds:', parsed.completedRounds, 'from', rounds.size, 'unique timestamps');
      }
      // 迁移：添加新字段（v1.2）
      if (typeof parsed.isRevealing !== 'boolean') {
        parsed.isRevealing = false;
      }
      if (!Array.isArray(parsed.currentRoundWinners)) {
        parsed.currentRoundWinners = [];
      }
      if (typeof parsed.currentPrizeName !== 'string') {
        parsed.currentPrizeName = '';
      }
      parsed.version = STORAGE_VERSION;
    }

    // 验证必要字段
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.winners)) {
      console.error('Invalid state format: users or winners is not an array', parsed);
      return null;
    }

    // 确保 completedRounds 是数字
    if (typeof parsed.completedRounds !== 'number') {
      parsed.completedRounds = 0;
    }

    console.log('✅ Final state to restore:', {
      version: parsed.version,
      completedRounds: parsed.completedRounds,
      isRevealing: parsed.isRevealing,
      usersCount: parsed.users.length,
      winnersCount: parsed.winners.length,
    });

    return parsed as ExtendedPersistedState;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
}

/**
 * Clear all persisted state.
 */
export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Force immediate save (bypasses debounce).
 */
export function saveStateImmediate(
  users: User[],
  winners: Winner[],
  completedRounds: number,
  isRevealing: boolean,
  currentRoundWinners: Array<{ id: string; name: string }>,
  currentPrizeName: string
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  try {
    // 详细调试：记录输入数据格式
    console.log('🔍 saveStateImmediate input users:', {
      isArray: Array.isArray(users),
      type: typeof users,
      constructor: users?.constructor?.name,
      keys: users ? Object.keys(users) : null,
      firstItem: Array.isArray(users) ? users[0] : null,
      isPlainObject: users && typeof users === 'object' && !Array.isArray(users),
    });

    // 验证和修复数据格式
    let usersArray: User[];
    if (Array.isArray(users)) {
      usersArray = users;
    } else if (users && typeof users === 'object' && Array.isArray((users as any).users)) {
      // 如果传入的是包含 users 属性的对象，提取数组
      console.warn('⚠️ users is not an array, extracting users.users array');
      usersArray = (users as any).users;
    } else {
      console.error('❌ Invalid users format:', users);
      usersArray = [];
    }

    let winnersArray: Winner[];
    if (Array.isArray(winners)) {
      winnersArray = winners;
    } else if (winners && typeof winners === 'object' && Array.isArray((winners as any).winners)) {
      console.warn('⚠️ winners is not an array, extracting winners.winners array');
      winnersArray = (winners as any).winners;
    } else {
      console.error('❌ Invalid winners format:', winners);
      winnersArray = [];
    }

    const persistData: ExtendedPersistedState = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      users: usersArray,
      winners: winnersArray,
      completedRounds,
      isRevealing,
      currentRoundWinners,
      currentPrizeName,
    };

    // 验证 persistData 结构
    console.log('🔍 persistData structure:', {
      usersIsArray: Array.isArray(persistData.users),
      usersType: typeof persistData.users,
      winnersIsArray: Array.isArray(persistData.winners),
      winnersType: typeof persistData.winners,
      usersFirstItem: persistData.users[0],
    });

    const jsonString = JSON.stringify(persistData);
    console.log('🔍 JSON string length:', jsonString.length);
    console.log('🔍 JSON string preview:', jsonString.substring(0, 300));

    localStorage.setItem(STORAGE_KEY, jsonString);
    console.log('💾 State saved to localStorage:', {
      version: persistData.version,
      completedRounds: persistData.completedRounds,
      isRevealing: persistData.isRevealing,
      usersCount: persistData.users.length,
      winnersCount: persistData.winners.length,
    });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}
