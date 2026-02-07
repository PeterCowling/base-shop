---
Type: Strategic Review
Status: Draft
Domain: Business OS
Created: 2026-01-29
Purpose: Expert review of current state + path to multi-user hosted service
Audience: Strategic advisors, technical architects, product stakeholders
---

# Business OS: Strategic Review & Path Forward

## Executive Summary

**What is Business OS?**
A repo-native Kanban system that coordinates human and AI agent work through git-backed markdown documents. Currently local-only (Pete's machine), Phase 0-2 implementation complete with multi-user UI foundation ready.

**Current State (Jan 2026):**
- ✅ Fully functional local Kanban system
- ✅ Multi-user UI components (user switcher, permissions)
- ✅ Mobile-responsive design
- ✅ Keyboard power-user features
- ⚠️ No authentication (cookie-based dev switching only)
- ⚠️ No hosted deployment (local Next.js dev server)
- ⚠️ Agent workflow is external (Claude Code CLI via skills)

**Critical Questions for Expert Review:**
1. **Multi-user hosting:** How do we transform local git operations into a hosted service while preserving git audit trail?
2. **User-agent coordination:** How can users and agents work together in a genuinely coordinated workflow (not just parallel)?
3. **Authentication & authorization:** What auth model supports both web users and agent API access?
4. **Data consistency:** How do we handle concurrent edits when multiple users + agents write to git simultaneously?
5. **Deployment model:** Self-hosted VM with git, GitHub API commits, or hybrid?

---

## Table of Contents

1. [Current User Workflow](#current-user-workflow)
2. [Current Agent Workflow](#current-agent-workflow)
3. [Technical Architecture](#technical-architecture)
4. [Multi-User Transformation Challenges](#multi-user-transformation-challenges)
5. [User-Agent Coordination Models](#user-agent-coordination-models)
6. [Expert Review Questions](#expert-review-questions)

---

## Current User Workflow

### Phase 0-2: Pete's Local Experience

**User: Pete (Admin)**
**Environment:** Local development (http://localhost:3020)
**Data:** Git repo (`/Users/petercowling/base-shop/`)

### Typical User Journey

#### 1. Capturing Ideas

**UI Entry Points:**
- **Keyboard shortcut:** `Cmd+K` opens Universal Capture modal (works anywhere)
- **FAB (Floating Action Button):** Bottom-right corner (mobile/desktop)
- **Board header:** "+ Capture" button

**Capture Modal:**
- **Business selector:** Choose BRIK, PLAT, or Global
- **Content field:** Markdown textarea
- **Tags field:** Comma-separated tags
- **Submit:** Creates idea file in `docs/business-os/ideas/inbox/{ID}.user.md`

**What happens on submit:**
1. Frontend: React form (`QuickCaptureModal.tsx`) → Server action (`captureIdea`)
2. Backend: Server action calls `RepoWriter.writeIdea()`
3. Git: Creates markdown file with frontmatter in git worktree
4. Commit: `git add`, `git commit` with Pete's identity
5. UI: Success toast, modal closes, board refreshes (if on board page)

**Example created file:**
```markdown
---
Type: Idea
ID: BRIK-OPP-0003
Business: BRIK
Status: Draft
Created-Date: 2026-01-29
Tags: ["mobile", "ux"]
---

# Add offline mode for guide viewing

Users want to access guides without internet connection during travel.
```

#### 2. Working an Idea

**UI Flow:**
1. Navigate to idea detail page: `/ideas/BRIK-OPP-0003`
2. Click "Work Idea" button (Quick Actions sidebar)
3. **Inline editor appears:**
   - Markdown textarea (20 rows)
   - Preview toggle (shows rendered markdown)
   - Save/Cancel buttons

**What happens on save:**
1. Frontend: `IdeaEditorForm.tsx` → `updateIdea` server action
2. Backend: `RepoWriter.updateIdea()` merges content + sets `Status: "worked"`
3. Git: Updates idea file, adds `Last-Updated` field, commits
4. UI: Page refreshes, button changes to "Already Worked" (disabled)

**Idea Lifecycle:**
- **raw** → User can edit via "Work Idea" button
- **worked** → Edit button disabled, ready to convert to card

#### 3. Converting Idea to Card

**UI Flow:**
1. From idea detail page, click "Convert to Card" button
2. **Automatic conversion:**
   - Extracts title from first heading in markdown
   - Generates card ID (BRIK-OPP-0003 → BRIK-003)
   - Creates card in Inbox lane with P2 priority
   - Redirects to new card detail page

**What happens on convert:**
1. Frontend: `ConvertToCardButton.tsx` → `convertToCard` server action
2. Backend:
   - Reads idea content
   - Generates card ID from idea ID
   - Calls `RepoWriter.writeCard()` with idea content
3. Git: Creates card file in `docs/business-os/cards/{ID}.user.md`
4. Redirect: `redirect('/cards/BRIK-003')`

#### 4. Managing Cards on Board

**Board Views:**
- **All lanes:** Default view (7 lanes: Inbox → Reflected)
- **Active work:** In Progress + Blocked lanes only
- **This week:** Due this week + overdue

**UI Features:**
- **Search:** Real-time filter by card ID, title, tags
- **Filter chips:** My Items, Overdue, High Priority, Blocked, Untriaged
- **Lane columns:** Fixed 320px width, horizontal scroll (desktop)
- **Mobile:** Single lane vertical view, bottom tab bar picker

**Card Actions:**
- **Click card:** Navigate to card detail page
- **Keyboard nav:** Click card → Arrow keys navigate, Enter opens, Escape exits
- **Edit card:** Only if you're the owner OR admin (permission check)

#### 5. Editing Cards

**Card Detail Page:**
- **Header:** Back to board, Edit button (conditional), Home button
- **Main content:** Card description (markdown)
- **Stage docs:** Fact-find, Plan, Build, Reflect (if they exist)
- **Metadata sidebar:** Business, Lane, Priority, Owner, Due Date, Tags, Blocked status
- **Quick actions:** Edit Card link (if permitted), Add Comment (coming soon)

**Permission Rules:**
- **Owner:** Can edit their own cards
- **Admins (Pete, Cristiana):** Can edit any card
- **Regular users (Avery):** Can only edit their own cards, see permission message on others

**What happens on edit:**
1. Click "Edit Card" → Navigate to `/cards/{ID}/edit`
2. Edit form (not yet implemented - Phase 3)
3. Server action updates card file
4. Git commit with user identity

#### 6. User Switching (Dev Mode)

**UI Component:** UserSwitcher dropdown (top-right of board header)
- **Hidden in production:** `NODE_ENV === "production"` check
- **Shows current user:** Avatar initial + name + "Admin" badge (if admin)
- **Dropdown options:** Pete, Cristiana, Avery

**What happens on switch:**
1. Click different user in dropdown
2. Sets cookie: `document.cookie = "current_user_id=cristiana"`
3. Reloads page: `window.location.reload()`
4. Server reads cookie on next request: `getCurrentUserServer()`
5. UI updates: Permissions change, "My Items" filter updates, edit buttons appear/disappear

**Current Users:**
- **Pete:** Admin, can edit all cards, sees all archived cards
- **Cristiana:** Admin, same permissions as Pete
- **Avery:** Regular user, can only edit own cards, sees only own archived cards

---

## Current Agent Workflow

### Phase 0-2: Claude Code CLI + Skills

**Agent: Claude Code (Anthropic CLI)**
**Environment:** Terminal, local git repo
**Interface:** Skills system (custom prompts)

### Agent Interaction Model

**Current State:**
- **Agents are external:** Claude Code runs in terminal, reads/writes repo files directly
- **No API:** Business OS Next.js app doesn't expose agent endpoints
- **Git is the API:** Agents interact via git operations on markdown files
- **Skills coordinate:** Custom prompts guide agents through workflows

### Agent Skills for Business OS

#### 1. `/scan-repo` Skill

**Purpose:** Detect changes in `docs/business-os/` and create ideas from findings

**Workflow:**
1. Agent runs: `git diff <last-scan-commit>...HEAD -- docs/business-os/`
2. Parses changed files: Cards, ideas, plans, stage docs
3. Analyzes business relevance:
   - **High:** Card moved to Blocked → Create alert idea
   - **Medium:** Fact-finding complete → Note in scan report
   - **Low:** Typo fixes → Skip
4. Creates idea files for high-relevance findings
5. Updates scan metadata: `docs/business-os/scans/last-scan.json`

**Output:**
- Scan summary (console)
- New ideas in `docs/business-os/ideas/inbox/` (prefixed `SCAN-{BUSINESS}-{N}`)
- Scan history snapshot

**Integration with user workflow:**
- User sees scan-generated ideas on board (Inbox lane)
- User can work/convert these ideas like any other idea
- Agent provides context, user makes decisions

#### 2. `/work-idea` Skill

**Purpose:** Transform raw idea into worked idea with card + initial stage doc

**Workflow:**
1. Agent reads idea: `docs/business-os/ideas/inbox/{ID}.user.md`
2. Generates card frontmatter + content
3. Creates Fact-finding stage doc (if idea needs research)
4. Writes worked idea back with `Status: worked`
5. Optionally converts to card immediately

**Output:**
- Updated idea file (Status: worked)
- Optional: Card file in `docs/business-os/cards/{ID}.user.md`
- Optional: Fact-finding stage doc

**Integration with user workflow:**
- User clicks "Work Idea" button (manual inline edit)
- OR user asks agent `/work-idea {ID}` (agent transforms)
- Both paths lead to same result: worked idea ready to convert

#### 3. `/fact-find` Skill

**Purpose:** Gather evidence and context before planning

**Workflow:**
1. Agent asks user: "What are you trying to understand/build?"
2. Reads relevant repo files, traces dependencies
3. Documents findings in fact-find brief: `docs/plans/{feature-slug}-fact-find.md`
4. Resolves questions through code exploration
5. Provides confidence inputs for planning

**Output:**
- Fact-find brief (markdown)
- Evidence pointers (file paths, line numbers)
- Confidence scores (Implementation, Approach, Impact)

**Integration with user workflow:**
- User starts with vague feature idea
- Agent fact-finds to understand current state
- User reviews brief, provides missing product context
- Agent then plans with full context

#### 4. `/plan-feature` Skill

**Purpose:** Create confidence-gated implementation plan

**Workflow:**
1. Reads fact-find brief (if exists)
2. Studies codebase, runs existing tests
3. Breaks work into atomic tasks with dependencies
4. Assigns confidence scores (min of Implementation, Approach, Impact)
5. Writes plan doc: `docs/plans/{feature-slug}-plan.md`

**Output:**
- Plan document with task breakdown
- Per-task confidence scores (0-100%)
- Test stubs for L-effort tasks (TDD validation)
- Decision log for approach choices

**Integration with user workflow:**
- User asks agent to plan a feature
- Agent creates plan, user reviews
- User approves plan (or requests changes)
- Agent then builds tasks ≥80% confidence

#### 5. `/build-feature` Skill

**Purpose:** Implement tasks from approved plan using TDD

**Workflow:**
1. Reads plan doc, selects next eligible task (≥80% confidence)
2. Writes tests first (TDD)
3. Implements to make tests pass
4. Runs validation (typecheck, lint, tests)
5. Commits changes with task ID in message
6. Updates plan doc with completion status
7. Repeats for next task

**Output:**
- Code changes (commits)
- Test coverage
- Updated plan doc (task status)

**Integration with user workflow:**
- User approves plan
- Agent builds tasks autonomously
- User reviews PRs/commits
- User provides feedback if confidence was wrong

#### 6. `/re-plan` Skill

**Purpose:** Resolve low-confidence tasks through investigation

**Workflow:**
1. Identifies tasks <80% confidence
2. Investigates: Reads files, traces dependencies, runs tests
3. Resolves unknowns through evidence
4. Updates plan doc with findings + new confidence
5. May split task into INVESTIGATE + IMPLEMENT

**Output:**
- Updated plan doc
- Evidence-based confidence updates
- Decision log entries

**Integration with user workflow:**
- Agent hits low-confidence task during build
- Stops, triggers `/re-plan`
- User reviews updated plan
- Agent continues build with higher confidence

### Agent-to-System Communication

**Current Mechanism: Git Operations**

**Agent writes:**
```bash
# 1. Agent creates/updates markdown file
echo "..." > docs/business-os/ideas/inbox/BRIK-OPP-0004.user.md

# 2. Agent commits with identity
git add docs/business-os/ideas/inbox/BRIK-OPP-0004.user.md
git commit -m "idea: add offline guide viewing

Generated by Claude Code /scan-repo skill.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 3. Agent pushes to remote (optional)
git push origin main
```

**System reads:**
```typescript
// Next.js app reads git worktree on page load
const reader = createRepoReader(repoRoot);
const ideas = await reader.queryIdeas({ location: "inbox" });
// Parses markdown frontmatter + content
```

**Key Point:** No API calls, no webhooks. Agent writes files, user sees changes on next page load (or refresh).

---

## Technical Architecture

### UI Layer (Next.js 15 App Router)

#### Pages & Routes

**Board Pages:**
- `/boards/[businessCode]` → Main board view (server component)
  - Fetches cards via `RepoReader.queryCards()`
  - Fetches ideas via `RepoReader.queryIdeas()`
  - Passes data to `BoardView` client component
  - Gets current user via `getCurrentUserServer()`

**Card Pages:**
- `/cards/[id]` → Card detail view (server component)
  - Fetches card via `RepoReader.getCard(id)`
  - Fetches stage docs via `RepoReader.getCardStageDocs(id)`
  - Fetches git history via `getFileHistory()`
  - Passes to `CardDetail` client component with `currentUser`

**Idea Pages:**
- `/ideas/[id]` → Idea detail view (server component)
  - Fetches idea via `RepoReader.getIdea(id)`
  - Renders `WorkIdeaButton` + `ConvertToCardButton` components

**Archive Page:**
- `/archive` → Archived cards view (server component)
  - Fetches all cards with `includeArchived: true`
  - Filters by `card.filePath.includes("/archive/")`
  - Permission-based filtering: `canViewAllArchived(user)`

#### Client Components

**BoardView** (`src/components/board/BoardView.tsx`):
- **State:** Search query, active filters, current view, mobile lane
- **Features:**
  - Search bar (real-time filtering)
  - Filter chips (multi-select with AND logic)
  - Board view switcher (All / Active / This Week)
  - User switcher (dev mode)
  - Keyboard navigation (roving tabindex)
- **Renders:** 7 BoardLane components (or 1 on mobile)

**BoardLane** (`src/components/board/BoardLane.tsx`):
- **Props:** Lane, cards, ideas, showBusinessTag, keyboardNav
- **Features:**
  - Lane header with stats (count, high priority, overdue)
  - Scrollable card list (max-height on desktop)
  - Empty state component
- **Renders:** CompactCard components

**CompactCard** (`src/components/board/CompactCard.tsx`):
- **Link component** to `/cards/{ID}`
- **Visual features:**
  - Priority badge (P0/P1/P2/P3)
  - Owner initials
  - Due date with color coding (overdue = red)
  - Blocked indicator (red border + BLOCKED badge)
  - Business tag (on global board)
  - Focus ring (keyboard navigation)
- **Keyboard support:**
  - `tabIndex` (0 for focused, -1 for others)
  - Arrow keys navigate (via BoardView)
  - Enter opens card detail
  - Auto-scroll into view when focused

**UserSwitcher** (`src/components/user/UserSwitcher.tsx`):
- **Dropdown:** Pete, Cristiana, Avery
- **Shows:** Avatar initial, name, admin badge
- **Action:** Sets cookie + reloads page
- **Hidden in production:** `process.env.NODE_ENV === "production"`

**QuickCaptureModal** (`src/components/capture/QuickCaptureModal.tsx`):
- **Form:** Business selector, content textarea, tags input
- **Validation:** Zod schema (content min 10 chars)
- **Submit:** Calls `captureIdea` server action
- **Opens via:** Cmd+K keyboard shortcut, FAB click, Capture button

**IdeaEditorForm** (`src/components/idea-detail/IdeaEditorForm.tsx`):
- **Form:** Markdown textarea (20 rows)
- **Features:** Preview toggle (shows rendered markdown)
- **Submit:** Calls `updateIdea` server action, sets `Status: worked`
- **Used by:** WorkIdeaButton component

**Mobile Features:**
- **MobileLanePicker:** Bottom tab bar for lane selection
- **Responsive layout:** Single lane vertical, full-width cards
- **Touch-friendly:** 44px minimum touch targets
- **iOS safe area insets:** `paddingBottom: env(safe-area-inset-bottom)`

### UX Patterns

#### Permission-Based UI

**Pattern:** Show/hide UI elements based on `canEditCard(user, card)`

**Example: Card Detail Edit Button**
```tsx
const userCanEdit = canEditCard(currentUser, card);

{userCanEdit && (
  <Link href={`/cards/${card.ID}/edit`}>Edit Card</Link>
)}

{!userCanEdit && (
  <div>Only {card.Owner || "owner"} and admins can edit</div>
)}
```

**Permission Helpers:**
- `canViewAllArchived(user)`: Admins see all archived, users see own
- `canEditCard(user, card)`: Owner or admin can edit

#### Real-Time Filtering

**Pattern:** Client-side filtering with useMemo

**Search Implementation:**
```tsx
const filteredCards = useMemo(() => {
  if (!searchQuery) return cards;

  const query = searchQuery.toLowerCase();
  return cards.filter(card =>
    card.ID?.toLowerCase().includes(query) ||
    card.content.toLowerCase().includes(query) ||
    card.Tags?.some(tag => tag.toLowerCase().includes(query))
  );
}, [cards, searchQuery]);
```

**Filter Chips Implementation:**
```tsx
const activeFilters: FilterType[] = ["myItems", "overdue"];

const filtered = applyFilters(cards, activeFilters, currentUser.name);
// AND logic: card must match ALL active filters
```

**Performance:** <100ms for 50 cards (client-side, no API calls)

#### Keyboard Navigation

**Pattern:** WCAG 2.1 roving tabindex

**Hook:** `useRovingTabindex(grid: string[][])`
- Grid structure: `grid[laneIndex][cardIndex] = cardId`
- State: `focusedId`, `isFocusMode`
- Methods: `focusElement()`, `handleArrowKey()`, `exitFocusMode()`, `getTabIndex()`

**Keyboard Shortcuts:**
- **Cmd+K:** Open capture modal (global)
- **Arrow keys:** Navigate between cards (when focused)
- **Enter:** Open focused card detail
- **Escape:** Exit focus mode (or close modal)

**Focus Management:**
```tsx
// Only focused element has tabIndex={0}
<Link tabIndex={getTabIndex(card.ID)} />

// Others have tabIndex={-1}
<Link tabIndex={-1} />

// Focus ring visible
{isFocused && "ring-2 ring-primary"}
```

#### Optimistic UI

**Pattern:** Server actions + revalidatePath

**Example: Capture Idea**
```tsx
// 1. Submit form (client)
const result = await captureIdea(data);

// 2. Server action creates file + commits
await writer.writeIdea(idea, identity);

// 3. Revalidate board page
revalidatePath(`/boards/${business}`);

// 4. Return success
return { success: true };

// 5. Client shows toast + closes modal
toast.success("Idea captured!");
```

**No explicit loading states:** Next.js handles loading during revalidation

### Backend Layer (Next.js Server Actions + Git)

#### Server Actions

**Purpose:** Server-side mutations with type safety

**Example: `captureIdea`**
```typescript
"use server";

export async function captureIdea(
  data: CaptureFormData
): Promise<CaptureResult> {
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const writer = createRepoWriter(repoRoot);
  const currentUser = getCurrentUser();

  const idea: Idea = {
    ID: generateIdeaId(data.business),
    Business: data.business,
    Status: "raw",
    Tags: data.tags.split(",").map(t => t.trim()).filter(Boolean),
    content: data.content,
  };

  const result = await writer.writeIdea(idea, {
    name: currentUser.name,
    email: currentUser.email,
  });

  if (!result.success) {
    return { success: false, errorKey: result.errorKey };
  }

  revalidatePath(`/boards/${data.business}`);
  return { success: true };
}
```

**Key Points:**
- Runs on server (no client bundle)
- Type-safe (TypeScript + Zod validation)
- Direct file system access
- Git operations synchronous
- Returns serializable results

#### RepoReader (Read Operations)

**Purpose:** Parse markdown files with frontmatter into typed objects

**Implementation:**
```typescript
export function createRepoReader(repoRoot: string) {
  return {
    async getCard(id: string): Promise<Card | null> {
      const filePath = `docs/business-os/cards/${id}.user.md`;
      const content = await readFile(filePath, "utf-8");
      const parsed = matter(content);
      return {
        ...parsed.data,
        content: parsed.content,
        filePath,
      } as Card;
    },

    async queryCards(opts: QueryOptions): Promise<Card[]> {
      const pattern = opts.includeArchived
        ? "docs/business-os/cards/**/*.user.md"
        : "docs/business-os/cards/*.user.md";

      const files = await glob(pattern);
      return Promise.all(files.map(f => this.getCard(extractId(f))));
    },
  };
}
```

**Key Features:**
- Gray-matter for frontmatter parsing
- Glob for file discovery
- Async file I/O (Node.js fs)
- Type-safe return types

#### RepoWriter (Write Operations)

**Purpose:** Write markdown files + git commits atomically

**Implementation:**
```typescript
export function createRepoWriter(repoRoot: string) {
  const worktreePath = `${repoRoot}/.git/worktrees/business-os-store`;
  const git = simpleGit(worktreePath);

  return {
    async writeIdea(
      idea: Idea,
      identity: CommitIdentity
    ): Promise<WriteResult> {
      const filePath = `docs/business-os/ideas/inbox/${idea.ID}.user.md`;

      // 1. Generate markdown
      const content = matter.stringify(idea.content, {
        Type: "Idea",
        ID: idea.ID,
        Business: idea.Business,
        Status: idea.Status,
        "Created-Date": new Date().toISOString().split("T")[0],
        Tags: idea.Tags,
      });

      // 2. Write file
      await writeFile(`${worktreePath}/${filePath}`, content, "utf-8");

      // 3. Git add + commit
      await git.add(filePath);
      const commitResult = await git.commit(
        `idea: ${idea.ID}\n\nCo-Authored-By: ${identity.name} <${identity.email}>`,
        filePath,
        { "--author": `${identity.name} <${identity.email}>` }
      );

      return {
        success: true,
        filePath,
        commitHash: commitResult.commit,
      };
    },
  };
}
```

**Key Features:**
- Git worktree for isolation (work/business-os-store branch)
- Matter for frontmatter serialization
- Atomic file write + git commit
- Identity tracking (author + co-author)
- Error handling with WriteResult type

#### Data Model (Git + Markdown)

**Storage:** Markdown files with YAML frontmatter

**Example Card:**
```markdown
---
Type: Card
ID: BRIK-003
Lane: In progress
Priority: P1
Owner: Pete
Business: BRIK
Title: Add offline mode for guide viewing
Due-Date: 2026-02-15
Tags: ["mobile", "ux", "offline"]
Blocked: false
---

# Offline Guide Viewing

Users want to access guides without internet connection during travel.

## Technical Approach

- Use Service Worker for caching
- IndexedDB for guide storage
- Background sync for updates

## Acceptance Criteria

- [ ] Guides downloadable for offline viewing
- [ ] Works on iOS Safari (PWA)
- [ ] <50MB storage per guide
```

**Frontmatter Fields:**
- **Type:** Card | Idea | Plan | StageDoc
- **ID:** Unique identifier (e.g., BRIK-003)
- **Lane:** Inbox | Fact-finding | Planned | In progress | Blocked | Done | Reflected
- **Priority:** P0 | P1 | P2 | P3
- **Owner:** User name (Pete, Cristiana, Avery)
- **Business:** BRIK | PLAT | Global
- **Status:** (Ideas only) raw | worked
- **Tags:** Array of strings

**File Paths:**
- Cards: `docs/business-os/cards/{ID}.user.md`
- Archived cards: `docs/business-os/cards/archive/{ID}.user.md`
- Ideas (inbox): `docs/business-os/ideas/inbox/{ID}.user.md`
- Ideas (worked): `docs/business-os/ideas/worked/{ID}.user.md`
- Stage docs: `docs/business-os/cards/stages/{CARD-ID}/{stage}.user.md`
- Plans: `docs/business-os/strategy/{BUSINESS}/plan.user.md`

**Git History:**
- Every change is a commit
- Commit messages include task IDs, co-authors
- Full audit trail via `git log`
- File history via `git log --follow {file}`

#### Current User Management

**Phase 0-2: Cookie-based (Dev Only)**

**Implementation:**
```typescript
// Server-side
export async function getCurrentUserServer(): Promise<User> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("current_user_id");

  if (userIdCookie?.value && USERS[userIdCookie.value]) {
    return USERS[userIdCookie.value];
  }

  const userId = process.env.CURRENT_USER_ID || "pete";
  return USERS[userId] || USERS.pete;
}

// Client-side
export function getCurrentUser(): User {
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");
    const userCookie = cookies.find(c => c.trim().startsWith("current_user_id="));
    if (userCookie) {
      const userId = userCookie.split("=")[1];
      if (USERS[userId]) return USERS[userId];
    }
  }

  const userId = process.env.CURRENT_USER_ID || "pete";
  return USERS[userId] || USERS.pete;
}
```

**Predefined Users:**
```typescript
export const USERS: Record<string, User> = {
  pete: {
    id: "pete",
    name: "Pete",
    email: "pete@business-os.local",
    role: "admin",
  },
  cristiana: {
    id: "cristiana",
    name: "Cristiana",
    email: "cristiana@business-os.local",
    role: "admin",
  },
  avery: {
    id: "avery",
    name: "Avery",
    email: "avery@business-os.local",
    role: "user",
  },
};
```

**Limitations:**
- No passwords (cookie can be set by anyone)
- No sessions (stateless)
- No user registration (hardcoded users)
- Dev-only (UserSwitcher hidden in production)

---

## Multi-User Transformation Challenges

### Challenge 1: Git as Database in Hosted Environment

**Current:** Local git repo, direct file I/O
**Problem:** Hosted service can't `git commit` directly to user's repo

**Options:**

**A. Self-Hosted VM with Git Checkout**
- **Pros:** Simplest, keeps existing code
- **Cons:** Not serverless, single point of failure, concurrency issues
- **How:** VM clones repo, Next.js writes files, cron job pushes changes
- **Concurrency:** File locking (flock), git merge conflicts possible

**B. GitHub API for All Writes**
- **Pros:** No git on server, works with serverless
- **Cons:** API rate limits, complex implementation, no local preview
- **How:** Replace `RepoWriter` with GitHub API client
- **Concurrency:** Optimistic locking via commit SHA checks

**C. Hybrid: Database Cache + Git Sync**
- **Pros:** Fast reads (DB), audit trail (git), scalable
- **Cons:** Most complex, eventual consistency, sync failures
- **How:** Write to DB immediately, background job syncs to git
- **Concurrency:** DB transactions, git as backup

**D. Event Sourcing: Command Log → Git**
- **Pros:** True audit trail, replayable, multi-user safe
- **Cons:** Complex architecture, eventual consistency
- **How:** Commands go to queue, worker applies to git serially
- **Concurrency:** Queue ensures serial git operations

### Challenge 2: Concurrent Edits

**Scenario:** Pete and Cristiana both edit BRIK-003 simultaneously

**Current (Local):**
- Not possible (single user)

**Hosted Options:**

**A. Last Write Wins**
- **Pros:** Simple
- **Cons:** Data loss, user frustration
- **Implementation:** `updateCard` server action, no conflict detection

**B. Optimistic Locking (Version Numbers)**
- **Pros:** Prevents overwrites
- **Cons:** User must retry on conflict
- **Implementation:**
  ```typescript
  interface Card {
    version: number; // Increments on each edit
  }

  async function updateCard(id: string, updates: Partial<Card>, expectedVersion: number) {
    const current = await getCard(id);
    if (current.version !== expectedVersion) {
      throw new ConflictError("Card was modified by another user");
    }
    await writeCard({ ...current, ...updates, version: current.version + 1 });
  }
  ```

**C. Operational Transformation (Real-Time)**
- **Pros:** True real-time collaboration (Google Docs style)
- **Cons:** Very complex, requires WebSocket server
- **Implementation:** Y.js or Automerge library

**D. Field-Level Locking**
- **Pros:** Granular, less conflicts
- **Cons:** Complex UI (show who's editing what)
- **Implementation:** Lock `card.Lane` while Pete is moving it

**Recommendation:** Start with **Optimistic Locking (B)**, add **Real-Time (C)** later if needed.

### Challenge 3: Authentication & Authorization

**Current:** Cookie-based, no passwords, hardcoded users

**Requirements for Hosted:**
1. Secure login (passwords or OAuth)
2. User registration
3. Role-based permissions (admin vs user)
4. API access for agents (not just web UI)

**Options:**

**A. NextAuth.js (OAuth + Magic Links)**
- **Pros:** Standard, supports Google/GitHub OAuth, magic links (passwordless)
- **Cons:** Requires session storage (DB or Redis)
- **User flow:**
  1. User clicks "Sign in with Google"
  2. OAuth flow, token stored in session
  3. `getCurrentUserServer()` reads session
- **Agent access:** API keys separate from user sessions

**B. Supabase Auth**
- **Pros:** Built-in user management, row-level security, real-time
- **Cons:** Vendor lock-in, adds Supabase dependency
- **User flow:**
  1. Email + password signup
  2. Supabase manages JWT tokens
  3. Next.js middleware validates tokens
- **Agent access:** Service role keys

**C. Custom JWT Auth**
- **Pros:** Full control, no dependencies
- **Cons:** Must implement password hashing, token refresh, rate limiting
- **User flow:**
  1. Email + password signup
  2. Server generates JWT
  3. Client stores JWT in httpOnly cookie
- **Agent access:** Same JWT system, different scopes

**Recommendation:** **NextAuth.js (A)** for ease + OAuth, **API keys** for agent access.

### Challenge 4: Agent API Access

**Current:** Agents write files directly via git
**Problem:** Hosted agents can't access file system

**Requirements:**
1. Agents must create/update cards, ideas, plans
2. Agents must read current state (all cards, dependencies)
3. Agents must commit with proper identity (co-author)
4. Agents must respect user permissions (can't edit Pete's cards as Avery)

**API Design Options:**

**A. REST API (Traditional)**
- **Endpoints:**
  - `POST /api/ideas` - Create idea
  - `PATCH /api/cards/:id` - Update card
  - `GET /api/cards` - List cards
- **Auth:** Bearer token in header (`Authorization: Bearer {api_key}`)
- **Implementation:**
  ```typescript
  // app/api/cards/[id]/route.ts
  export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
    const agent = await validateApiKey(apiKey); // Returns agent identity

    const updates = await req.json();
    const result = await updateCard(params.id, updates, agent);

    return Response.json(result);
  }
  ```

**B. GraphQL API**
- **Pros:** Single endpoint, flexible queries, real-time subscriptions
- **Cons:** More complex setup
- **Schema:**
  ```graphql
  type Mutation {
    createIdea(input: CreateIdeaInput!): Idea!
    updateCard(id: ID!, input: UpdateCardInput!): Card!
  }

  type Query {
    cards(filter: CardFilter): [Card!]!
    card(id: ID!): Card
  }
  ```

**C. tRPC (Type-Safe RPC)**
- **Pros:** Full TypeScript type safety, no code generation
- **Cons:** Newer, less tooling
- **Implementation:**
  ```typescript
  // server/routers/cards.ts
  export const cardsRouter = router({
    update: protectedProcedure
      .input(z.object({ id: z.string(), updates: cardUpdateSchema }))
      .mutation(async ({ input, ctx }) => {
        return await updateCard(input.id, input.updates, ctx.agent);
      }),
  });
  ```

**D. Server Actions as API (Next.js 15)**
- **Pros:** Reuse existing server actions, type-safe, no extra endpoints
- **Cons:** Less standard (not REST), requires Next.js client
- **Implementation:**
  ```typescript
  // app/actions/cards.ts
  "use server";

  export async function updateCard(id: string, updates: Partial<Card>) {
    const agent = await getAgentFromContext(); // From API key in header
    // Same logic as user-triggered update
  }
  ```

**Recommendation:** **REST API (A)** for agents (standard, tooling-friendly), **Server Actions** for web UI.

### Challenge 5: Data Consistency (DB vs Git)

**If using Hybrid Model (DB + Git):**

**Scenario:** User updates card in UI → Writes to DB → Background job syncs to git → Git sync fails

**Problems:**
1. DB has new data, git has old data (inconsistent)
2. Git is "source of truth" but DB is faster
3. How to recover from sync failures?

**Strategies:**

**A. Eventual Consistency (Accept Lag)**
- **Approach:** DB is primary, git is async backup
- **Recovery:** Retry failed syncs, alert on repeated failures
- **Trade-off:** Git may be minutes behind DB
- **Use case:** High-traffic hosted service

**B. Synchronous Writes (Wait for Git)**
- **Approach:** Server action waits for both DB write + git commit
- **Recovery:** Transaction rollback if git fails
- **Trade-off:** Slower writes (network latency to GitHub API)
- **Use case:** Low-traffic, consistency critical

**C. Event Sourcing (Commands → Events)**
- **Approach:** All mutations are commands, git commit is event
- **Recovery:** Replay commands from queue
- **Trade-off:** Complex, eventual consistency
- **Use case:** High-scale, audit-critical

**Recommendation:** Start with **Synchronous Writes (B)**, move to **Eventual Consistency (A)** if latency becomes issue.

---

## User-Agent Coordination Models

### Current Model: Parallel (No Coordination)

**How it works:**
- Users work in web UI (Next.js app)
- Agents work in terminal (Claude Code CLI)
- Git is the handoff point

**Example Flow:**
1. User creates idea via Quick Capture
2. User asks Claude Code: `/work-idea BRIK-OPP-0003`
3. Agent reads idea file, generates plan, commits
4. User refreshes board → sees worked idea
5. User converts idea to card
6. User asks Claude Code: `/build-feature`
7. Agent reads plan, implements tasks, commits
8. User reviews PR, merges

**Limitations:**
- **Asynchronous only:** No real-time updates
- **Manual handoffs:** User must trigger agent actions
- **No shared context:** Agent doesn't know what user is looking at
- **Refresh required:** User must reload to see agent changes

### Future Model: Coordinated (Real-Time)

**Vision:** Users and agents work in the same system simultaneously

**Example Flow (Ideal):**
1. User creates idea via Quick Capture
2. **System offers:** "Would you like an agent to work this idea?"
3. User clicks "Yes" → Agent task starts in background
4. **Real-time update:** "Agent is drafting plan... (30s remaining)"
5. Agent finishes, plan appears in UI **without refresh**
6. **System offers:** "Plan ready. Review or auto-approve?"
7. User reviews plan inline, adds comment: "Use IndexedDB not localStorage"
8. Agent sees comment in real-time, updates plan
9. User approves → Agent starts building (background)
10. **Real-time updates:** "Implementing task 2/5... Tests passing ✓"
11. Agent finishes, creates PR, notifies user **in app**
12. User reviews PR inline, merges with one click

**Required Features:**

#### 1. Agent Awareness

**Problem:** Agent doesn't know user's context
**Solution:** Context API

```typescript
// User's current view context
interface UserContext {
  userId: string;
  currentPage: "/boards/BRIK" | "/cards/BRIK-003" | "/ideas/BRIK-OPP-0003";
  focusedCard?: string;
  activeFilters: FilterType[];
  selectedText?: string;
}

// Agent receives context with every request
POST /api/agent/tasks
{
  "action": "work-idea",
  "ideaId": "BRIK-OPP-0003",
  "userContext": {
    "userId": "pete",
    "currentPage": "/ideas/BRIK-OPP-0003",
    "selectedText": "Users want offline access"
  }
}
```

**Agent uses context to:**
- Focus on relevant cards/ideas
- Understand user's intent (selected text = key requirement)
- Provide context-aware suggestions

#### 2. Real-Time Status Updates

**Problem:** User doesn't know what agent is doing
**Solution:** WebSocket or Server-Sent Events (SSE)

**Implementation (SSE):**
```typescript
// Server: Stream agent progress
export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      // Start agent task
      const task = await startAgentTask("work-idea", { ideaId: "BRIK-OPP-0003" });

      // Stream progress updates
      for await (const update of task.updates) {
        controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

// Client: Display progress
const eventSource = new EventSource("/api/agent/tasks/123/stream");
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  // { step: 2, total: 5, message: "Writing tests..." }
  setAgentProgress(update);
};
```

**UI Component:**
```tsx
function AgentProgressBanner({ taskId }: { taskId: string }) {
  const { step, total, message } = useAgentProgress(taskId);

  return (
    <div className="bg-info-soft border-l-4 border-info p-4">
      <div className="flex items-center gap-3">
        <Spinner />
        <div>
          <p className="font-medium">Agent working on this idea</p>
          <p className="text-sm text-muted-foreground">
            {message} ({step}/{total})
          </p>
        </div>
        <button onClick={() => cancelAgentTask(taskId)}>Cancel</button>
      </div>
    </div>
  );
}
```

#### 3. Inline Agent Suggestions

**Problem:** Agent suggestions are external (terminal)
**Solution:** In-app agent UI

**Example: Card Detail Page**
```tsx
function CardDetail({ card, currentUser }: CardDetailProps) {
  const [agentSuggestions, setAgentSuggestions] = useState<AgentSuggestion[]>([]);

  useEffect(() => {
    // Agent analyzes card and provides suggestions
    fetchAgentSuggestions(card.ID).then(setAgentSuggestions);
  }, [card.ID]);

  return (
    <div>
      {/* Card content */}

      {/* Agent suggestions sidebar */}
      {agentSuggestions.length > 0 && (
        <div className="bg-info-soft p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Agent Suggestions</h3>
          <ul className="space-y-2">
            {agentSuggestions.map(suggestion => (
              <li key={suggestion.id}>
                <p className="text-sm">{suggestion.message}</p>
                <button
                  onClick={() => applySuggestion(suggestion)}
                  className="text-xs text-primary hover:underline"
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

**Example Suggestions:**
- "This card has been in Blocked for 7 days. Move to Reflected?"
- "Fact-finding stage doc is incomplete. Generate missing sections?"
- "No tests found for this feature. Create test stubs?"
- "Due date is tomorrow. Update priority to P0?"

#### 4. Agent Handoffs

**Problem:** User must manually trigger agent actions
**Solution:** Smart handoff prompts

**Example: Idea → Card Conversion**
```tsx
// After user clicks "Work Idea"
function WorkIdeaButton({ ideaId }: { ideaId: string }) {
  const [showHandoffPrompt, setShowHandoffPrompt] = useState(false);

  const handleClick = async () => {
    // User starts editing
    setIsEditing(true);

    // After 30 seconds, offer agent help
    setTimeout(() => {
      setShowHandoffPrompt(true);
    }, 30000);
  };

  return (
    <>
      <button onClick={handleClick}>Work Idea</button>

      {showHandoffPrompt && (
        <div className="bg-warning-soft p-4 rounded-lg">
          <p className="text-sm mb-2">
            Still working on this idea? An agent can help draft it for you.
          </p>
          <div className="flex gap-2">
            <button onClick={() => handoffToAgent(ideaId)}>
              Let agent finish
            </button>
            <button onClick={() => setShowHandoffPrompt(false)}>
              No thanks
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

**Handoff Triggers:**
- User spends >30s editing
- Card stuck in same lane >7 days
- Fact-finding complete, no plan created
- Tests failing for >24 hours

#### 5. Approval Workflows

**Problem:** Agent makes changes without oversight
**Solution:** Require explicit approval for high-impact actions

**Example: Agent Plan Approval**
```tsx
function PlanApprovalCard({ plan }: { plan: AgentGeneratedPlan }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const handleApprove = async () => {
    await approveAgentPlan(plan.id);
    setStatus("approved");
    // Agent proceeds with build
  };

  const handleReject = async () => {
    await rejectAgentPlan(plan.id, { reason: "Approach is too complex" });
    setStatus("rejected");
    // Agent re-plans with feedback
  };

  return (
    <div className="border-l-4 border-warning p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-warning" />
        <h3 className="font-semibold">Agent Generated Plan</h3>
        <Badge>{plan.confidence}% confidence</Badge>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          {plan.taskCount} tasks, estimated {plan.estimatedHours}h
        </p>
        <Link href={`/plans/${plan.id}`} className="text-sm text-primary hover:underline">
          View full plan →
        </Link>
      </div>

      {status === "pending" && (
        <div className="flex gap-2">
          <button onClick={handleApprove} className="bg-success text-success-foreground">
            Approve & Build
          </button>
          <button onClick={handleReject} className="bg-danger text-danger-foreground">
            Reject
          </button>
        </div>
      )}

      {status === "approved" && (
        <div className="text-success">✓ Approved. Agent is building...</div>
      )}
    </div>
  );
}
```

**Approval Required for:**
- Creating new cards (not just ideas)
- Moving cards to Done/Reflected
- Merging PRs
- Deleting/archiving cards
- Changing card owners

**Auto-Approved (Low Risk):**
- Creating ideas
- Working ideas (Status: raw → worked)
- Updating stage docs
- Adding comments
- Running fact-finding

### Coordination Architecture

**Proposed Stack:**

**Frontend (Next.js):**
- Real-time updates via SSE (Server-Sent Events)
- Agent progress UI components
- Approval workflow modals

**Backend (Next.js API Routes):**
- `/api/agent/tasks` - Start agent task, returns task ID
- `/api/agent/tasks/:id/stream` - SSE stream of progress updates
- `/api/agent/tasks/:id/approve` - User approval endpoint
- `/api/agent/tasks/:id/cancel` - Cancel running task

**Agent Runtime:**
- **Option A:** Serverless functions (Vercel, AWS Lambda)
  - Pros: Auto-scaling, pay-per-use
  - Cons: 15min timeout, cold starts
- **Option B:** Long-running worker (Docker container)
  - Pros: No timeouts, warm starts
  - Cons: Always running, more expensive
- **Option C:** Hybrid (queue + workers)
  - Pros: Best of both (fast start, long running)
  - Cons: More complex

**Message Queue (Redis, AWS SQS, or Inngest):**
- Decouples web app from agent runtime
- Retries on failure
- Priority queue (user-triggered > scheduled)

**Example Flow:**
1. User clicks "Work Idea" → POST `/api/agent/tasks`
2. API adds task to queue → Returns task ID
3. Worker picks up task → Calls Claude API
4. Worker streams progress → SSE to frontend
5. Worker finishes → Commits to git → Updates DB
6. Frontend receives "complete" event → Refreshes UI

---

## Expert Review Questions

### Strategic Direction

**1. Multi-User Hosting: What's the Right Model?**

**Context:** Business OS is currently local-only with direct git operations. To support hosted multi-user, we must choose a deployment architecture.

**Options Analyzed:**
- **A.** Self-hosted VM with git checkout (simple, not scalable)
- **B.** GitHub API for all writes (serverless-friendly, complex)
- **C.** Database cache + git sync (fast, eventual consistency)
- **D.** Event sourcing command log (complex, audit-perfect)

**Questions:**
- Which model best balances git audit trail + multi-user performance?
- Is eventual consistency acceptable for non-critical operations (idea capture)?
- Should we require synchronous git commits for critical operations (card lane moves)?
- How do we handle git sync failures in production (retry, alert, rollback)?

**Success Criteria:**
- <500ms write latency for idea capture
- <2s write latency for card updates
- 100% git audit trail (no lost commits)
- Supports 10 concurrent users initially, 100 users future

---

**2. User-Agent Coordination: What Level of Integration?**

**Context:** Agents currently work externally (CLI) with async handoffs via git. We want tighter coordination but must balance complexity vs value.

**Integration Levels:**
1. **Level 0 (Current):** Agents external, git handoffs, user refreshes
2. **Level 1:** Agent API access, but still external (CLI calls API)
3. **Level 2:** Agent tasks in background, real-time status updates (SSE)
4. **Level 3:** Inline agent UI, suggestions, approval workflows
5. **Level 4:** Real-time collaboration (agents edit alongside users)

**Questions:**
- What level provides most value with least complexity for MVP?
- Should agents have read-only access initially, write access later?
- How do we handle agent mistakes (bad suggestions, wrong edits)?
- What approval workflow prevents agent chaos while maintaining speed?

**Success Criteria:**
- User can trigger agent task without leaving browser
- User sees agent progress without manual refresh
- Agent respects user permissions (can't edit cards as wrong user)
- Agent mistakes are recoverable (rollback, undo)

---

**3. Authentication: OAuth, Magic Links, or Password?**

**Context:** Current cookie-based auth is dev-only. Hosted service needs real auth.

**Requirements:**
- Secure (protect against unauthorized access)
- User-friendly (low friction signup)
- Agent-compatible (API keys for Claude Code)
- Role-based (admin vs regular user)

**Options:**
- **A.** NextAuth.js with Google/GitHub OAuth
- **B.** Supabase Auth (email + password + magic links)
- **C.** Custom JWT auth

**Questions:**
- Should we require OAuth (Google/GitHub) or allow email/password?
- How do we handle agent API keys (per-user or system-wide)?
- Do agents authenticate as users or as separate "agent accounts"?
- How do we manage permissions for agent actions (edit as Pete, but initiated by agent)?

**Success Criteria:**
- <30s signup flow (OAuth or magic link)
- Agents can authenticate via API key (no manual login)
- Clear audit trail (who did what: user or agent)
- Revocable API keys (security)

---

**4. Concurrency: How to Handle Simultaneous Edits?**

**Context:** Local system has no concurrency. Hosted multi-user needs conflict resolution.

**Scenarios:**
- Pete and Cristiana edit same card simultaneously
- User edits card while agent is updating it
- Two agents process same idea concurrently

**Options:**
- **A.** Last write wins (simple, data loss risk)
- **B.** Optimistic locking with version numbers (retry on conflict)
- **C.** Operational transformation (real-time collab, complex)
- **D.** Field-level locking (granular, UX complexity)

**Questions:**
- What's acceptable user experience when conflicts occur?
- Should we prevent conflicts (locking) or resolve them (OT)?
- Do we need real-time collaboration (Google Docs style) or is optimistic locking sufficient?
- How do we communicate conflicts to users (error message, diff view, auto-merge)?

**Success Criteria:**
- No silent data loss (user always warned of conflicts)
- <10% of edits result in conflicts (good UX)
- Conflicts resolvable in <30s (simple UI)

---

**5. Agent Runtime: Where Do Agents Run?**

**Context:** Agents currently run on Pete's machine (Claude Code CLI). Hosted agents need a runtime environment.

**Requirements:**
- Long-running tasks (fact-finding, planning, building can take 10+ minutes)
- Access to codebase (read files, run tests)
- Git operations (clone, commit, push)
- Real-time progress updates to frontend

**Options:**
- **A.** Serverless functions (AWS Lambda, Vercel Functions)
  - Pros: Auto-scaling, pay-per-use
  - Cons: 15min timeout (too short for builds), cold starts
- **B.** Container-based workers (ECS, Cloud Run)
  - Pros: No timeout, warm, full git access
  - Cons: Always running (more expensive), manual scaling
- **C.** Hybrid (queue + workers)
  - Pros: Fast start (queue), long running (workers), auto-scaling
  - Cons: More complex architecture
- **D.** User's local machine (agent stays on CLI)
  - Pros: No server costs, direct file access
  - Cons: User machine must be online, not true hosted

**Questions:**
- Can we fit agent tasks into 15min serverless limits (break into subtasks)?
- Is container-based worth the cost for always-on workers?
- How do we handle codebase access (clone repo per task, or shared volume)?
- Do we need GPU access for agent tasks (likely no for current use case)?

**Success Criteria:**
- Agent tasks complete in <15min (90th percentile)
- Agent has full codebase access (git clone + file I/O)
- Agent progress updates stream to frontend in real-time
- Agent runtime costs <$100/mo for 10 users

---

### Technical Architecture

**6. Data Model: Database or Git-Only?**

**Context:** Current system is git-only (markdown files). Hosted system may benefit from database for fast queries.

**Git-Only (Current):**
- **Pros:** Single source of truth, full audit trail, no sync issues
- **Cons:** Slow queries (must parse all files), no full-text search, no aggregations

**Database + Git:**
- **Pros:** Fast queries, full-text search, real-time updates
- **Cons:** Sync complexity, eventual consistency, dual write risk

**Questions:**
- Can we optimize git-only model (e.g., pre-built index, caching)?
- If we add database, what's the schema (mirror git structure or normalized)?
- How do we keep DB and git in sync (write to both, or DB as cache)?
- What happens when DB and git diverge (which is source of truth)?

**Success Criteria:**
- Board loads in <1s for 100 cards
- Search returns results in <200ms
- Full-text search across all card content
- Git audit trail never lost (even if DB corrupted)

---

**7. Real-Time Updates: WebSocket, SSE, or Polling?**

**Context:** Users want to see agent progress and other users' edits without manual refresh.

**Options:**
- **A.** Polling (simple, inefficient)
- **B.** Server-Sent Events (one-way, HTTP-based)
- **C.** WebSocket (two-way, persistent connection)
- **D.** Nothing (user clicks refresh manually)

**Questions:**
- Do we need two-way communication (WebSocket) or one-way (SSE) sufficient?
- How many concurrent connections can we support (Vercel: 1000, self-hosted: unlimited)?
- What's the latency requirement (real-time <100ms, or near-real-time <5s acceptable)?
- How do we handle connection drops (reconnect, resume from checkpoint)?

**Success Criteria:**
- User sees agent progress updates within 1s
- User sees other users' edits within 5s
- Graceful degradation if real-time fails (fallback to manual refresh)
- Support 100 concurrent connections

---

**8. Search & Filtering: Client-Side or Server-Side?**

**Context:** Current filtering is client-side (fast for <100 cards, won't scale).

**Client-Side (Current):**
- **Pros:** Instant feedback, no API calls
- **Cons:** Scales poorly (>1000 cards), no full-text search, no complex queries

**Server-Side:**
- **Pros:** Scales to millions of cards, full-text search, complex queries
- **Cons:** Network latency, API design complexity

**Questions:**
- At what card count does client-side break (100, 1000, 10000)?
- Do we need full-text search (search inside card content, not just title)?
- Should we use search engine (Elasticsearch, Algolia) or database full-text (Postgres)?
- How do we handle real-time search results (debounce, streaming)?

**Success Criteria:**
- Search 1000 cards in <200ms
- Full-text search across all card content + stage docs
- Real-time filter feedback (<100ms on client after server response)
- Support complex queries (e.g., "high priority cards in Blocked lane due this week")

---

### User Experience

**9. Mobile Strategy: PWA, Native, or Responsive Web?**

**Context:** Current system is responsive web (mobile vertical lanes). Users want offline access and push notifications.

**Options:**
- **A.** Responsive web only (current, works but limited)
- **B.** PWA (installable, offline, push notifications)
- **C.** React Native app (full native capabilities)
- **D.** Hybrid (Capacitor/Ionic - web + native shell)

**Questions:**
- Do users need offline access (can't query cards without internet)?
- Do users need push notifications (e.g., "Agent finished building your feature")?
- Is iOS App Store distribution required (PWA works but not discoverable)?
- What's the maintenance burden (1 codebase vs 3: web, iOS, Android)?

**Success Criteria:**
- Works on iOS Safari and Android Chrome
- Installable to home screen (PWA or native)
- Offline access to recently viewed cards (stretch goal)
- Push notifications for agent tasks + mentions (stretch goal)

---

**10. Onboarding: How Do New Users Learn the System?**

**Context:** Business OS has unique concepts (lanes, ideas vs cards, stage docs, agent workflows). New users will be confused.

**Current:** No onboarding (Pete knows the system)

**Options:**
- **A.** Tutorial modal (step-by-step guide on first login)
- **B.** Empty state messaging (helpful text when board is empty)
- **C.** Interactive demo (pre-populated demo board)
- **D.** Video walkthrough (recorded demo)
- **E.** Documentation site (separate docs.business-os.com)

**Questions:**
- What's the minimum viable onboarding (get users productive in <5min)?
- Should we have a demo/sandbox mode (non-destructive exploration)?
- Do we need role-specific onboarding (admin sees different flow than user)?
- How do we teach agent features (when to trigger agent, how to review)?

**Success Criteria:**
- New user creates their first card in <2min
- New user understands lane system without reading docs
- New user successfully triggers agent to work an idea
- <10% of users abandon during onboarding

---

## Proposed Next Steps

Based on expert review feedback, we will:

1. **Choose deployment model** (git + DB hybrid recommended)
2. **Design agent API** (REST endpoints for idea/card operations)
3. **Implement authentication** (NextAuth.js with OAuth + API keys)
4. **Add real-time updates** (SSE for agent progress)
5. **Build approval workflows** (user must approve agent plans)
6. **Deploy MVP** (self-hosted VM initially, migrate to serverless later)

**Timeline (Estimated):**
- Phase 3 (Q1 2026): Authentication + Hosted deployment + Agent API
- Phase 4 (Q2 2026): Real-time updates + Agent coordination
- Phase 5 (Q3 2026): Mobile PWA + Advanced search
- Phase 6 (Q4 2026): Public beta + Documentation + Onboarding

---

## Appendix: Current File Structure

```
docs/business-os/
├── ideas/
│   ├── inbox/          # Raw ideas (Status: raw)
│   │   ├── BRIK-OPP-0001.user.md
│   │   └── BRIK-OPP-0002.user.md
│   └── worked/         # Worked ideas (Status: worked)
│       └── BRIK-OPP-0003.user.md
├── cards/              # Active cards
│   ├── BRIK-001.user.md
│   ├── BRIK-002.user.md
│   ├── archive/        # Archived cards
│   │   └── BRIK-OLD-001.user.md
│   └── stages/         # Stage documents
│       └── BRIK-001/
│           ├── fact-find.user.md
│           ├── plan.user.md
│           ├── build.user.md
│           └── reflect.user.md
├── strategy/           # Business plans
│   ├── BRIK/
│   │   └── plan.user.md
│   └── PLAT/
│       └── plan.user.md
├── people/
│   └── people.user.md
└── scans/              # Agent scan metadata
    ├── last-scan.json
    ├── active-docs.json
    └── history/
        └── 2026-01-29T14-30-00Z.json

apps/business-os/
└── src/
    ├── app/            # Next.js pages
    │   ├── boards/[businessCode]/page.tsx
    │   ├── cards/[id]/page.tsx
    │   ├── ideas/[id]/page.tsx
    │   └── archive/page.tsx
    ├── components/     # React components
    │   ├── board/
    │   │   ├── BoardView.tsx
    │   │   ├── BoardLane.tsx
    │   │   ├── CompactCard.tsx
    │   │   ├── FilterChips.tsx
    │   │   ├── SearchBar.tsx
    │   │   └── MobileLanePicker.tsx
    │   ├── card-detail/
    │   │   └── CardDetail.tsx
    │   ├── capture/
    │   │   └── QuickCaptureModal.tsx
    │   └── user/
    │       └── UserSwitcher.tsx
    ├── hooks/          # React hooks
    │   └── useRovingTabindex.ts
    ├── lib/            # Core logic
    │   ├── repo-reader.ts
    │   ├── repo-writer.ts
    │   ├── current-user.ts
    │   └── types.ts
    └── styles/
        └── global.css
```

---

## Document History

- **2026-01-29:** Initial draft for expert review
- **Status:** Draft (awaiting feedback)
- **Next Review:** After expert feedback incorporation
