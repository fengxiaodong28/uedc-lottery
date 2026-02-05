# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UEDC 年会抽奖系统 is a Vue 3 + TypeScript web application for running company annual party lotteries with sophisticated prize distribution logic and eligibility constraints.

## Development Commands

```bash
# Development
npm run dev                 # Start Vite dev server (localhost:5173)

# Build
npm run build              # Type-check + build for production
npm run preview            # Preview production build

# Testing
npm test                   # Run all tests (Vitest)
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
npm run test:ui            # Open Vitest UI

# Run specific test file
npx vitest tests/test-smart-draw.ts
```

## Architecture Overview

This is a **single-page Vue 3 application** with a custom Vite plugin for file persistence. There is no backend - all state is managed client-side with Pinia and persisted to localStorage.

### Key Directories

```
src/
├── components/           # Vue components (decoupled, event-based)
├── stores/              # Pinia stores (draw, users, prizes, winners)
├── config/              # Prize draw order and lottery configuration
├── utils/               # Core business logic (smartDraw, validation, persistence)
├── types/               # TypeScript definitions + Zod schemas
└── config/drawOrder.ts  # Prize round sequencing logic
```

### State Management (Pinia)

- **draw.ts**: Round state, progression through prize levels
- **users.ts**: User management, eligibility tracking
- **prizes.ts**: Prize inventory, remaining counts
- **winners.ts**: Winner history, persistence

State is NOT auto-saved - explicit `saveState()` calls to avoid race conditions.

### Prize Level System (倒序 - Inverted)

```
Level 0 = 特等奖 (Special Prize)   ← Highest/Best
Level 1 = 一等奖 (First Prize)
Level 2 = 二等奖 (Second Prize)
Level 3 = 三等奖 (Third Prize)
Level 4 = 四等奖 (Fourth Prize)
Level 5 = 五等奖 (Fifth Prize)      ← Lowest/Worst
```

**Lower number = Better prize**

### Eligibility Logic (Critical)

Users have `minLevel` and `maxLevel` constraints:

- `minLevel=n`: Can win n OR BETTER → `prizeLevel <= n` (至少中 n 等奖)
- `maxLevel=n`: Can win n OR WORSE → `prizeLevel >= n` (最多中 n 等奖)

**Valid combinations** (可中奖 = 两个约束的交集):
- `minLevel=null, maxLevel=null`: 无限制，可中所有奖项
- `minLevel=3, maxLevel=2`: 可中奖 {2,3} = 二等奖、三等奖 ✓
- `minLevel=4, maxLevel=2`: 可中奖 {2,3,4} = 二等、三等、四等奖 ✓
- `minLevel=2, maxLevel=2`: 可中奖 {2} = 只能二等奖 ✓

**Invalid configuration**: `minLevel < maxLevel` creates empty intersection (throws Error).
- `minLevel=0, maxLevel=1`: 要求 prizeLevel <= 0 且 >= 1，无解 ❌

See `docs/level-combinations.md` for all 49 possible combinations.

### Smart Drawing Algorithm (`src/utils/smartDraw.ts`)

Prioritizes users with limited eligibility in appropriate rounds to ensure fair distribution. Key principle: users who can only win certain prizes get priority in those rounds.

### Custom Vite Plugin

`vite.config.ts` includes `fileSavePlugin()` providing:
- `POST /api/save-result` - Save daily lottery results to `results/抽奖结果_YYYY-MM-DD.txt`
- `GET /api/get-result` - Load current day's results

### Type Safety

- All domain models defined in `src/types/index.ts`
- Zod schemas for runtime validation
- Strict TypeScript mode enabled
- Path alias: `@/` → `src/`

## Testing Setup

- **Vitest** with jsdom environment
- **Test setup**: `tests/setup.ts` (Pinia, localStorage mocked)
- **Coverage**: V8 provider
- Test categories: unit, integration, boundary conditions, smart draw algorithm

## Dependencies

- **Vue 3.4+** with Composition API (`<script setup>`)
- **Pinia** for state management
- **Element Plus** for UI components (Chinese locale)
- **VueUse** for utilities
- **Zod** for validation
- **Vite 5.x** for build tooling

## Common Patterns

### Component Communication
Components are decoupled with clear responsibilities. Use events for parent-child communication, computed properties for derived state.

### Adding New Prize Levels
Modify `PRIZE_LEVELS` in `src/types/index.ts` and update `drawOrder.ts` configuration.

### Debugging Eligibility
Use `isUserEligible()` from `src/types/index.ts` - it throws detailed errors for invalid configurations.
