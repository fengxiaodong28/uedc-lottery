/**
 * 测试无效配置是否会被正确检测并报错
 */

import { isUserEligible, validateUserLevelConfigs } from '../src/types/index';

interface User {
  e_id: string;
  name: string;
  minLevel?: number | null;
  maxLevel?: number | null;
  isWinner?: boolean;
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                    无效配置报错测试                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let failedTests = 0;

// 测试1: minLevel < maxLevel 应该抛出错误
console.log('【测试1】isUserEligible 对无效组合应该抛出错误');
console.log('────────────────────────────────────────────────────────────');
try {
  const invalidUser: User = {
    e_id: 'U001',
    name: '无效用户',
    minLevel: 0,
    maxLevel: 1,
    isWinner: false,
  };
  isUserEligible(invalidUser, 0);
  console.log('❌ 失败: 应该抛出错误但没有');
  failedTests++;
} catch (error) {
  console.log('✅ 通过: 正确抛出错误');
  console.log(`   错误信息: ${(error as Error).message}`);
  passedTests++;
}
console.log('');

// 测试2: validateUserLevelConfigs 应该检测到所有无效配置
console.log('【测试2】validateUserLevelConfigs 应该检测到无效配置');
console.log('────────────────────────────────────────────────────────────');
const invalidUsers: User[] = [
  { e_id: 'U001', name: '用户1', minLevel: 0, maxLevel: 1 },  // 无效: 0 < 1
  { e_id: 'U002', name: '用户2', minLevel: 1, maxLevel: 2 },  // 无效: 1 < 2
  { e_id: 'U003', name: '用户3', minLevel: 2, maxLevel: 3 },  // 无效: 2 < 3
  { e_id: 'U004', name: '有效用户', minLevel: 3, maxLevel: 2 },  // 有效: 3 > 2
  { e_id: 'U005', name: '有效用户2', minLevel: 0, maxLevel: 0 },  // 有效: 0 = 0
];

try {
  validateUserLevelConfigs(invalidUsers);
  console.log('❌ 失败: 应该抛出错误但没有');
  failedTests++;
} catch (error) {
  console.log('✅ 通过: 正确检测到所有无效配置');
  console.log(`   错误信息: ${(error as Error).message}`);
  passedTests++;
}
console.log('');

// 测试3: 全部有效配置应该通过验证
console.log('【测试3】validateUserLevelConfigs 应该接受有效配置');
console.log('────────────────────────────────────────────────────────────');
const validUsers: User[] = [
  { e_id: 'U001', name: '无限制用户', minLevel: null, maxLevel: null },
  { e_id: 'U002', name: '只能特等', minLevel: 0, maxLevel: 0 },
  { e_id: 'U003', name: '只能一等', minLevel: 1, maxLevel: 1 },
  { e_id: 'U004', name: '范围2-4', minLevel: 4, maxLevel: 2 },
  { e_id: 'U005', name: '范围0-1', minLevel: 1, maxLevel: 0 },
];

try {
  validateUserLevelConfigs(validUsers);
  console.log('✅ 通过: 所有有效配置都通过了验证');
  passedTests++;
} catch (error) {
  console.log('❌ 失败: 有效配置被拒绝');
  console.log(`   错误信息: ${(error as Error).message}`);
  failedTests++;
}
console.log('');

// 测试4: 验证所有15种无效组合
console.log('【测试4】验证所有15种无效组合都能被检测');
console.log('────────────────────────────────────────────────────────────');
const invalidCombinations = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 3], [2, 4], [2, 5],
  [3, 4], [3, 5],
  [4, 5]
];

let allInvalidDetected = true;
for (const [minLevel, maxLevel] of invalidCombinations) {
  try {
    const user: User = {
      e_id: `U${minLevel}_${maxLevel}`,
      name: `用户 min=${minLevel} max=${maxLevel}`,
      minLevel,
      maxLevel,
      isWinner: false,
    };
    isUserEligible(user, 0);
    console.log(`❌ minLevel=${minLevel}, maxLevel=${maxLevel}: 没有抛出错误`);
    allInvalidDetected = false;
  } catch (error) {
    // 正确抛出错误
  }
}

if (allInvalidDetected) {
  console.log('✅ 通过: 所有15种无效组合都被正确检测');
  passedTests++;
} else {
  console.log('❌ 失败: 部分无效组合未被检测');
  failedTests++;
}
console.log('');

// 测试5: 验证有效组合不会报错
console.log('【测试5】验证有效组合不会报错');
console.log('────────────────────────────────────────────────────────────');
const validCombinations = [
  [null, null], [0, null], [1, null], [2, null], [3, null], [4, null], [5, null],
  [null, 0], [null, 1], [null, 2], [null, 3], [null, 4], [null, 5],
  [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
  [5, 0], [5, 1], [5, 2], [5, 3], [5, 4],
  [4, 0], [4, 1], [4, 2], [4, 3],
  [3, 0], [3, 1], [3, 2],
  [2, 0], [2, 1],
  [1, 0]
];

let allValidAccepted = true;
for (const [minLevel, maxLevel] of validCombinations) {
  try {
    const user: User = {
      e_id: `U${minLevel}_${maxLevel}`,
      name: `用户 min=${minLevel} max=${maxLevel}`,
      minLevel,
      maxLevel,
      isWinner: false,
    };
    const result = isUserEligible(user, 0);
    // 不应该抛出错误
  } catch (error) {
    console.log(`❌ minLevel=${minLevel}, maxLevel=${maxLevel}: 不应该抛出错误`);
    allValidAccepted = false;
  }
}

if (allValidAccepted) {
  console.log('✅ 通过: 所有有效组合都被接受（共34种有效组合）');
  passedTests++;
} else {
  console.log('❌ 失败: 部分有效组合被拒绝');
  failedTests++;
}
console.log('');

// 总结
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║                        测试结果                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`总测试: 5`);
console.log(`通过: ${passedTests}`);
console.log(`失败: ${failedTests}`);
console.log('');

if (failedTests === 0) {
  console.log('✅✅✅ 所有无效配置测试通过！程序能够正确检测和报错。 ✅✅✅');
} else {
  console.log('❌ 部分测试失败，需要检查错误处理逻辑。');
}
console.log('');
