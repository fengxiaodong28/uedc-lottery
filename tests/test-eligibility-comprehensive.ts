/**
 * 全面测试 minLevel/maxLevel 逻辑
 * 系统性地验证所有 49 种场景组合
 */

// 完整的 49 种测试场景
const testScenarios = [
  // 场景1: 无限制
  { name: "场景1: 无限制", minLevel: null, maxLevel: null, expected: [0, 1, 2, 3, 4, 5] },

  // 场景2-7: 只有 minLevel
  { name: "场景2: minLevel=0 (只能特等)", minLevel: 0, maxLevel: null, expected: [0] },
  { name: "场景3: minLevel=1 (至少一等)", minLevel: 1, maxLevel: null, expected: [0, 1] },
  { name: "场景4: minLevel=2 (至少二等)", minLevel: 2, maxLevel: null, expected: [0, 1, 2] },
  { name: "场景5: minLevel=3 (至少三等)", minLevel: 3, maxLevel: null, expected: [0, 1, 2, 3] },
  { name: "场景6: minLevel=4 (至少四等)", minLevel: 4, maxLevel: null, expected: [0, 1, 2, 3, 4] },
  { name: "场景7: minLevel=5 (至少五等=无限制)", minLevel: 5, maxLevel: null, expected: [0, 1, 2, 3, 4, 5] },

  // 场景8-13: 只有 maxLevel
  { name: "场景8: maxLevel=0 (全部>=0=无限制)", minLevel: null, maxLevel: 0, expected: [0, 1, 2, 3, 4, 5] },
  { name: "场景9: maxLevel=1 (最多一等)", minLevel: null, maxLevel: 1, expected: [1, 2, 3, 4, 5] },
  { name: "场景10: maxLevel=2 (最多二等)", minLevel: null, maxLevel: 2, expected: [2, 3, 4, 5] },
  { name: "场景11: maxLevel=3 (最多三等)", minLevel: null, maxLevel: 3, expected: [3, 4, 5] },
  { name: "场景12: maxLevel=4 (最多四等)", minLevel: null, maxLevel: 4, expected: [4, 5] },
  { name: "场景13: maxLevel=5 (只能五等)", minLevel: null, maxLevel: 5, expected: [5] },

  // 场景14-19: minLevel = maxLevel（单一等级）
  { name: "场景14: minLevel=0, maxLevel=0 (只能特等)", minLevel: 0, maxLevel: 0, expected: [0] },
  { name: "场景15: minLevel=1, maxLevel=1 (只能一等)", minLevel: 1, maxLevel: 1, expected: [1] },
  { name: "场景16: minLevel=2, maxLevel=2 (只能二等)", minLevel: 2, maxLevel: 2, expected: [2] },
  { name: "场景17: minLevel=3, maxLevel=3 (只能三等)", minLevel: 3, maxLevel: 3, expected: [3] },
  { name: "场景18: minLevel=4, maxLevel=4 (只能四等)", minLevel: 4, maxLevel: 4, expected: [4] },
  { name: "场景19: minLevel=5, maxLevel=5 (只能五等)", minLevel: 5, maxLevel: 5, expected: [5] },

  // 场景20-34: minLevel < maxLevel（无效组合，交集为空）
  { name: "场景20: minLevel=0, maxLevel=1 (无效)", minLevel: 0, maxLevel: 1, expected: [] },
  { name: "场景21: minLevel=0, maxLevel=2 (无效)", minLevel: 0, maxLevel: 2, expected: [] },
  { name: "场景22: minLevel=0, maxLevel=3 (无效)", minLevel: 0, maxLevel: 3, expected: [] },
  { name: "场景23: minLevel=0, maxLevel=4 (无效)", minLevel: 0, maxLevel: 4, expected: [] },
  { name: "场景24: minLevel=0, maxLevel=5 (无效)", minLevel: 0, maxLevel: 5, expected: [] },
  { name: "场景25: minLevel=1, maxLevel=2 (无效)", minLevel: 1, maxLevel: 2, expected: [] },
  { name: "场景26: minLevel=1, maxLevel=3 (无效)", minLevel: 1, maxLevel: 3, expected: [] },
  { name: "场景27: minLevel=1, maxLevel=4 (无效)", minLevel: 1, maxLevel: 4, expected: [] },
  { name: "场景28: minLevel=1, maxLevel=5 (无效)", minLevel: 1, maxLevel: 5, expected: [] },
  { name: "场景29: minLevel=2, maxLevel=3 (无效)", minLevel: 2, maxLevel: 3, expected: [] },
  { name: "场景30: minLevel=2, maxLevel=4 (无效)", minLevel: 2, maxLevel: 4, expected: [] },
  { name: "场景31: minLevel=2, maxLevel=5 (无效)", minLevel: 2, maxLevel: 5, expected: [] },
  { name: "场景32: minLevel=3, maxLevel=4 (无效)", minLevel: 3, maxLevel: 4, expected: [] },
  { name: "场景33: minLevel=3, maxLevel=5 (无效)", minLevel: 3, maxLevel: 5, expected: [] },
  { name: "场景34: minLevel=4, maxLevel=5 (无效)", minLevel: 4, maxLevel: 5, expected: [] },

  // 场景35-49: minLevel > maxLevel（有效范围限制）
  { name: "场景35: minLevel=5, maxLevel=0 (全范围)", minLevel: 5, maxLevel: 0, expected: [0, 1, 2, 3, 4, 5] },
  { name: "场景36: minLevel=5, maxLevel=1 (范围1-5)", minLevel: 5, maxLevel: 1, expected: [1, 2, 3, 4, 5] },
  { name: "场景37: minLevel=5, maxLevel=2 (范围2-5)", minLevel: 5, maxLevel: 2, expected: [2, 3, 4, 5] },
  { name: "场景38: minLevel=5, maxLevel=3 (范围3-5)", minLevel: 5, maxLevel: 3, expected: [3, 4, 5] },
  { name: "场景39: minLevel=5, maxLevel=4 (范围4-5)", minLevel: 5, maxLevel: 4, expected: [4, 5] },
  { name: "场景40: minLevel=4, maxLevel=0 (范围0-4)", minLevel: 4, maxLevel: 0, expected: [0, 1, 2, 3, 4] },
  { name: "场景41: minLevel=4, maxLevel=1 (范围1-4)", minLevel: 4, maxLevel: 1, expected: [1, 2, 3, 4] },
  { name: "场景42: minLevel=4, maxLevel=2 (范围2-4)", minLevel: 4, maxLevel: 2, expected: [2, 3, 4] },
  { name: "场景43: minLevel=4, maxLevel=3 (范围3-4)", minLevel: 4, maxLevel: 3, expected: [3, 4] },
  { name: "场景44: minLevel=3, maxLevel=0 (范围0-3)", minLevel: 3, maxLevel: 0, expected: [0, 1, 2, 3] },
  { name: "场景45: minLevel=3, maxLevel=1 (范围1-3)", minLevel: 3, maxLevel: 1, expected: [1, 2, 3] },
  { name: "场景46: minLevel=3, maxLevel=2 (范围2-3)", minLevel: 3, maxLevel: 2, expected: [2, 3] },
  { name: "场景47: minLevel=2, maxLevel=0 (范围0-2)", minLevel: 2, maxLevel: 0, expected: [0, 1, 2] },
  { name: "场景48: minLevel=2, maxLevel=1 (范围1-2)", minLevel: 2, maxLevel: 1, expected: [1, 2] },
  { name: "场景49: minLevel=1, maxLevel=0 (范围0-1)", minLevel: 1, maxLevel: 0, expected: [0, 1] },
];

// 当前代码实现的逻辑
function isUserEligible(user: any, prizeLevel: number): boolean {
  if (user.isWinner) {
    return false;
  }

  // minLevel 约束: 可以中 prizeLevel 或更好
  // 即 prizeLevel 必须 <= minLevel（排除比minLevel更差的等级）
  if (user.minLevel !== null && user.minLevel !== undefined) {
    if (prizeLevel > user.minLevel) {
      return false;
    }
  }

  // maxLevel 约束: 可以中 prizeLevel 或更差
  // 即 prizeLevel 必须 >= maxLevel（排除比maxLevel更好的等级）
  // maxLevel=null 表示无上限
  if (user.maxLevel !== null && user.maxLevel !== undefined) {
    if (prizeLevel < user.maxLevel) {
      return false;
    }
  }

  return true;
}

const prizeNames = ["特等奖", "一等奖", "二等奖", "三等奖", "四等奖", "五等奖"];

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║          minLevel/maxLevel 逻辑全面测试 (49种场景)           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

let passedTests = 0;
let failedTests = 0;

testScenarios.forEach(scenario => {
  const user = { minLevel: scenario.minLevel, maxLevel: scenario.maxLevel, isWinner: false };
  const actual: number[] = [];

  for (let level = 0; level <= 5; level++) {
    if (isUserEligible(user, level)) {
      actual.push(level);
    }
  }

  const passed = JSON.stringify(actual) === JSON.stringify(scenario.expected);
  const status = passed ? "✓ PASS" : "✗ FAIL";

  if (passed) {
    passedTests++;
  } else {
    failedTests++;
  }

  const minStr = scenario.minLevel === null ? "null" : scenario.minLevel;
  const maxStr = scenario.maxLevel === null ? "null" : scenario.maxLevel;

  console.log(`${status} | ${scenario.name}`);
  console.log(`       minLevel=${minStr}, maxLevel=${maxStr}`);
  console.log(`       预期: [${scenario.expected.join(', ')}] ${scenario.expected.length > 0 ? scenario.expected.map(l => prizeNames[l]).join('、') : '无'}`);
  if (!passed) {
    console.log(`       实际: [${actual.join(', ')}] ${actual.length > 0 ? actual.map(l => prizeNames[l]).join('、') : '无'}`);
  }
  console.log();
});

console.log("────────────────────────────────────────────────────────────");
console.log(`测试结果: ${passedTests} 通过, ${failedTests} 失败, 共 ${testScenarios.length} 个测试`);
console.log("────────────────────────────────────────────────────────────");

// 逻辑说明
console.log("\n【逻辑说明】");
console.log("minLevel=n: 至少中n等奖或更好 → prizeLevel <= n");
console.log("maxLevel=n: 最多中n等奖或更差 → prizeLevel >= n");
console.log("可中奖等级 = 两个条件的交集");
console.log("");
console.log("特殊情况:");
console.log("- minLevel=null: 无下限限制");
console.log("- maxLevel=null: 无上限限制");
console.log("- 交集为空: 该用户无法中任何奖（配置错误）");
console.log("- minLevel > maxLevel: 定义中奖范围");
