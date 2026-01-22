# Feature Specification: Lottery Application

**Feature Branch**: `001-lottery-app`
**Created**: 2026-01-20
**Status**: Draft
**Input**: User description: "构建一个抽奖的应用程序，它能够支持我基于已有的用户名单（json格式）和奖品名单（五等奖、四等奖、三等奖、二等奖、一等奖、特等奖）进行抽奖，支持键盘快捷键和鼠标点击操作。能否内置用户在某个抽奖池以内"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load and Configure Lottery Data (Priority: P1)

As an event organizer, I need to load user lists and prize lists so that I can prepare the lottery for an event.

**Why this priority**: This is the foundation - without data loading, no lottery can occur. This is the minimum viable feature.

**Independent Test**: Can be tested by loading a sample JSON file with users and prizes, then verifying the data is correctly parsed and displayed.

**Acceptance Scenarios**:

1. **Given** the application starts, **When** I load a valid user JSON file, **Then** all users are displayed in the eligible pool
2. **Given** a user JSON is loaded, **When** the file contains duplicate user entries, **Then** duplicates are automatically removed
3. **Given** the application starts, **When** I load a prize configuration, **Then** all prize levels and quantities are displayed
4. **Given** an invalid JSON file is selected, **When** I attempt to load it, **Then** a clear error message indicates the specific problem

---

### User Story 2 - Conduct Single Prize Drawing (Priority: P2)

As an event host, I need to draw winners for each prize level using both keyboard shortcuts and mouse clicks so that I can smoothly run the lottery event.

**Why this priority**: This is the core interactive feature that enables the actual lottery drawing during an event.

**Independent Test**: Can be tested by loading sample data, then performing draws using both keyboard and mouse interactions to verify winners are selected correctly.

**Acceptance Scenarios**:

1. **Given** users are loaded and prizes are configured, **When** I press the SPACE key or click the "Draw" button, **Then** a random user is selected from the eligible pool
2. **Given** a user wins a prize, **When** the draw completes, **Then** the winner is removed from the eligible pool for subsequent draws
3. **Given** a prize level has limited quantity, **When** all prizes of that level are awarded, **Then** that prize level is marked as complete and disabled
4. **Given** the eligible pool is empty, **When** I attempt to draw, **Then** a message indicates no eligible users remain

---

### User Story 3 - Display Drawing Results and History (Priority: P3)

As an event organizer, I need to see current results and complete winner history so that I can announce winners and verify fairness.

**Why this priority**: Results display is important for transparency and event management, but the drawing can function without it.

**Independent Test**: Can be tested by performing draws and verifying that winners are displayed prominently and a complete history is maintained.

**Acceptance Scenarios**:

1. **Given** a draw completes, **When** the winner is selected, **Then** the winner's information is displayed prominently on screen
2. **Given** multiple draws occur, **When** I view the results panel, **Then** all winners are listed chronologically by prize level
3. **Given** the event concludes, **When** I export results, **Then** a complete winner list is generated with all prize levels and recipients

---

### User Story 4 - Manage Eligible User Pool (Priority: P2)

As an event organizer, I need to manage which users are in the eligible drawing pool so that I can control who can win each prize.

**Why this priority**: Pool management enables flexible lottery rules - allowing organizers to exclude certain users or create separate drawing rounds.

**Independent Test**: Can be tested by loading users, then adding/removing users from the eligible pool and verifying the pool state changes correctly.

**Acceptance Scenarios**:

1. **Given** users are loaded, **When** I select specific users to exclude from the pool, **Then** those users cannot be selected in subsequent draws
2. **Given** the eligible pool is modified, **When** I view the pool status, **Then** the total eligible count is accurately displayed
3. **Given** I need to reset the pool, **When** I choose to restore all users, **Then** all originally loaded users return to eligible status

---

### Edge Cases

- What happens when all prizes of a specific level are exhausted but draws continue for other levels?
- What happens when the user pool is smaller than the total number of available prizes?
- How does the system handle malformed JSON (missing fields, wrong data types, encoding issues)?
- What happens if the same JSON file is loaded multiple times?
- What happens when a keyboard shortcut is pressed while no data is loaded?
- How does the system handle rapid-fire draws (multiple key presses in quick succession)?
- What happens when the application window loses focus during a keyboard-triggered draw?
- What happens if the prizes list is empty or has zero quantities?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept user lists in JSON format containing user identifiers and display names
- **FR-002**: System MUST parse prize lists with six levels: 五等奖 (5th), 四等奖 (4th), 三等奖 (3rd), 二等奖 (2nd), 一等奖 (1st), 特等奖 (Special)
- **FR-003**: System MUST support keyboard shortcuts (SPACE key) to initiate a prize draw
- **FR-004**: System MUST support mouse click on a "Draw" button to initiate a prize draw
- **FR-005**: System MUST randomly select winners from the eligible user pool with uniform probability
- **FR-006**: System MUST remove winners from the eligible pool after they win a prize
- **FR-007**: System MUST track remaining prize quantities and disable prize levels when exhausted
- **FR-008**: System MUST display the current winner's information prominently after each draw
- **FR-009**: System MUST maintain a chronological history of all winners by prize level
- **FR-010**: System MUST allow organizers to manually exclude/include users from the eligible pool
- **FR-011**: System MUST display the count of eligible users in the current pool
- **FR-012**: System MUST provide visual feedback during the drawing process (e.g., animation, loading state)
- **FR-013**: System MUST validate JSON structure and provide specific error messages for malformed files
- **FR-014**: System MUST prevent duplicate user entries from appearing in the eligible pool
- **FR-015**: System MUST support exporting the complete winner list after the event

### Key Entities

- **User**: Represents a participant in the lottery. Contains identifier (unique), display name, and eligibility status.
- **Prize Level**: Represents a category of prizes (Special, 1st through 5th). Contains level name, total quantity, and remaining quantity.
- **Winner**: Represents a lottery outcome. Links a user to a prize level with a timestamp.
- **Eligible Pool**: Represents the set of users currently available for selection. Dynamically updates as winners are drawn and users are excluded/included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Event organizers can load 10,000 users from JSON and configure all 6 prize levels in under 30 seconds
- **SC-002**: Each prize draw completes within 2 seconds from trigger to winner display
- **SC-003**: 100% of draws produce unique winners (no user can win twice)
- **SC-004**: The system handles rapid successive draws (5 per minute) without errors or performance degradation
- **SC-005**: New users can successfully operate the lottery application with less than 5 minutes of instruction
- **SC-006**: Winner information displays with 100% accuracy (correct user, correct prize level, correct timestamp)
