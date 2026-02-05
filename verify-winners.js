import fs from 'fs';

// 读取配置
const config = JSON.parse(fs.readFileSync('src/config/lottery-config.json', 'utf-8'));
const results = fs.readFileSync('results/抽奖结果_2026-02-05.txt', 'utf-8');

// 创建用户映射
const userConstraints = {};
config.users.forEach(u => {
  userConstraints[u.name] = {
    e_id: u.e_id,
    minLevel: u.minLevel,
    maxLevel: u.maxLevel
  };
});

// 解析抽奖结果
const rounds = results.split('第').slice(1).map(round => {
  const lines = round.split('\n');
  const header = lines[0];
  const match = header.match(/奖品: (.+?) \| 数量: (\d+)人/);
  const prizeName = match ? match[1] : '';

  // 确定奖品等级
  let level = 0;
  if (prizeName.includes('特等奖')) level = 0;
  else if (prizeName.includes('一等奖')) level = 1;
  else if (prizeName.includes('二等奖')) level = 2;
  else if (prizeName.includes('三等奖')) level = 3;
  else if (prizeName.includes('四等奖')) level = 4;
  else if (prizeName.includes('五等奖')) level = 5;

  // 解析中奖名单
  const winnersLine = lines.find(l => l.includes('中奖名单:'));
  const winners = winnersLine ? winnersLine.split('中奖名单: ')[1].split('、') : [];

  return { prizeName, level, winners };
});

console.log('验证中奖人员是否符合约束条件:\n');
console.log('等级系统: 0=特等, 1=一等, 2=二等, 3=三等, 4=四等, 5=五等\n');

let allValid = true;

rounds.forEach((round, idx) => {
  console.log(`\n第${idx + 1}轮: ${round.prizeName} (等级${round.level})`);

  round.winners.forEach(winnerName => {
    const constraint = userConstraints[winnerName];
    if (!constraint) {
      console.log(`  ❌ ${winnerName} - 配置文件中未找到此用户!`);
      allValid = false;
      return;
    }

    let valid = true;
    let reason = '';

    // 检查 minLevel 约束
    if (constraint.minLevel !== null && constraint.minLevel !== undefined) {
      if (round.level > constraint.minLevel) {
        valid = false;
        reason = `等级${round.level} > minLevel${constraint.minLevel}`;
      }
    }

    // 检查 maxLevel 约束
    if (valid && constraint.maxLevel !== null && constraint.maxLevel !== undefined) {
      if (round.level < constraint.maxLevel) {
        valid = false;
        reason = `等级${round.level} < maxLevel${constraint.maxLevel}`;
      }
    }

    // 显示约束信息
    const constraintStr =
      (constraint.minLevel !== null && constraint.minLevel !== undefined ? `minLevel:${constraint.minLevel}` : '') +
      (constraint.maxLevel !== null && constraint.maxLevel !== undefined ? ` maxLevel:${constraint.maxLevel}` : '') ||
      '无限制';

    if (valid) {
      console.log(`  ✅ ${winnerName} (${constraint.e_id}) - [${constraintStr}]`);
    } else {
      console.log(`  ❌ ${winnerName} (${constraint.e_id}) - [${constraintStr}] - ${reason}`);
      allValid = false;
    }
  });
});

console.log('\n========================================');
console.log(allValid ? '\n✅ 所有中奖人员都符合约束条件！' : '\n❌ 发现不符合约束条件的中奖者！');
