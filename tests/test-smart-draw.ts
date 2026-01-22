/**
 * 测试智能分层抽取算法
 *
 * 验证在大奖在后面的情况下，智能分层抽取能否保证有限制用户也能中奖
 */

import configJson from '../src/config/lottery-config.json';

interface User {
  e_id: string;
  name: string;
  minLevel?: number | null;
  maxLevel?: number | null;
  isWinner?: boolean;
}

interface DrawRound {
  level: number;
  name: string;
  count: number;
}

interface LotteryConfig {
  users: User[];
  drawRounds: DrawRound[];
}

function isEligible(user: User, prizeLevel: number): boolean {
  if (user.isWinner) return false;
  if (user.minLevel !== null && user.minLevel !== undefined) {
    if (prizeLevel > user.minLevel) return false;
  }
  if (user.maxLevel !== null && user.maxLevel !== undefined) {
    if (prizeLevel < user.maxLevel) return false;
  }
  return true;
}

function shuffleArray(array: any[]): any[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 智能分层抽取
 */
function smartDraw(eligibleUsers: User[], drawCount: number): User[] {
  const unrestricted = eligibleUsers.filter(u =>
    u.minLevel === null && u.maxLevel === null
  );
  const restricted = eligibleUsers.filter(u =>
    !(u.minLevel === null && u.maxLevel === null)
  );

  // 如果没有有限制用户，直接随机抽取
  if (restricted.length === 0) {
    return shuffleArray([...eligibleUsers]).slice(0, drawCount);
  }

  // 有限制用户保护比例：最多70%的名额给有限制用户
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

  return [...winnersFromRestricted, ...winnersFromUnrestricted];
}

function simulateSmartDraw(config: LotteryConfig) {
  const users = config.users.map(u => ({ ...u, isWinner: false }));
  const rounds = config.drawRounds;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║            智能分层抽取算法模拟测试                            ║');
  console.log('║          (大奖在后面 + 有限制用户保护)                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('【配置概览】');
  console.log(`  总用户数: ${users.length}`);
  console.log(`  抽奖轮次: ${rounds.length}`);
  const totalWinners = rounds.reduce((sum, r) => sum + r.count, 0);
  console.log(`  中奖名额: ${totalWinners}`);
  console.log('');

  // 统计有限制用户
  const restrictedUsers = users.filter(u =>
    !(u.minLevel === null && u.maxLevel === null)
  );
  console.log(`  有限制用户: ${restrictedUsers.length}人`);
  restrictedUsers.forEach(u => {
    console.log(`    - ${u.name}: min=${u.minLevel}, max=${u.maxLevel}`);
  });
  console.log('');

  console.log('【模拟抽奖过程】');
  console.log('══════════════════════════════════════════════════════════════\n');

  let hasError = false;
  const roundDetails: any[] = [];

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    const prizeLevel = round.level;

    // 找出符合条件的用户
    const eligibleUsers = users.filter(u => isEligible(u, prizeLevel));
    const needed = round.count;
    const available = eligibleUsers.length;

    // 统计符合条件用户的分布
    const eligibleUnrestricted = eligibleUsers.filter(u =>
      u.minLevel === null && u.maxLevel === null
    );
    const eligibleRestricted = eligibleUsers.filter(u =>
      !(u.minLevel === null && u.maxLevel === null)
    );

    // 使用智能分层抽取
    const winners = smartDraw(eligibleUsers, needed);

    // 统计实际抽取
    const drawnUnrestricted = winners.filter(u =>
      u.minLevel === null && u.maxLevel === null
    );
    const drawnRestricted = winners.filter(u =>
      !(u.minLevel === null && u.maxLevel === null)
    );

    const status = available < needed ? '⚠️ 警告' : available === 0 ? '❌ 错误' : '✅';

    const detail = {
      round: roundIndex + 1,
      name: round.name,
      needed,
      available,
      eligibleUnrestricted: eligibleUnrestricted.length,
      eligibleRestricted: eligibleRestricted.length,
      drawnUnrestricted: drawnUnrestricted.length,
      drawnRestricted: drawnRestricted.length,
    };
    roundDetails.push(detail);

    console.log(`${status} 第${roundIndex + 1}轮 | ${round.name.padEnd(8)} | 需要${needed}人 | 可用${available}人`);
    console.log(`   符合条件: 无限制${eligibleUnrestricted.length}人, 有限制${eligibleRestricted.length}人`);
    console.log(`   实际抽取: 无限制${drawnUnrestricted.length}人, 有限制${drawnRestricted.length}人`);

    if (available < needed) {
      hasError = true;
      console.log(`   ⚠️ 符合条件用户不足！缺少 ${needed - available} 人`);
    }

    // 标记中奖用户
    for (const winner of winners) {
      const user = users.find(u => u.e_id === winner.e_id);
      if (user) user.isWinner = true;
    }

    console.log('');
  }

  // 统计结果
  const neverWinUsers = users.filter(u => !u.isWinner);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  if (neverWinUsers.length > 0) {
    console.log('⚠️ 未中奖用户:');
    neverWinUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.e_id}): min=${u.minLevel}, max=${u.maxLevel}`);
    });
    console.log('');
  } else {
    console.log('✅ 所有用户都有机会中奖！');
    console.log('');
  }

  // 分析有限制用户的中奖情况
  const restrictedWinners = restrictedUsers.filter(u => u.isWinner);
  console.log('【有限制用户中奖统计】');
  console.log(`  有限制用户总数: ${restrictedUsers.length}人`);
  console.log(`  已中奖: ${restrictedWinners.length}人`);
  console.log(`  未中奖: ${restrictedUsers.length - restrictedWinners.length}人`);
  console.log('');

  // 显示每轮详情
  console.log('【每轮抽取详情】');
  console.log('轮次 | 奖品   | 需要 | 可用 | 符合(无/限) | 抽取(无/限)');
  console.log('------|--------|------|------|-------------|-------------');
  roundDetails.forEach(d => {
    console.log(
      `R${String(d.round).padStart(2)}  | ${d.name.padEnd(6)} | ${String(d.needed).padStart(4)} | ${String(d.available).padStart(4)} | ` +
      `${String(d.eligibleUnrestricted).padStart(2)}/${String(d.eligibleRestricted).padStart(2)}        | ` +
      `${String(d.drawnUnrestricted).padStart(2)}/${String(d.drawnRestricted).padStart(2)}`
    );
  });
  console.log('');

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        测试结果                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (hasError) {
    console.log('❌ 智能分层抽取仍有问题：某些轮次无法正常进行');
  } else {
    console.log('✅ 智能分层抽取成功：所有轮次都可以正常进行抽奖');
    console.log('');
    console.log('策略说明：');
    console.log('- 优先从有限制用户组中抽取（最多70%名额）');
    console.log('- 保证有限制用户在他们能参与的轮次中有机会中奖');
    console.log('- 大奖可以安全地放在后面');
  }

  console.log('');

  return { hasError, neverWinUsers };
}

// 运行测试
const config = configJson as LotteryConfig;
simulateSmartDraw(config);
