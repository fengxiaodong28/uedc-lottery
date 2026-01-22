/**
 * 抽奖轮次配置
 * 每个轮次包含具体的奖品信息
 * 从 lottery-config.json 中读取
 */
import configJson from './lottery-config.json';

// 配置文件中的轮次数据类型
interface ConfigDrawRound {
  level: number;
  name: string;
  count: number;
}

// 配置文件的整体类型
interface LotteryConfig {
  users: Array<{
    e_id: string;
    name: string;
    maxLevel?: number;
  }>;
  drawRounds: ConfigDrawRound[];
}

export interface DrawRound {
  level: number;
  name: string;
  count: number;
  remaining: number;
}

export const DRAW_ROUNDS: DrawRound[] = (configJson as LotteryConfig).drawRounds.map(r => ({
  level: r.level,
  name: r.name,
  count: r.count,
  remaining: r.count,
}));

/**
 * 获取当前应该抽取的轮次
 * @param completedCount 已完成的抽奖轮数
 * @returns 轮次配置，如果全部抽完返回 null
 */
export function getCurrentRound(completedCount: number): DrawRound | null {
  if (completedCount >= DRAW_ROUNDS.length) {
    return null;
  }
  return DRAW_ROUNDS[completedCount];
}

/**
 * 获取抽奖顺序总轮数
 */
export function getTotalRounds(): number {
  return DRAW_ROUNDS.length;
}

/**
 * 获取剩余抽奖轮数
 */
export function getRemainingRounds(completedCount: number): number {
  return Math.max(0, DRAW_ROUNDS.length - completedCount);
}

/**
 * 获取指定轮次的奖品等级
 * @param roundIndex 轮次索引
 * @returns 奖品等级，如果轮次不存在返回 null
 */
export function getPrizeLevelByRound(roundIndex: number): number | null {
  if (roundIndex < 0 || roundIndex >= DRAW_ROUNDS.length) {
    return null;
  }
  return DRAW_ROUNDS[roundIndex].level;
}

/**
 * 获取指定轮次的奖品名称
 * @param roundIndex 轮次索引
 * @returns 奖品名称，如果轮次不存在返回 null
 */
export function getPrizeNameByRound(roundIndex: number): string | null {
  if (roundIndex < 0 || roundIndex >= DRAW_ROUNDS.length) {
    return null;
  }
  return DRAW_ROUNDS[roundIndex].name;
}

/**
 * 减少指定轮次的剩余数量
 * @param roundIndex 轮次索引
 */
export function decrementRemaining(roundIndex: number): void {
  if (roundIndex >= 0 && roundIndex < DRAW_ROUNDS.length) {
    const round = DRAW_ROUNDS[roundIndex];
    if (round.remaining > 0) {
      round.remaining--;
    }
  }
}

/**
 * 重置所有轮次的剩余数量
 */
export function resetRemaining(): void {
  DRAW_ROUNDS.forEach(round => {
    round.remaining = round.count;
  });
}

/**
 * 根据中奖者记录恢复剩余数量
 * @param winners 中奖者列表
 */
export function restoreRemainingFromWinners(winners: Array<{ prizeLevel: number; prizeName: string }>): void {
  // 先重置所有剩余数量
  resetRemaining();

  // 按轮次统计每个奖品已抽中的数量
  const awardedByRound: Record<number, number> = {};

  for (const winner of winners) {
    // 找到匹配的轮次（根据 level 和 name）
    for (let i = 0; i < DRAW_ROUNDS.length; i++) {
      const round = DRAW_ROUNDS[i];
      if (round.level === winner.prizeLevel && round.name === winner.prizeName) {
        awardedByRound[i] = (awardedByRound[i] || 0) + 1;
        break;
      }
    }
  }

  // 从剩余数量中减去已抽中的数量
  for (const [roundIndex, awardedCount] of Object.entries(awardedByRound)) {
    const idx = parseInt(roundIndex);
    if (idx >= 0 && idx < DRAW_ROUNDS.length) {
      DRAW_ROUNDS[idx].remaining = Math.max(0, DRAW_ROUNDS[idx].count - awardedCount);
    }
  }
}
