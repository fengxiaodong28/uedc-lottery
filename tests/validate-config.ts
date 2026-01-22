/**
 * 抽奖配置验证脚本
 *
 * 用于检测当前配置是否存在死锁问题
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

function isUserEligible(user: User, prizeLevel: number): boolean {
  if (user.isWinner) return false;

  if (user.minLevel !== null && user.minLevel !== undefined) {
    if (prizeLevel > user.minLevel) return false;
  }

  if (user.maxLevel !== null && user.maxLevel !== undefined) {
    if (prizeLevel < user.maxLevel) return false;
  }

  return true;
}

function validateConfig(config: LotteryConfig) {
  const users = config.users.map(u => ({ ...u, isWinner: false }));
  const rounds = config.drawRounds;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    抽奖配置验证报告                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('【配置概览】');
  console.log(`  总用户数: ${users.length}`);
  console.log(`  抽奖轮次: ${rounds.length}`);
  const totalWinners = rounds.reduce((sum, r) => sum + r.count, 0);
  console.log(`  中奖名额: ${totalWinners}`);
  console.log('');

  // 分析用户分布
  console.log('【用户等级分布】');
  const levelGroups = new Map<string, User[]>();
  users.forEach(user => {
    const key = `min:${user.minLevel ?? 'null'},max:${user.maxLevel ?? 'null'}`;
    if (!levelGroups.has(key)) levelGroups.set(key, []);
    levelGroups.get(key)!.push(user);
  });

  levelGroups.forEach((groupUsers, key) => {
    console.log(`  ${key}: ${groupUsers.length}人`);
  });
  console.log('');

  // 模拟抽奖
  console.log('【模拟抽奖过程】');
  console.log('══════════════════════════════════════════════════════════════\n');

  let hasError = false;

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex];
    const prizeLevel = round.level;

    // 找出符合条件的用户
    const eligibleUsers = users.filter(u => isUserEligible(u, prizeLevel));
    const needed = round.count;
    const available = eligibleUsers.length;

    // 显示当前轮次信息
    const status = available < needed ? '⚠️ 警告' : available === 0 ? '❌ 错误' : '✅';
    console.log(`${status} 第${roundIndex + 1}轮 | ${round.name}(${round.level}等) | 需要${needed}人 | 可用${available}人`);

    if (available < needed) {
      hasError = true;
      console.log(`    ⚠️ 符合条件用户不足！缺少 ${needed - available} 人`);

      if (eligibleUsers.length > 0 && eligibleUsers.length <= 10) {
        console.log(`    符合条件用户: ${eligibleUsers.map(u => u.name).join(', ')}`);
      } else if (eligibleUsers.length === 0) {
        console.log(`    符合条件用户: 无`);
      }
    }

    // 模拟抽取（随机抽取前 N 个）
    const winners = eligibleUsers.slice(0, Math.min(needed, available));
    for (const winner of winners) {
      const user = users.find(u => u.e_id === winner.e_id);
      if (user) user.isWinner = true;
    }

    if (roundIndex % 5 === 4 || roundIndex === rounds.length - 1) {
      console.log('');
    }
  }

  // 检查未中奖用户
  const neverWinUsers = users.filter(u => !u.isWinner);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  if (neverWinUsers.length > 0) {
    console.log('⚠️ 可能永远无法中奖的用户:');
    neverWinUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.e_id}): min=${u.minLevel}, max=${u.maxLevel}`);
    });
    console.log('');
  }

  // 分析每个用户的可参与轮次
  console.log('【用户资格分析】');
  console.log('══════════════════════════════════════════════════════════════\n');

  const problemUsers: { user: User; eligibleRounds: string[] }[] = [];

  users.forEach(user => {
    const eligibleRounds: string[] = [];
    rounds.forEach((round, index) => {
      if (isUserEligible({ ...user, isWinner: false }, round.level)) {
        eligibleRounds.push(`R${index + 1}${round.name}`);
      }
    });

    const roundsCount = eligibleRounds.length;
    if (roundsCount <= 3) {
      problemUsers.push({ user, eligibleRounds });
    }
  });

  if (problemUsers.length > 0) {
    console.log('⚠️ 资格受限用户（可参与轮次 ≤ 3）:');
    problemUsers.forEach(({ user, eligibleRounds }) => {
      console.log(`  ${user.name}: 可参与 ${eligibleRounds.length} 轮 [${eligibleRounds.join(', ')}]`);
    });
    console.log('');
  }

  // 总结
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        验证结果                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (hasError) {
    console.log('❌ 配置存在问题：某些轮次可能无法正常进行抽奖！');
    console.log('');
    console.log('建议解决方案：');
    console.log('1. 调整抽奖顺序，将有限制用户能参与的轮次提前');
    console.log('2. 减少某些轮次的中奖名额');
    console.log('3. 增加无限制用户的数量');
    console.log('4. 调整用户的等级限制配置');
  } else {
    console.log('✅ 配置验证通过：所有轮次都可以正常进行抽奖');
  }

  console.log('');

  return { hasError, neverWinUsers };
}

// 执行验证
const config = configJson as LotteryConfig;
validateConfig(config);
