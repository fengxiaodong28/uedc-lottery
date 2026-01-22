---

description: "Task list for feature implementation"
---

# Tasks: Lottery Application

**Input**: Design documents from `/specs/001-lottery-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED based on constitution (80% coverage, TDD for complex drawing logic).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below follow the plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Vite + Vue 3 + TypeScript project with `npm create vite@latest . -- --template vue-ts`
- [x] T002 Install dependencies: `npm install pinia @vueuse/core zod`
- [x] T003 [P] Install dev dependencies: `npm install -D vitest @vue/test-utils @types/node`
- [x] T004 [P] Create source directory structure: `src/components`, `src/composables`, `src/stores`, `src/types`, `src/utils`, `tests/unit`, `tests/integration`, `tests/fixtures`
- [x] T005 [P] Configure Vite in `vite.config.ts` with manual chunks (vendor/utils) and test globals
- [x] T006 [P] Configure TypeScript in `tsconfig.json` with path aliases (`@/*`)
- [x] T007 [P] Copy type definitions from `specs/001-lottery-app/contracts/schema.ts` to `src/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create Pinia user store at `src/stores/users.ts` with state (users: User[], eligibleCount: number)
- [x] T009 [P] Create Pinia prize store at `src/stores/prizes.ts` with state (prizes: PrizeLevel[], selectedLevel: number | null)
- [x] T010 [P] Create Pinia winner store at `src/stores/winners.ts` with state (winners: Winner[])
- [x] T011 Add localStorage persistence plugin in `src/utils/persistence.ts` with debounced auto-save (1s)
- [x] T012 Configure Pinia in `src/main.ts` with persistence plugin and create app instance
- [x] T013 [P] Create JSON validation utilities in `src/utils/validation.ts` using Zod schemas (UserInputSchema, PrizeInputSchema)
- [x] T014 [P] Create eligibility utilities in `src/utils/eligibility.ts` (isUserEligible, filterEligibleUsers functions)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Load and Configure Lottery Data (Priority: P1) 🎯 MVP

**Goal**: Enable event organizers to load user and prize data from JSON files and display parsed data.

**Independent Test**: Load sample `tests/fixtures/users.json` and `tests/fixtures/prizes.json`, verify data is correctly parsed, duplicates removed, and displayed in UI.

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T015 [P] [US1] Unit test for user validation in `tests/unit/validation.test.ts` (valid JSON, invalid JSON, duplicate handling)
- [x] T016 [P] [US1] Unit test for prize validation in `tests/unit/validation.test.ts` (valid JSON, invalid JSON, duplicate level handling)
- [x] T017 [P] [US1] Unit test for user store loadUsers action in `tests/unit/stores/users.test.ts`
- [x] T018 [P] [US1] Unit test for prize store loadPrizes action in `tests/unit/stores/prizes.test.ts`
- [x] T019 [US1] Integration test for file import workflow in `tests/integration/import-flow.test.ts`

### Implementation for User Story 1

- [x] T020 [P] [US1] Create useFileImport composable in `src/composables/useFileImport.ts` with loadUsers and loadPrizes functions
- [x] T021 [P] [US1] Implement user store loadUsers action in `src/stores/users.ts` (parse JSON, validate, remove duplicates, update state)
- [x] T022 [P] [US1] Implement prize store loadPrizes action in `src/stores/prizes.ts` (parse JSON, validate, sort by level, update state)
- [x] T023 [US1] Create UserPool component in `src/components/UserPool.vue` to display loaded users with count
- [x] T024 [US1] Create PrizeList component in `src/components/PrizeList.vue` to display prize levels with quantities
- [x] T025 [US1] Create file input UI in `src/App.vue` for users.json and prizes.json with error messages
- [x] T026 [US1] Add error handling and user-friendly messages in `src/composables/useFileImport.ts` for invalid JSON

**Checkpoint**: At this point, User Story 1 should be fully functional - users and prizes can be loaded and displayed.

---

## Phase 4: User Story 2 - Conduct Single Prize Drawing (Priority: P2)

**Goal**: Enable event hosts to draw winners using keyboard (SPACE) and mouse (button click), with winner removal from eligible pool.

**Independent Test**: Load sample data, select prize level, press SPACE and click Draw button - verify random winner selected, removed from pool, and prize quantity decremented.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T027 [P] [US2] Unit test for random selection algorithm in `tests/unit/random.test.ts` (uniform distribution, crypto API usage)
- [ ] T028 [P] [US2] Unit test for eligibility filtering in `tests/unit/eligibility.test.ts` (maxLevel constraints, winner exclusion)
- [ ] T029 [P] [US2] Unit test for draw composable in `tests/unit/composables/useLottery.test.ts`
- [ ] T030 [US2] Integration test for drawing workflow in `tests/integration/draw-flow.test.ts` (full draw sequence)

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement random selection utility in `src/utils/random.ts` using Fisher-Yates shuffle with crypto.getRandomValues()
- [ ] T032 [P] [US2] Create useLottery composable in `src/composables/useLottery.ts` with eligiblePool computed and canDraw getter
- [ ] T033 [P] [US2] Create useKeyboard composable in `src/composables/useKeyboard.ts` with SPACE key listener
- [ ] T034 [US2] Implement drawWinner function in `src/composables/useLottery.ts` (select random, mark as winner, decrement prize)
- [ ] T035 [US2] Implement prize store decrementRemaining action in `src/stores/prizes.ts`
- [ ] T036 [US2] Implement winner store addWinner action in `src/stores/winners.ts`
- [ ] T037 [US2] Create LotteryDraw component in `src/components/LotteryDraw.vue` with Draw button and SPACE key binding
- [ ] T038 [US2] Add prize level selection UI in `src/components/PrizeList.vue` with disabled state for exhausted levels
- [ ] T039 [US2] Add empty pool error handling in `src/components/LotteryDraw.vue` when eligible users = 0
- [ ] T040 [US2] Add rapid-fire draw protection in `src/composables/useLottery.ts` (debounce 500ms between draws)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - can load data and conduct draws.

---

## Phase 5: User Story 4 - Manage Eligible User Pool (Priority: P2)

**Goal**: Enable organizers to manually exclude/include users from eligible pool and reset pool state.

**Independent Test**: Load users, exclude specific users by setting maxLevel, verify they are not in eligible pool; reset pool and verify all users restored.

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T041 [P] [US4] Unit test for user eligibility modification in `tests/unit/stores/users.test.ts`
- [ ] T042 [US4] Integration test for pool management workflow in `tests/integration/pool-management.test.ts`

### Implementation for User Story 4

- [ ] T043 [P] [US4] Implement user store setUserMaxLevel action in `src/stores/users.ts` (update eligibility, validate -1 to 5 range)
- [ ] T044 [US4] Implement user store resetPool action in `src/stores/users.ts` (clear winner status, restore all users)
- [ ] T045 [US4] Add user pool management UI in `src/components/UserPool.vue` with exclude/reset controls
- [ ] T046 [US4] Display eligible count in real-time in `src/components/UserPool.vue` using eligibleCount getter

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently.

---

## Phase 6: User Story 3 - Display Drawing Results and History (Priority: P3)

**Goal**: Display current winner prominently and maintain chronological winner history with export functionality.

**Independent Test**: Perform draws, verify winner displayed prominently; perform multiple draws, verify history shows all winners chronologically; export results and verify JSON format.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T047 [P] [US3] Unit test for winner store exportResults in `tests/unit/stores/winners.test.ts`
- [ ] T048 [US3] Integration test for results display and export in `tests/integration/results.test.ts`

### Implementation for User Story 3

- [ ] T049 [P] [US3] Implement winner store exportResults action in `src/stores/winners.ts` (generate JSON with eventDate, winners array, summary)
- [ ] T050 [P] [US3] Create export utility in `src/utils/export.ts` with JSON file download
- [ ] T051 [US3] Create WinnerDisplay component in `src/components/WinnerDisplay.vue` with prominent winner reveal animation
- [ ] T052 [US3] Create WinnerHistory component in `src/components/WinnerHistory.vue` with chronological list grouped by prize level
- [ ] T053 [US3] Add CSS animations in `src/components/WinnerDisplay.vue` using transforms (60fps target)
- [ ] T054 [US3] Add export button in `src/components/WinnerHistory.vue` with file download trigger
- [ ] T055 [US3] Update LotteryDraw component in `src/components/LotteryDraw.vue` to show WinnerDisplay after draw

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T056 [P] Add responsive CSS in `src/assets/main.css` for mobile/tablet/desktop viewports
- [ ] T057 [P] Add focus indicators in `src/assets/main.css` for keyboard accessibility (WCAG 2.1 AA)
- [ ] T058 [P] Add ARIA labels in components for screen reader support (PrizeList.vue, LotteryDraw.vue, UserPool.vue)
- [ ] T059 [P] Add loading states in `src/components/LotteryDraw.vue` for draw animation (1-2s rolling effect)
- [ ] T060 [P] Code splitting: lazy load WinnerHistory in `src/App.vue` using `defineAsyncComponent`
- [ ] T061 Add color contrast validation in `src/assets/main.css` (minimum 4.5:1 for normal text)
- [ ] T062 [P] Additional unit tests for edge cases in `tests/unit/edge-cases.test.ts` (empty pool, exhausted prizes, rapid draws)
- [ ] T063 Run bundle size analysis with `npm run build -- --mode=analyze` and verify <200KB gzipped
- [ ] T064 Run coverage report with `npm run test:coverage` and verify 80% minimum
- [ ] T065 [P] Update README.md with quickstart instructions from `specs/001-lottery-app/quickstart.md`
- [ ] T066 Manual testing validation: run through quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories (MVP!)
  - **User Story 2 (P2)**: Can start after Foundational - Uses US1 data but independent
  - **User Story 4 (P2)**: Can start after Foundational - Uses US1 data but independent
  - **User Story 3 (P3)**: Depends on US2 (needs winners from draws) - Can integrate after US2
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May consume US1 data but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - May consume US1 data but independently testable
- **User Story 3 (P3)**: Can start after US2 - Requires winner data from draws

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/stores before components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US1, US2, and US4 can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Utilities and stores within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for user validation in tests/unit/validation.test.ts"
Task: "Unit test for prize validation in tests/unit/validation.test.ts"
Task: "Unit test for user store loadUsers action in tests/unit/stores/users.test.ts"
Task: "Unit test for prize store loadPrizes action in tests/unit/stores/prizes.test.ts"

# Launch all implementation tasks for User Story 1 together:
Task: "Create useFileImport composable in src/composables/useFileImport.ts"
Task: "Implement user store loadUsers action in src/stores/users.ts"
Task: "Implement prize store loadPrizes action in src/stores/prizes.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T014)
3. Complete Phase 3: User Story 1 (T015-T026)
4. **STOP and VALIDATE**: Test User Story 1 independently with sample JSON files
5. Deploy/demo if ready (MVP complete!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add Polish (Phase 7) → Final production release
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T015-T026)
   - Developer B: User Story 2 (T027-T040)
   - Developer C: User Story 4 (T041-T046)
3. Developer D: User Story 3 (T047-T055) after US2 completes
4. All converge on Polish phase

---

## Summary

| Phase | Description | Task Count | Story Dependencies |
|-------|-------------|------------|-------------------|
| Phase 1 | Setup | 7 tasks | None |
| Phase 2 | Foundational | 7 tasks | Phase 1 |
| Phase 3 | User Story 1 (P1) | 12 tasks | Phase 2 |
| Phase 4 | User Story 2 (P2) | 14 tasks | Phase 2 |
| Phase 5 | User Story 4 (P2) | 6 tasks | Phase 2 |
| Phase 6 | User Story 3 (P3) | 9 tasks | Phase 2 + US2 |
| Phase 7 | Polish | 12 tasks | All stories |

**Total**: 67 tasks

**Independent Test Criteria**:
- US1: Load JSON files → see data displayed
- US2: Load data → press SPACE/click → see winner, pool updated
- US3: Perform draws → see winner display + history
- US4: Load users → exclude users → see pool change

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 26 tasks for a functional data loading MVP.
