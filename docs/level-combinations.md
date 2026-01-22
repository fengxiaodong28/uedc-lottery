# 等级组合说明文档

## 概述

本文档详细说明抽奖系统中 `minLevel` 和 `maxLevel` 的所有组合规则。

minLevel 有 7 种可能值（null, 0, 1, 2, 3, 4, 5），maxLevel 也有 7 种可能值，总共 **49 种组合场景**。

## 等级定义

| 等级值 | 名称     | 说明       |
|--------|----------|------------|
| 0      | 特等奖   | 最高等级   |
| 1      | 一等奖   | 高等级     |
| 2      | 二等奖   | 中高等级   |
| 3      | 三等奖   | 中等级     |
| 4      | 四等奖   | 中低等级   |
| 5      | 五等奖   | 最低等级   |

## 参数含义

### minLevel（最低中奖等级）

- **含义**: 用户至少能中该等级或更好的奖
- **逻辑**: `prizeLevel <= minLevel`
- **示例**: `minLevel=2` 表示可以中特等、一等、二等奖（等级 0、1、2）
- **null 值**: 无下限限制

### maxLevel（最高中奖等级）

- **含义**: 用户最多能中该等级或更差的奖
- **逻辑**: `prizeLevel >= maxLevel`
- **示例**: `maxLevel=3` 表示可以中三等、四等、五等奖（等级 3、4、5）
- **null 值**: 无上限限制

---

## 全部 49 种组合场景

| 场景 | minLevel | maxLevel | 可中奖等级 | 说明 |
|------|----------|----------|------------|------|
| 1 | null | null | 0,1,2,3,4,5 | 无限制 |
| 2 | 0 | null | 0 | 只能特等奖 |
| 3 | 1 | null | 0,1 | 至少一等奖 |
| 4 | 2 | null | 0,1,2 | 至少二等奖 |
| 5 | 3 | null | 0,1,2,3 | 至少三等奖 |
| 6 | 4 | null | 0,1,2,3,4 | 至少四等奖 |
| 7 | 5 | null | 0,1,2,3,4,5 | 至少五等奖=无限制 |
| 8 | null | 0 | 0,1,2,3,4,5 | 全部>=0 |
| 9 | null | 1 | 1,2,3,4,5 | 最多一等奖 |
| 10 | null | 2 | 2,3,4,5 | 最多二等奖 |
| 11 | null | 3 | 3,4,5 | 最多三等奖 |
| 12 | null | 4 | 4,5 | 最多四等奖 |
| 13 | null | 5 | 5 | 只能五等奖 |
| 14 | 0 | 0 | 0 | 只能特等奖 |
| 15 | 1 | 1 | 1 | 只能一等奖 |
| 16 | 2 | 2 | 2 | 只能二等奖 |
| 17 | 3 | 3 | 3 | 只能三等奖 |
| 18 | 4 | 4 | 4 | 只能四等奖 |
| 19 | 5 | 5 | 5 | 只能五等奖 |
| 20 | 0 | 1 | **无** | 无效：<=0且>=1 |
| 21 | 0 | 2 | **无** | 无效：<=0且>=2 |
| 22 | 0 | 3 | **无** | 无效：<=0且>=3 |
| 23 | 0 | 4 | **无** | 无效：<=0且>=4 |
| 24 | 0 | 5 | **无** | 无效：<=0且>=5 |
| 25 | 1 | 2 | **无** | 无效：<=1且>=2 |
| 26 | 1 | 3 | **无** | 无效：<=1且>=3 |
| 27 | 1 | 4 | **无** | 无效：<=1且>=4 |
| 28 | 1 | 5 | **无** | 无效：<=1且>=5 |
| 29 | 2 | 3 | **无** | 无效：<=2且>=3 |
| 30 | 2 | 4 | **无** | 无效：<=2且>=4 |
| 31 | 2 | 5 | **无** | 无效：<=2且>=5 |
| 32 | 3 | 4 | **无** | 无效：<=3且>=4 |
| 33 | 3 | 5 | **无** | 无效：<=3且>=5 |
| 34 | 4 | 5 | **无** | 无效：<=4且>=5 |
| 35 | 5 | 0 | 0,1,2,3,4,5 | min>max=全范围 |
| 36 | 5 | 1 | 1,2,3,4,5 | 范围1-5 |
| 37 | 5 | 2 | 2,3,4,5 | 范围2-5 |
| 38 | 5 | 3 | 3,4,5 | 范围3-5 |
| 39 | 5 | 4 | 4,5 | 范围4-5 |
| 40 | 4 | 0 | 0,1,2,3,4 | 范围0-4 |
| 41 | 4 | 1 | 1,2,3,4 | 范围1-4 |
| 42 | 4 | 2 | 2,3,4 | 范围2-4 |
| 43 | 4 | 3 | 3,4 | 范围3-4 |
| 44 | 3 | 0 | 0,1,2,3 | 范围0-3 |
| 45 | 3 | 1 | 1,2,3 | 范围1-3 |
| 46 | 3 | 2 | 2,3 | 范围2-3 |
| 47 | 2 | 0 | 0,1,2 | 范围0-2 |
| 48 | 2 | 1 | 1,2 | 范围1-2 |
| 49 | 1 | 0 | 0,1 | 范围0-1 |

---

## 场景分类说明

### 1. 无限制场景（1个）
- 场景1: `null, null`
- 场景7: `5, null`（等价）

### 2. 只有 minLevel 限制（5个：场景2-6）
用户至少能中某个等级或更好的奖

### 3. 只有 maxLevel 限制（6个：场景8-13）
用户最多能中某个等级或更差的奖

### 4. 单一等级（6个：场景14-19）
`minLevel = maxLevel`，只能中特定等级

### 5. 无效组合（15个：场景20-34）
`minLevel < maxLevel`，交集为空，无法中奖

### 6. 范围限制（15个：场景35-49）
`minLevel > maxLevel`，限定中奖范围

---

## 无效组合分析

**场景20-34**（minLevel < maxLevel）⚠️ 交集为空

这种组合导致交集为空，用户无法中任何奖。

例如 `minLevel=0, maxLevel=1`：
- 要求 `prizeLevel <= 0` 且 `prizeLevel >= 1`
- 没有等级能同时满足这两个条件

这在逻辑上是矛盾的，应避免此类配置。

---

## 范围限制组合

**场景35-49**（minLevel > maxLevel）✅ 有效范围

这种组合定义了中奖等级的上下限范围。

例如 `minLevel=4, maxLevel=2`（场景42）：
- 要求 `prizeLevel <= 4` 且 `prizeLevel >= 2`
- 可中奖等级：2, 3, 4

---

## 决策流程图

```
开始
  │
  ├─ minLevel 为 null？
  │    ├─ 是 → minBound = 5
  │    └─ 否 → minBound = minLevel
  │
  ├─ maxLevel 为 null？
  │    ├─ 是 → maxBound = 0
  │    └─ 否 → maxBound = maxLevel
  │
  ├─ 计算交集
  │    └─ eligibleLevels = [level for level in 0..5 if level <= minBound and level >= maxBound]
  │
  └─ eligibleLevels 为空？
       ├─ 是 → ❌ 无法中奖（配置错误）
       └─ 否 → ✓ 可中奖等级 = eligibleLevels
```

---

## 验证规则

```typescript
function isValidCombination(minLevel: number | null, maxLevel: number | null): boolean {
  // minLevel < maxLevel 会导致交集为空，是无效配置
  if (minLevel !== null && maxLevel !== null && minLevel < maxLevel) {
    return false;
  }
  return true;
}

function getEligibleLevels(minLevel: number | null, maxLevel: number | null): number[] {
  const result: number[] = [];
  for (let level = 0; level <= 5; level++) {
    const passesMin = minLevel === null || level <= minLevel;
    const passesMax = maxLevel === null || level >= maxLevel;
    if (passesMin && passesMax) {
      result.push(level);
    }
  }
  return result;
}

// 示例：
// getEligibleLevels(null, null) → [0, 1, 2, 3, 4, 5]
// getEligibleLevels(null, 0)    → [0, 1, 2, 3, 4, 5]
// getEligibleLevels(5, 0)       → [0, 1, 2, 3, 4, 5]
// getEligibleLevels(0, 1)       → [] （交集为空，无效）
// getEligibleLevels(2, 2)       → [2] （单一等级）
// getEligibleLevels(4, 2)       → [2, 3, 4] （范围限制）
```

---

## 注意事项

1. ⚠️ **minLevel < maxLevel** 会导致交集为空，是无效配置，应避免
2. ✅ **minLevel = maxLevel** 表示只能中特定等级
3. ✅ **minLevel > maxLevel** 定义中奖范围，可以正常中奖
4. ✅ **使用 null** 表示该方向无限制
5. 💡 推荐优先使用 `null` 而非 `minLevel > maxLevel` 来表示无限制，配置更清晰
