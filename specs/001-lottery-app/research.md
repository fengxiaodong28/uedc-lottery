# Research: Lottery Application

**Feature**: 001-lottery-app
**Date**: 2026-01-20
**Phase**: 0 - Outline & Research

## Overview

This document consolidates research findings for technical decisions in the lottery application. All "NEEDS CLARIFICATION" items from Technical Context have been resolved through investigation of best practices, technology constraints, and domain requirements.

---

## 1. User Eligibility Constraints

### Decision: Eligibility Level Attribute on User Entity

**User Requirement**: Users can be restricted to specific prize levels (e.g., Zhang San only eligible for 5th prize, Li Si eligible for 4th or 5th, Wang Wu only eligible for 1st/Special). Additionally, a "no-win" pool exists where users cannot win any prize.

**Technical Approach**:
- Add `maxPrizeLevel` property to User entity (number: 0-5, where 0=Special/lowest level, 5=5th prize/highest level number, -1=no-win pool)
- During draw selection, filter eligible pool to only include users where `maxPrizeLevel >= currentPrizeLevel`
- Users in no-win pool have `maxPrizeLevel = -1` and are permanently excluded

**Rationale**:
- Simple numeric comparison enables efficient filtering
- Supports "at or above" semantics naturally (lower level number = higher prize)
- Easy to configure via JSON by setting max eligible prize level per user
- No complex permission system needed for this use case

**Alternatives Considered**:
- Array of eligible levels per user: More flexible but adds JSON complexity; numeric comparison is simpler and sufficient
- Separate "excluded users" list: Doesn't support "max level" constraint; would require manual exclusion after each draw
- Role-based permissions: Over-engineered for simple tier constraints

---

## 2. Drawing Order and Prize Level Selection

### Decision: Manual Prize Level Selection by Organizer

**User Requirement**: Drawing order is random and non-sequential (e.g., 5th, 4th, 3rd, then 5th again, then 2nd). Prize levels can have multiple rounds.

**Technical Approach**:
- Organizer selects which prize level to draw before each draw (via UI button per prize level)
- Each prize level button shows: name, total quantity, remaining count
- SPACE key draws from the currently selected prize level (or prompts selection if none selected)
- No automatic progression through levels - full manual control

**Rationale**:
- Flexibility for event dynamics (organizer can respond to audience reactions)
- Supports multiple rounds of same level without configuration
- Clear visual feedback of remaining quantities per level
- Keyboard shortcut works with explicit selection (SPACE draws from selected level)

**Alternatives Considered**:
- Pre-configured drawing sequence: Less flexible; requires reconfiguration for "one more 5th prize round"
- Automatic level progression: Doesn't support returning to previous levels
- Queue-based system: Over-engineered; adds complexity for simple non-sequential draws

---

## 3. Random Selection Algorithm

### Decision: Fisher-Yates Shuffle with Single Selection

**User Requirement**: Uniform random selection from eligible pool for each draw.

**Technical Approach**:
- For each draw, perform partial Fisher-Yates shuffle on eligible pool array
- Select first element after shuffle
- Ensures O(1) selection time, O(n) shuffle time (acceptable for n=10,000)
- Use `crypto.getRandomValues()` for cryptographically strong randomness (unpredictable)

**Rationale**:
- Fisher-Yates is unbiased (each element has equal probability)
- Single selection optimization avoids full array shuffle
- Cryptographically secure RNG prevents manipulation concerns
- Browser-native API performs well for this scale

**Alternatives Considered**:
- `Math.random()`: Faster but not cryptographically secure; potential predictability concerns
- Reservoir sampling: Useful for k selections, but overkill for single selection
- Weighted random selection: Not needed; all users have equal probability

---

## 4. State Persistence

### Decision: localStorage with Manual Export

**User Requirement**: Maintain state during event; export final results.

**Technical Approach**:
- Pinia stores persist to localStorage on every state change
- Automatic restoration on page reload (event can continue after accidental refresh)
- Manual export to JSON file for final results (FR-015)
- Optional import of previous state (resume event later)

**Rationale**:
- localStorage has 5-10MB limit (sufficient for 10,000 users + winners)
- Instant persistence/recovery without server
- Export provides permanent record and audit trail
- JSON format matches input format for consistency

**Alternatives Considered**:
- IndexedDB: Overkill for this data size; more complex API
- Session storage only: Lost on tab close (too fragile)
- Server persistence: Adds backend requirement; unnecessary for single-event use case

---

## 5. Animation Performance

### Decision: CSS Transforms + Vue Transition Group

**User Requirement**: Visual feedback during drawing process (<2s per draw, 60fps).

**Technical Approach**:
- Use CSS transforms (translate, scale, rotate) for winner reveal animation
- GPU-accelerated properties ensure 60fps
- Vue `<TransitionGroup>` for list animations (winner history)
- Draw animation: 1-2 second "rolling" effect with name shuffling before final selection

**Rationale**:
- CSS transforms are GPU-accelerated (satisfies 60fps requirement)
- Vue's transition system integrates with component lifecycle
- Visual excitement during draw enhances event experience
- 2-second animation fits within SC-002 (2-second draw time budget)

**Alternatives Considered**:
- JavaScript requestAnimationFrame: More control but more complex
- Canvas/WebGL: Overkill for 2D UI animations
- No animation: Meets functional requirement but reduces event engagement

---

## 6. JSON Schema Validation

### Decision: Zod Schema Validation

**User Requirement**: Validate imported JSON files; provide clear error messages.

**Technical Approach**:
- Define Zod schemas for user and prize JSON structures
- Validate on file import before state update
- Extract Zod error messages and format for user-friendly display
- Example schema: `UserSchema = z.object({ e_id: z.string(), name: z.string(), maxLevel: z.number().optional() })`

**Rationale**:
- Zod provides TypeScript type inference (schemas become types)
- Detailed error messages with path to invalid field
- Lightweight (<10KB) compared to heavier alternatives
- Integrates well with Vue 3 + TypeScript ecosystem

**Alternatives Considered**:
- Manual validation: More error-prone; loses type safety
- JSON Schema Draft 7: Standard but requires separate validator library
- Ajv: Popular but heavier; less intuitive TypeScript integration

---

## 7. Keyboard Accessibility

### Decision: VueUse `useKeyboard` Composable

**User Requirement**: SPACE key triggers draw; full keyboard navigation.

**Technical Approach**:
- Use `@vueuse/core`'s `useMagicKeys` or `useKeyboard` for global key listeners
- SPACE key: trigger draw for selected prize level
- Arrow keys: navigate prize level selection
- Enter key: confirm selection
- Escape key: cancel/close modals
- All interactive elements have visible focus indicators

**Rationale**:
- VueUse is lightweight and well-maintained
- Consistent with Vue 3 Composition API style
- Supports keyboard shortcuts without focus requirement
- Meets WCAG 2.1 AA requirement for keyboard operability

**Alternatives Considered**:
- Native `keydown` event listeners: More manual work; doesn't handle key combinations as elegantly
- Hotkeys.js: Additional dependency; VueUse already in project for other utilities

---

## 8. Bundle Size Optimization

### Decision: Code Splitting + Tree Shaking

**User Requirement**: <200KB gzipped initial bundle.

**Technical Approach**:
- Dynamic import for components not needed on initial load
- Pinia stores code-split by feature
- Vite's automatic tree-shaking removes unused code
- Lazy load export functionality (only needed at event end)
- Use vite-plugin-compression for gzip optimization

**Rationale**:
- Vite's rollup-based bundling excellent for code splitting
- Dynamic imports reduce initial payload
- Lottery app has clear feature boundaries (load -> draw -> export)
- 200KB target achievable with modern Vue 3 tree-shaking

**Alternatives Considered**:
- Single bundle: Simpler but exceeds size limit
- External CDN for Vue: Adds network dependency; not offline-capable
- Qwik framework: Too bleeding-edge; larger ecosystem risk

---

## Summary of Technical Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Eligibility | `maxPrizeLevel` attribute | Simple numeric filter, supports "no-win" pool |
| Drawing Order | Manual level selection | Full flexibility for event dynamics |
| Random Selection | Fisher-Yates + crypto RNG | Unpredictable, unbiased, performant |
| State Persistence | localStorage + JSON export | Automatic recovery, permanent record |
| Animation | CSS transforms + Vue transitions | GPU-accelerated 60fps, built-in Vue support |
| Validation | Zod schemas | Type-safe validation, detailed errors |
| Keyboard | VueUse composables | Consistent with Vue 3, lightweight |
| Bundle Size | Code splitting + tree shaking | Meets 200KB target, offline-capable |

---

## Next Steps

Phase 1 will translate these decisions into:
1. Data model with User, Prize, Winner entities and eligibility rules
2. TypeScript interfaces in `contracts/schema.ts`
3. Quickstart guide for setting up Vite + Vue 3 + TypeScript project
