# UEDC 年会抽奖系统

一个基于 Vue 3 + TypeScript 的年会抽奖系统，支持复杂的奖品分配逻辑和用户中奖资格约束。

## 功能特性

- **智能抽奖算法** - 根据用户资格约束自动优化抽奖顺序，确保公平分配
- **灵活的资格配置** - 支持用户 `minLevel` 和 `maxLevel` 约束，精确控制中奖范围
- **实时状态管理** - 使用 Pinia 进行响应式状态管理
- **结果持久化** - 支持本地存储和文件导出
- **完整测试覆盖** - 单元测试、集成测试、边界条件测试
- **中文界面** - 基于 Element Plus 的企业级 UI 组件

## 技术栈

- **前端框架**: Vue 3.4+ (Composition API)
- **构建工具**: Vite 5.x
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **类型检查**: TypeScript 5.x
- **数据校验**: Zod
- **测试框架**: Vitest

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 使用说明

### 奖品等级系统

本系统采用**倒序等级系统**，数字越小代表奖品越好：

| 等级 | 名称 | 说明 |
|------|------|------|
| 0 | 特等奖 | 最高等级 |
| 1 | 一等奖 | 高等级 |
| 2 | 二等奖 | 中高等级 |
| 3 | 三等奖 | 中等级 |
| 4 | 四等奖 | 中低等级 |
| 5 | 五等奖 | 最低等级 |

### 用户资格配置

用户可以通过 `minLevel` 和 `maxLevel` 设置中奖约束：

- **minLevel**: 最低中奖等级（能中该等级或更好的奖）
  - `minLevel=2` 表示可中特等、一等、二等奖（等级 0、1、2）
  - 逻辑: `prizeLevel <= minLevel`

- **maxLevel**: 最高中奖等级（能中该等级或更差的奖）
  - `maxLevel=3` 表示可中三等、四等、五等奖（等级 3、4、5）
  - 逻辑: `prizeLevel >= maxLevel`

#### 配置示例

| minLevel | maxLevel | 可中奖等级 | 说明 |
|----------|----------|------------|------|
| null | null | 0,1,2,3,4,5 | 无限制 |
| 4 | null | 0,1,2,3,4 | 至少四等奖 |
| null | 2 | 2,3,4,5 | 最多二等奖 |
| 4 | 2 | 2,3,4 | 二等至四等奖 |
| 3 | 3 | 3 | 只能三等奖 |

> **注意**: `minLevel < maxLevel` 是无效配置（如 minLevel=0, maxLevel=1），会导致无法中奖。

详细的 49 种组合说明请参考 [docs/level-combinations.md](docs/level-combinations.md)

### 配置文件

抽奖配置位于 `src/config/lottery-config.json`：

```json
{
  "users": [
    {
      "e_id": "001",
      "name": "张三",
      "minLevel": 2,
      "maxLevel": 4
    }
  ],
  "prizes": [
    {
      "level": "0",
      "name": "特等奖",
      "count": "1"
    }
  ]
}
```

## 开发命令

```bash
# 运行所有测试
npm test

# 测试监听模式
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 打开测试 UI
npm run test:ui

# 运行特定测试文件
npx vitest tests/test-smart-draw.ts
```

## 项目结构

```
uedc-lottery/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── SimpleDrawButton.vue      # 抽奖按钮（含智能算法）
│   │   ├── SimplePrizeCard.vue       # 奖品管理和配置
│   │   └── WinnerListDisplay.vue     # 中奖名单展示
│   ├── stores/              # Pinia 状态管理
│   │   ├── draw.ts         # 抽奖轮次状态
│   │   ├── users.ts        # 用户管理
│   │   ├── prizes.ts       # 奖品管理
│   │   └── winners.ts      # 中奖历史
│   ├── config/              # 配置文件
│   │   ├── lottery-config.json       # 用户和奖品配置
│   │   └── drawOrder.ts    # 抽奖顺序逻辑
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   │   ├── smartDraw.ts    # 智能抽奖算法
│   │   ├── validation.ts   # 输入验证
│   │   ├── persistence.ts  # 状态持久化
│   │   └── exportTxt.ts    # 结果导出
│   └── main.ts              # 应用入口
├── tests/                   # 测试文件
├── docs/                    # 文档
└── results/                 # 抽奖结果存储
```

## 智能抽奖算法

系统采用智能抽奖算法，核心原则是：

1. **优先受限用户** - 在特定轮次优先抽取资格受限的用户
2. **公平分配** - 确保所有有资格的用户都有公平的中奖机会
3. **自动轮次管理** - 根据奖品剩余数量自动切换到下一轮次

算法实现详见 `src/utils/smartDraw.ts`

## API 接口

开发模式下，Vite 插件提供以下接口：

- `POST /api/save-result` - 保存抽奖结果到文件
- `GET /api/get-result` - 获取当天的抽奖结果

结果文件按日期存储：`results/抽奖结果_YYYY-MM-DD.txt`

## 测试

项目包含完整的测试套件：

- **单元测试** - 测试各个函数和工具
- **集成测试** - 测试完整的工作流程
- **边界条件测试** - 测试极端情况
- **资格校验测试** - 测试用户资格逻辑

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

ISC
