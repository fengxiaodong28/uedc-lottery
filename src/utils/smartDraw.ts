/**
 * 智能分层抽取算法
 *
 * 问题1：如果完全随机抽取，有限制用户可能在他们能参与的轮次中"运气不好"没被抽中，
 * 导致后面的轮次只剩有限制用户，但他们不符合等级要求。
 *
 * 问题2：如果从低到高抽奖（五等→四等→...→特等），无限制用户会在前期被大量消耗，
 * 导致后期高等级抽奖时无符合条件用户。
 *
 * 问题3：某些用户只能参与特定等级的抽奖（如 maxLevel=5 只能中五等奖），
 * 如果在他们能参与的最后一轮没有被抽中，将永远无法中奖。
 *
 * 解决方案：三向保护抽取
 * - 保护有限制用户：在他们能参与的轮次中优先抽取
 * - 保护无限制用户：为未来高等级轮次预留足够的无限制用户
 * - 保护最后机会用户：强制抽取即将失去资格的用户（这是他们能参与的最后一轮）
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
    reservedForFuture: number;
    lastChanceDrawn: number; // 新增：最后机会用户抽取数量
  };
}

interface FutureRound {
  level: number;
  count: number;
}

/**
 * 智能分层抽取函数（三向保护版本）
 *
 * @param eligibleUsers 符合当前等级条件的所有用户
 * @param drawCount 需要抽取的人数
 * @param allUnclaimedUsers 所有未中奖的用户（用于预测未来需求）
 * @param currentLevel 当前奖品等级
 * @param futureRounds 未来轮次信息
 * @returns 抽取结果和统计信息
 */
export function smartDraw(
  eligibleUsers: User[],
  drawCount: number,
  allUnclaimedUsers: User[],
  currentLevel: number,
  futureRounds: FutureRound[] = []
): DrawResult {
  // 分组：无限制用户 vs 有限制用户
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
    reservedForFuture: 0,
    lastChanceDrawn: 0,
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 优先级1：检测并强制抽取"最后机会"用户
  // ════════════════════════════════════════════════════════════════════════════
  // 最后机会用户：这是他们能参与的最后一轮，如果现在不抽中，将永远无法中奖
  const lastChanceUsers = eligibleUsers.filter(user => {
    // 只考虑有限制用户
    if (user.maxLevel === null || user.maxLevel === undefined) {
      return false;
    }

    // 检查未来是否还有他们能参与的轮次
    const canParticipateInFuture = futureRounds.some(round =>
      isEligibleForLevel(user, round.level)
    );

    // 如果未来没有可参与的轮次，这是最后机会
    return !canParticipateInFuture;
  });

  console.log(`[最后机会检测] 发现 ${lastChanceUsers.length} 个最后机会用户:`,
    lastChanceUsers.map(u => u.name));

  // 如果有最后机会用户，强制抽取他们
  if (lastChanceUsers.length > 0) {
    // 计算能抽取的最后机会用户数量
    // 策略：尽量抽取所有最后机会用户，但不能超过 drawCount
    const lastChanceDraw = Math.min(lastChanceUsers.length, drawCount);

    // 从最后机会用户中随机抽取
    const shuffledLastChance = shuffleArray([...lastChanceUsers]);
    const winnersFromLastChance = shuffledLastChance.slice(0, lastChanceDraw);

    console.log(`[最后机会保护] 强制抽取 ${lastChanceDraw} 个最后机会用户:`,
      winnersFromLastChance.map(u => u.name));

    // 剩余名额按正常逻辑抽取
    const remainingDraw = drawCount - lastChanceDraw;

    if (remainingDraw <= 0) {
      // 如果名额被最后机会用户用完，直接返回
      stats.lastChanceDrawn = lastChanceDraw;
      stats.restrictedDrawn = lastChanceDraw;
      return { winners: winnersFromLastChance, stats };
    }

    // 从剩余用户中抽取
    const remainingEligible = eligibleUsers.filter(u =>
      !winnersFromLastChance.some(w => w.e_id === u.e_id)
    );

    // 递归调用抽取剩余名额（但排除已抽取的最后机会用户）
    const remainingResult = smartDrawRemaining(
      remainingEligible,
      remainingDraw,
      allUnclaimedUsers.filter(u =>
        !winnersFromLastChance.some(w => w.e_id === u.e_id)
      ),
      currentLevel,
      futureRounds
    );

    stats.lastChanceDrawn = lastChanceDraw;
    stats.unrestrictedDrawn = remainingResult.stats.unrestrictedDrawn;
    stats.restrictedDrawn = lastChanceDraw + remainingResult.stats.restrictedDrawn;
    stats.reservedForFuture = remainingResult.stats.reservedForFuture;

    return {
      winners: [...winnersFromLastChance, ...remainingResult.winners],
      stats,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 没有最后机会用户，按正常逻辑抽取
  // ════════════════════════════════════════════════════════════════════════════

  // 如果没有有限制用户，直接随机抽取
  if (restricted.length === 0) {
    // 但仍然需要检查是否需要为未来预留
    const reserveCount = calculateReservedForFuture(
      allUnclaimedUsers,
      currentLevel,
      futureRounds
    );
    const availableForDraw = Math.max(0, unrestricted.length - reserveCount);
    const actualDrawCount = Math.min(drawCount, availableForDraw);

    const shuffled = shuffleArray([...unrestricted]);
    const winners = shuffled.slice(0, actualDrawCount);

    stats.unrestrictedDrawn = winners.length;
    stats.reservedForFuture = reserveCount;
    return { winners, stats };
  }

  // 计算需要为未来预留的无限制用户数量
  const reservedForFuture = calculateReservedForFuture(
    allUnclaimedUsers,
    currentLevel,
    futureRounds
  );

  // 可用的无限制用户数量（扣除预留）
  const availableUnrestricted = Math.max(0, unrestricted.length - reservedForFuture);
  stats.reservedForFuture = reservedForFuture;

  // 计算有限制用户的保护名额
  // 策略：有限制用户能参与的轮次较少，需要在这些轮次中提高他们的中奖概率
  const restrictedRatio = Math.min(0.7, restricted.length / (restricted.length + availableUnrestricted));
  const reservedForRestricted = Math.ceil(drawCount * restrictedRatio);

  // 从有限制用户组中抽取（优先）
  const shuffledRestricted = shuffleArray([...restricted]);
  const restrictedDraw = Math.min(reservedForRestricted, restricted.length, drawCount);
  const winnersFromRestricted = shuffledRestricted.slice(0, restrictedDraw);

  // 剩余名额从无限制用户组中抽取（不超过可用数量）
  const remainingDraw = Math.min(drawCount - restrictedDraw, availableUnrestricted);
  const shuffledUnrestricted = shuffleArray([...unrestricted]);
  const winnersFromUnrestricted = shuffledUnrestricted.slice(0, remainingDraw);

  const winners = [...winnersFromRestricted, ...winnersFromUnrestricted];

  stats.restrictedDrawn = winnersFromRestricted.length;
  stats.unrestrictedDrawn = winnersFromUnrestricted.length;

  return { winners, stats };
}

/**
 * 智能分层抽取函数（剩余名额抽取，不包含最后机会检测）
 */
function smartDrawRemaining(
  eligibleUsers: User[],
  drawCount: number,
  allUnclaimedUsers: User[],
  currentLevel: number,
  futureRounds: FutureRound[] = []
): DrawResult {
  // 分组：无限制用户 vs 有限制用户
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
    reservedForFuture: 0,
    lastChanceDrawn: 0,
  };

  // 如果没有有限制用户，直接随机抽取
  if (restricted.length === 0) {
    const shuffled = shuffleArray([...unrestricted]);
    const winners = shuffled.slice(0, drawCount);
    stats.unrestrictedDrawn = winners.length;
    return { winners, stats };
  }

  // 计算需要为未来预留的无限制用户数量
  const reservedForFuture = calculateReservedForFuture(
    allUnclaimedUsers,
    currentLevel,
    futureRounds
  );

  // 可用的无限制用户数量（扣除预留）
  const availableUnrestricted = Math.max(0, unrestricted.length - reservedForFuture);
  stats.reservedForFuture = reservedForFuture;

  // 计算有限制用户的保护名额
  const restrictedRatio = Math.min(0.7, restricted.length / (restricted.length + availableUnrestricted));
  const reservedForRestricted = Math.ceil(drawCount * restrictedRatio);

  // 从有限制用户组中抽取（优先）
  const shuffledRestricted = shuffleArray([...restricted]);
  const restrictedDraw = Math.min(reservedForRestricted, restricted.length, drawCount);
  const winnersFromRestricted = shuffledRestricted.slice(0, restrictedDraw);

  // 剩余名额从无限制用户组中抽取
  const remainingDraw = Math.min(drawCount - restrictedDraw, availableUnrestricted);
  const shuffledUnrestricted = shuffleArray([...unrestricted]);
  const winnersFromUnrestricted = shuffledUnrestricted.slice(0, remainingDraw);

  const winners = [...winnersFromRestricted, ...winnersFromUnrestricted];

  stats.restrictedDrawn = winnersFromRestricted.length;
  stats.unrestrictedDrawn = winnersFromUnrestricted.length;

  return { winners, stats };
}

/**
 * 计算需要为未来轮次预留的无限制用户数量
 */
function calculateReservedForFuture(
  allUnclaimedUsers: User[],
  currentLevel: number,
  futureRounds: FutureRound[]
): number {
  if (futureRounds.length === 0) {
    return 0;
  }

  // 获取所有无限制用户（包括有 minLevel 限制的用户）
  const allUnrestricted = allUnclaimedUsers.filter(u => {
    const hasMaxLevel = u.maxLevel !== null && u.maxLevel !== undefined;
    return !hasMaxLevel;
  });

  let totalNeeded = 0;

  // 计算未来每个轮次需要的无限制用户数量
  for (const round of futureRounds) {
    const level = round.level;
    const count = round.count;

    // 计算能参与该等级的用户
    const eligibleForFuture = allUnclaimedUsers.filter(u => isEligibleForLevel(u, level));

    // 如果未来轮次等级比当前高（或相等），需要特别关注
    if (level <= currentLevel) {
      // 高等级轮次：计算有多少有限制用户能参与
      const restrictedEligible = eligibleForFuture.filter(u => {
        const hasMaxLevel = u.maxLevel !== null && u.maxLevel !== undefined;
        return hasMaxLevel;
      });

      // 如果有限制用户不够，需要从无限制用户中补充
      const shortage = Math.max(0, count - restrictedEligible.length);
      totalNeeded += shortage;
    }
  }

  // 预留数量不能超过无限制用户总数
  return Math.min(totalNeeded, allUnrestricted.length);
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
      reservedForFuture: 0,
      lastChanceDrawn: 0,
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
