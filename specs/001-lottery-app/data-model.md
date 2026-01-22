# Data Model: Lottery Application

**Feature**: 001-lottery-app
**Date**: 2026-01-20
**Phase**: 1 - Design & Contracts

## Entity Relationship Diagram

```text
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │ Prize Level │       │   Winner    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ e_id (PK)   │──┐    │ level (PK)  │──┐    │ id (PK)     │
│ name        │  │    │ name        │  │    │ userId (FK) │
│ maxLevel    │  └────│ count       │  └────│ prizeLevel  │
│ isWinner    │       │ remaining   │       │ timestamp   │
└─────────────┘       └─────────────┘       │ prizeName   │
                                              │ userName    │
                                              └─────────────┘

Eligible Pool: Derived set of Users where
  isWinner = false AND maxLevel >= currentPrizeLevel
```

---

## Entities

### User

Represents a participant in the lottery. Users can be restricted to specific prize levels.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `e_id` | string | Unique employee identifier | Required, non-empty |
| `name` | string | Display name | Required, non-empty |
| `maxLevel` | number | Maximum eligible prize level (0-5, or -1 for no-win) | Optional, defaults to 5 (all levels) |
| `isWinner` | boolean | Whether user has already won a prize | Computed, defaults to false |

**Prize Level Mapping**:
- `-1`: No-win pool (never eligible)
- `0`: Special prize only (特等奖)
- `1`: First prize and above (一等奖, 特等奖)
- `2`: Second prize and above (二等奖, 一等奖, 特等奖)
- `3`: Third prize and above (三等奖, 二等奖, 一等奖, 特等奖)
- `4`: Fourth prize and above (四等奖, 三等奖, 二等奖, 一等奖, 特等奖)
- `5`: All prizes (五等奖, 四等奖, 三等奖, 二等奖, 一等奖, 特等奖)

**State Transitions**:
```
[Loaded] → [Eligible] → [Winner]
   ↓           ↓
[Excluded] ────────┘
```

**Invariants**:
- `e_id` must be unique across all users
- `maxLevel` must be between -1 and 5
- Once `isWinner = true`, user cannot return to eligible pool
- No-win pool users (`maxLevel = -1`) never transition to Winner

---

### Prize Level

Represents a category of prizes with limited quantity.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `level` | number | Prize level identifier (0-5) | Required, unique |
| `name` | string | Human-readable prize name | Required, non-empty |
| `count` | number | Total quantity of this prize | Required, positive integer |
| `remaining` | number | Prizes still available | Computed from winners |

**Prize Level Mapping** (from user input):
| Level | Name (Chinese) | Name (English) |
|-------|----------------|----------------|
| 0 | 特等奖 | Special Prize |
| 1 | 一等奖 | First Prize |
| 2 | 二等奖 | Second Prize |
| 3 | 三等奖 | Third Prize |
| 4 | 四等奖 | Fourth Prize |
| 5 | 五等奖 | Fifth Prize |

**State Transitions**:
```
[Available] → [In Progress] → [Exhausted]
     ↑              ↓
     └──────────────┘ (if more quantity added)
```

**Invariants**:
- `remaining >= 0` always
- `remaining <= count` always
- When `remaining = 0`, prize level is disabled for drawing

---

### Winner

Represents a lottery outcome linking a user to a prize level.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Unique winner identifier | Required, auto-generated |
| `userId` | string | Reference to User.e_id | Required, must exist |
| `prizeLevel` | number | Prize level won (0-5) | Required, valid level |
| `prizeName` | string | Name of prize won | Required, copied from Prize |
| `userName` | string | Name of winner | Required, copied from User |
| `timestamp` | string | ISO 8601 datetime of draw | Required, auto-generated |

**Invariants**:
- `userId` must be unique in Winner set (no duplicate winners)
- `userId` and `prizeLevel` must match eligibility at draw time
- `timestamp` must be monotonic increasing (chronological order)

---

### Eligible Pool (Derived Set)

Computed set of users available for a specific prize level draw.

**Derivation Rule**:
```typescript
eligiblePool(prizeLevel: number): User[] {
  return allUsers.filter(user =>
    !user.isWinner &&
    user.maxLevel >= prizeLevel
  );
}
```

**Properties**:
- Dynamically computed before each draw
- Empty pool prevents drawing (show error message)
- Count displayed in UI for transparency

---

## Data Structures

### Input JSON: Users

```json
[
  {
    "e_id": "15840",
    "name": "冯小东"
  },
  {
    "e_id": "10385",
    "name": "冯惠雅",
    "maxLevel": 2
  },
  {
    "e_id": "20001",
    "name": "张三",
    "maxLevel": 5
  },
  {
    "e_id": "30001",
    "name": "李四",
    "maxLevel": -1
  }
]
```

**Notes**:
- `maxLevel` is optional (defaults to 5 - eligible for all prizes)
- `maxLevel: -1` places user in no-win pool
- `e_id` must be unique (duplicates are removed during import)

### Input JSON: Prizes

```json
[
  {
    "name": "特等奖-iphone 手机",
    "count": "1",
    "level": "0"
  },
  {
    "name": "一等奖-ipad平板电脑",
    "count": "2",
    "level": "1"
  },
  {
    "name": "五等奖-纪念品",
    "count": "100",
    "level": "5"
  }
]
```

**Notes**:
- `count` and `level` are strings in input (parsed to numbers)
- Prizes can be in any order (sorted by level after import)
- Not all levels need to be present (only configured prizes)

### Output JSON: Winners

```json
{
  "eventDate": "2026-01-20T10:30:00Z",
  "winners": [
    {
      "id": "w001",
      "userId": "15840",
      "userName": "冯小东",
      "prizeLevel": 5,
      "prizeName": "五等奖-纪念品",
      "timestamp": "2026-01-20T10:35:12Z"
    },
    {
      "id": "w002",
      "userId": "10385",
      "userName": "冯惠雅",
      "prizeLevel": 0,
      "prizeName": "特等奖-iphone 手机",
      "timestamp": "2026-01-20T10:42:08Z"
    }
  ],
  "summary": {
    "totalWinners": 2,
    "prizesAwarded": {
      "0": 1,
      "5": 1
    }
  }
}
```

---

## State Management

### Pinia Stores

#### `useUserStore`

**State**:
- `users: User[]` - All loaded users
- `eligibleCount: number` - Computed eligible users for selected prize

**Actions**:
- `loadUsers(json: string): Promise<void>` - Parse and load user JSON
- `setUserMaxLevel(userId: string, maxLevel: number): void` - Update eligibility
- `getUserById(id: string): User | undefined` - Lookup utility

**Getters**:
- `eligibleUsers(prizeLevel: number): User[]` - Filter by eligibility
- `winnerUsers(): User[]` - Users who have won

#### `usePrizeStore`

**State**:
- `prizes: PrizeLevel[]` - All prize levels
- `selectedLevel: number | null` - Currently selected prize for drawing

**Actions**:
- `loadPrizes(json: string): Promise<void>` - Parse and load prize JSON
- `selectLevel(level: number): void` - Set active prize level
- `decrementRemaining(level: number): void` - Update after draw

**Getters**:
- `prizeByLevel(level: number): PrizeLevel | undefined`
- `availableLevels(): PrizeLevel[]` - Only levels with remaining > 0
- `isExhausted(level: number): boolean`

#### `useWinnerStore`

**State**:
- `winners: Winner[]` - Chronological winner list

**Actions**:
- `addWinner(user: User, prize: PrizeLevel): void` - Record new winner
- `exportResults(): string` - Generate JSON output
- `clearHistory(): void` - Reset for new event

**Getters**:
- `winnersByLevel(level: number): Winner[]`
- `winnerUserIds(): Set<string>` - For exclusion from eligible pool
- `totalWinners(): number`

---

## Validation Rules

### User JSON Validation

- Must be valid JSON array
- Each object must have `e_id` (string) and `name` (string)
- `e_id` values must be unique (duplicates removed with warning)
- `maxLevel` (if present) must be integer between -1 and 5
- Empty array is rejected

### Prize JSON Validation

- Must be valid JSON array
- Each object must have `name`, `count`, `level` (all strings)
- `level` must be integer between 0 and 5
- `count` must be positive integer
- Duplicate levels are rejected (ambiguous configuration)

---

## Indexing and Performance

### Fast Lookups

- `User.byEid: Map<string, User>` - O(1) user lookup
- `Winner.byUserId: Set<string>` - O(1) winner check
- `Prize.byLevel: Map<number, PrizeLevel>` - O(1) prize access

### Eligible Pool Computation

- Single array filter per draw: O(n) where n = user count
- Acceptable for n=10,000 (<10ms computation)
- Could optimize with pre-computed buckets if needed

---

## State Persistence

### localStorage Schema

```json
{
  "version": "1.0",
  "timestamp": "2026-01-20T10:00:00Z",
  "users": [...],
  "prizes": [...],
  "winners": [...],
  "selectedLevel": 5
}
```

**Persistence Strategy**:
- Auto-save on every state change (debounced 1s)
- Load on application startup
- Migration support for future schema versions
