# Quickstart Guide: Lottery Application

**Feature**: 001-lottery-app
**Date**: 2026-01-20
**Tech Stack**: Vite + Vue 3 + TypeScript

---

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Basic knowledge of Vue 3 Composition API and TypeScript

---

## Project Setup

### 1. Initialize Vite + Vue 3 + TypeScript Project

```bash
# Create new Vite project
npm create vite@latest . -- --template vue-ts

# Install dependencies
npm install

# Install additional dependencies
npm install pinia @vueuse/core zod
npm install -D vitest @vue/test-utils @types/node
```

### 2. Configure Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'utils': ['zod', '@vueuse/core'],
        }
      }
    }
  }
});
```

### 3. Create Directory Structure

```bash
# Create source directories
mkdir -p src/components
mkdir -p src/composables
mkdir -p src/stores
mkdir -p src/types
mkdir -p src/utils
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/fixtures
```

### 4. Copy Type Definitions

Copy `specs/001-lottery-app/contracts/schema.ts` to `src/types/index.ts`.

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

Application runs at `http://localhost:5173`.

### Run Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Build for Production

```bash
npm run build
```

Output in `dist/` directory. Verify bundle size:
- Target: <200KB gzipped
- Check with `npm run build -- --report`

---

## Project Structure Reference

```
src/
├── components/           # Vue SFC components
│   ├── LotteryDraw.vue  # Main drawing interface
│   ├── PrizeList.vue    # Prize level selector
│   ├── UserPool.vue     # User pool display
│   ├── WinnerDisplay.vue # Winner reveal
│   └── WinnerHistory.vue # Winner list
├── composables/         # Reusable composition functions
│   ├── useLottery.ts    # Drawing logic
│   ├── useFileImport.ts # JSON import
│   └── useKeyboard.ts   # Keyboard shortcuts
├── stores/              # Pinia stores
│   ├── users.ts         # User state
│   ├── prizes.ts        # Prize state
│   └── winners.ts       # Winner history
├── types/               # TypeScript types (from schema.ts)
│   └── index.ts
├── utils/               # Pure utilities
│   ├── random.ts        # Selection algorithm
│   ├── validation.ts    # Zod schemas
│   └── export.ts        # Results export
├── App.vue
└── main.ts
```

---

## Initial Implementation Order

1. **Foundation** (Phase 1 in tasks.md):
   - Set up Pinia stores (users, prizes, winners)
   - Create type definitions from `contracts/schema.ts`
   - Implement validation utilities

2. **Core Features** (Phase 2-3 in tasks.md):
   - JSON file import (useFileImport composable)
   - User eligibility filtering (useLottery composable)
   - Random selection algorithm (utils/random.ts)

3. **UI Components** (Phase 2-3 in tasks.md):
   - Prize list display and selection
   - User pool visualization
   - Draw button with keyboard/mouse support

4. **Drawing Logic** (Phase 2-3 in tasks.md):
   - Trigger draw (SPACE key or click)
   - Animation and winner reveal
   - Winner removal from eligible pool

5. **Results & Export** (Phase 4 in tasks.md):
   - Winner history display
   - JSON export functionality

---

## Key Development Concepts

### Pinia Store Pattern

```typescript
// src/stores/users.ts
import { defineStore } from 'pinia';
import type { User } from '@/types';

export const useUserStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
  }),
  getters: {
    eligibleUsers: (state) => (prizeLevel: number) => {
      return state.users.filter(u =>
        !u.isWinner && u.maxLevel >= prizeLevel
      );
    },
  },
  actions: {
    async loadUsers(json: string) {
      const parsed = JSON.parse(json);
      this.users = UserInputSchema.parse(parsed);
    },
  },
});
```

### Vue Composable Pattern

```typescript
// src/composables/useLottery.ts
import { computed } from 'vue';
import { useUserStore } from '@/stores/users';
import { usePrizeStore } from '@/stores/prizes';

export function useLottery() {
  const userStore = useUserStore();
  const prizeStore = usePrizeStore();

  const eligiblePool = computed(() => {
    if (prizeStore.selectedLevel === null) return [];
    return userStore.eligibleUsers(prizeStore.selectedLevel);
  });

  const canDraw = computed(() =>
    eligiblePool.value.length > 0 &&
    prizeStore.selectedLevel !== null
  );

  return { eligiblePool, canDraw };
}
```

### Component Usage

```vue
<!-- src/components/LotteryDraw.vue -->
<script setup lang="ts">
import { useLottery } from '@/composables/useLottery';
import { useKeyboard } from '@/composables/useKeyboard';

const { eligiblePool, canDraw } = useLottery();

const draw = () => {
  if (!canDraw.value) return;
  // Select random winner
};

useKeyboard({ ' ': draw }); // SPACE key
</script>

<template>
  <button :disabled="!canDraw" @click="draw">
    Draw Winner ({{ eligiblePool.length }} eligible)
  </button>
</template>
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/random.test.ts
import { describe, it, expect } from 'vitest';
import { selectRandomWinner } from '@/utils/random';

describe('selectRandomWinner', () => {
  it('selects uniformly from pool', () => {
    const pool = [
      { e_id: '1', name: 'A', maxLevel: 5 },
      { e_id: '2', name: 'B', maxLevel: 5 },
    ];

    const winner = selectRandomWinner(pool);

    expect(pool).toContain(winner);
  });
});
```

### Integration Tests

```typescript
// tests/integration/lottery-flow.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '@/stores/users';
import { useLottery } from '@/composables/useLottery';

describe('lottery flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('filters users by prize level', () => {
    const userStore = useUserStore();
    userStore.users = [
      { e_id: '1', name: 'A', maxLevel: 5 },
      { e_id: '2', name: 'B', maxLevel: 1 }, // Only Special/1st
    ];

    const { eligiblePool } = useLottery();
    // Should only include user B for level 1
    expect(eligiblePool.value.length).toBe(1);
  });
});
```

---

## Performance Notes

- Use `shallowRef` for large arrays (10,000 users)
- Debounce localStorage writes (1 second)
- Lazy load WinnerHistory component
- Use `v-memo` for user list rendering

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation task list
2. Implement Phase 1 (Setup) tasks
3. Implement Phase 2 (Foundational) tasks
4. Implement user stories in priority order (P1 → P2 → P3)

---

## Troubleshooting

**Bundle size exceeds 200KB**:
- Check with `npm run build -- --mode=analyze`
- Add code splitting to heavy components
- Remove unused dependencies

**Tests timeout**:
- Increase timeout in `vitest.config.ts`
- Mock expensive operations (file I/O)
- Use `vi.useFakeTimers()` for animation tests

**TypeScript errors**:
- Ensure `contracts/schema.ts` is copied to `src/types/`
- Check `tsconfig.json` includes `@/*` path mapping
