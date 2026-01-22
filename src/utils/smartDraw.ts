/**
 * 智能分层抽取算法
 *
 * 问题：如果完全随机抽取，有限制用户可能在他们能参与的轮次中"运气不好"没被抽中，
 * 导致后面的轮次只剩有限制用户，但他们不符合等级要求。
 *
 * 解决方案：分层保护抽取
 * - 在每轮抽取时，将候选池分为两组：无限制用户组、有限制用户组
 * - 对于有限制用户组中符合当前等级的用户，给予"保护名额"
 * - 确保有限制用户在他们能参与的轮次中有更大机会被抽中
 */

import type { User } from '@/types';

interface DrawResult {
  winners: User[];
  stats: {
    totalEligible: number;
    unrestrictedCount: number;
    restrictedCount: number;
    unrestrictedDrawn: number;
    restrictedDrawn: number;
  };
}

/**
 * 智能分层抽取函数
 *
 * @param eligibleUsers 符合当前等级条件的所有用户
 * @param drawCount 需要抽取的人数
 * @param remainingRounds 剩余轮次（用于计算保护比例）
 * @returns 抽取结果和统计信息
 */
export function smartDraw(
  eligibleUsers: User[],
  drawCount: number,
  _remainingRounds: number = 10
): DrawResult {
  // 分组：无限制用户 vs 有限制用户
  // 注意：undefined 和 null 都应该被视为"未设置"，即无限制
  const unrestricted = eligibleUsers.filter(u =>
    (u.minLevel == null || u.minLevel === undefined) &&
    (u.maxLevel == null || u.maxLevel === undefined)
  );
  const restricted = eligibleUsers.filter(u =>
    !((u.minLevel == null || u.minLevel === undefined) &&
      (u.maxLevel == null || u.maxLevel === undefined))
  );

  const stats = {
    totalEligible: eligibleUsers.length,
    unrestrictedCount: unrestricted.length,
    restrictedCount: restricted.length,
    unrestrictedDrawn: 0,
    restrictedDrawn: 0,
  };

  // 如果没有有限制用户，直接随机抽取
  if (restricted.length === 0) {
    const shuffled = shuffleArray([...eligibleUsers]);
    const winners = shuffled.slice(0, drawCount);
    stats.unrestrictedDrawn = winners.length;
    return { winners, stats };
  }

  // 如果有限制用户，使用分层抽取策略
  // 策略：优先抽取有限制用户，确保他们不"错失"机会

  // 计算有限制用户的保护名额
  // 原理：有限制用户能参与的轮次较少，需要在这些轮次中提高他们的中奖概率
  const restrictedRatio = Math.min(0.7, restricted.length / eligibleUsers.length);
  const reservedForRestricted = Math.ceil(drawCount * restrictedRatio);

  // 从有限制用户组中抽取（优先）
  const shuffledRestricted = shuffleArray([...restricted]);
  const restrictedDraw = Math.min(reservedForRestricted, restricted.length, drawCount);
  const winnersFromRestricted = shuffledRestricted.slice(0, restrictedDraw);

  // 剩余名额从无限制用户组中抽取
  const remainingDraw = drawCount - restrictedDraw;
  const shuffledUnrestricted = shuffleArray([...unrestricted]);
  const winnersFromUnrestricted = shuffledUnrestricted.slice(0, remainingDraw);

  const winners = [...winnersFromRestricted, ...winnersFromUnrestricted];

  stats.restrictedDrawn = winnersFromRestricted.length;
  stats.unrestrictedDrawn = winnersFromUnrestricted.length;

  return { winners, stats };
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 纯随机抽取（用于对比）
 */
export function randomDraw(eligibleUsers: User[], drawCount: number): DrawResult {
  const shuffled = shuffleArray([...eligibleUsers]);
  const winners = shuffled.slice(0, Math.min(drawCount, eligibleUsers.length));

  const unrestrictedCount = winners.filter(u =>
    (u.minLevel == null || u.minLevel === undefined) &&
    (u.maxLevel == null || u.maxLevel === undefined)
  ).length;
  const restrictedCount = winners.length - unrestrictedCount;

  return {
    winners,
    stats: {
      totalEligible: eligibleUsers.length,
      unrestrictedCount: eligibleUsers.filter(u =>
        (u.minLevel == null || u.minLevel === undefined) &&
        (u.maxLevel == null || u.maxLevel === undefined)
      ).length,
      restrictedCount: eligibleUsers.length - unrestrictedCount,
      unrestrictedDrawn: unrestrictedCount,
      restrictedDrawn: restrictedCount,
    },
  };
}

/**
 * 分析剩余轮次，预测是否会出现死锁
 */
export function analyzeFutureRounds(
  users: User[],
  currentRound: number,
  totalRounds: number,
  rounds: Array<{ level: number; name: string; count: number }>
): {
  hasRisk: boolean;
  riskRounds: Array<{
    round: number;
    name: string;
    needed: number;
    predictedAvailable: number;
  }>;
} {
  const riskRounds: Array<{
    round: number;
    name: string;
    needed: number;
    predictedAvailable: number;
  }> = [];

  // 模拟未来每轮的情况
  for (let i = currentRound; i < totalRounds; i++) {
    const round = rounds[i];
    const level = round.level;

    // 计算符合该等级的用户数（基于剩余未中奖用户）
    const eligibleCount = users.filter(u => !u.isWinner && isEligibleForLevel(u, level)).length;

    // 预测可用人数（保守估计：假设剩余轮次会消耗一部分用户）
    const remainingRoundsAfterCurrent = totalRounds - i - 1;
    const predictedAvailable = Math.max(0, eligibleCount - remainingRoundsAfterCurrent * 2);

    if (predictedAvailable < round.count) {
      riskRounds.push({
        round: i + 1,
        name: round.name,
        needed: round.count,
        predictedAvailable,
      });
    }
  }

  return {
    hasRisk: riskRounds.length > 0,
    riskRounds,
  };
}

function isEligibleForLevel(user: User, prizeLevel: number): boolean {
  if (user.isWinner) return false;
  if (user.minLevel !== null && user.minLevel !== undefined) {
    if (prizeLevel > user.minLevel) return false;
  }
  if (user.maxLevel !== null && user.maxLevel !== undefined) {
    if (prizeLevel < user.maxLevel) return false;
  }
  return true;
}
