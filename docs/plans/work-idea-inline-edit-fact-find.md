---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Created: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: work-idea-inline-edit
Related-Plan: docs/plans/work-idea-inline-edit-plan.md
---

# Work Idea Inline Edit Fact-Find Brief

## Scope

### Summary
Add inline editing functionality to the "Work Idea" button on idea detail pages (`/ideas/[id]`). When clicked, the button should enable rich text editing of the idea content directly on the page, allowing users to develop/refine raw ideas before converting them to cards.

### Goals
- Enable inline editing of idea content without navigating away
- Allow users to refine/develop raw ideas into "worked" ideas
- Provide rich markdown editing experience
- Save changes back to the idea file via git
- Update idea Status from "raw" to "worked" when editing begins (one-way transition)

### Non-goals
- Moving idea files between inbox/ and worked/ directories (existing `/work-idea` skill handles that workflow)
- Creating cards from ideas (existing "Convert to Card" button handles that)
- Full-featured markdown WYSIWYG editor (Phase 0: simple textarea with markdown preview)
- Reversibility (working an idea is one-way per user requirement)

### Constraints & Assumptions
- Constraints:
  - Must use existing `RepoWriter.updateIdea()` method (once implemented)
  - Must follow git worktree pattern (work/business-os-store branch)
  - Must validate worktree is clean before editing
  - Phase 0: Pete-only, local-only, no auth
  - Must commit with user identity (not agent)
- Assumptions:
  - Users want to edit ideas in-place rather than navigating to a separate edit page
  - Simple textarea + markdown preview is sufficient for Phase 0 (no WYSIWYG needed)
  - Ideas should transition to "worked" status when editing begins (not reversible)

## Repo Audit (Current State)

### Entry Points
- `apps/business-os/src/app/ideas/[id]/page.tsx` — Idea detail page (server component)
- `apps/business-os/src/app/ideas/[id]/ConvertToCardButton.tsx` — Existing client button pattern (reference)
- `apps/business-os/src/app/ideas/[id]/actions.ts` — Existing server actions (reference for new updateIdea action)

### Key Modules / Files
- `apps/business-os/src/lib/repo-writer.ts` — Repository writer with git integration
  - Has `writeIdea()`, `writeCard()`, `updateCard()` methods
  - **Missing:** `updateIdea()` method (needs implementation)
  - Pattern: Read existing file, merge updates, write back, git commit
- `apps/business-os/src/lib/repo-reader.ts` — Repository reader
  - Has `getIdea(id)` method for reading ideas
- `apps/business-os/src/lib/types.ts` — Type definitions
  - `IdeaFrontmatter`: Status can be "raw" | "worked" | "converted" | "dropped"
  - `Idea` extends `IdeaFrontmatter` with `content` and `filePath`
- `apps/business-os/src/components/card-editor/CardEditorForm.tsx` — Existing form pattern
  - Uses react-hook-form + zod validation
  - Has textarea for description editing
  - Pattern reference for idea editor form
- `apps/business-os/src/components/card-detail/MarkdownContent.tsx` — Markdown rendering component
  - Can be reused for preview mode

### Patterns & Conventions Observed
- **Client/Server split:** Server actions in `actions.ts`, client components in `<Component>.tsx`
  - Evidence: `apps/business-os/src/app/ideas/[id]/actions.ts` (convertToCard action)
  - Evidence: `apps/business-os/src/app/ideas/[id]/ConvertToCardButton.tsx` (client button)
- **Form handling:** react-hook-form + zod for validation
  - Evidence: `apps/business-os/src/components/card-editor/CardEditorForm.tsx`
- **Git operations:** RepoWriter handles all file writes with git commits
  - Evidence: `apps/business-os/src/lib/repo-writer.ts` (updateCard pattern lines 294-371)
- **Error handling:** ErrorKey + ErrorDetails pattern for i18n-ready errors
  - Evidence: `apps/business-os/src/lib/repo-writer.ts` (WriteResult interface lines 25-32)
- **Design system usage:** eslint-disable for Phase 0 scaffold UI
  - Evidence: `apps/business-os/src/app/ideas/[id]/page.tsx` line 13

### Data & Contracts
- Types/schemas:
  - `IdeaFrontmatter` — frontmatter fields (Type, ID, Business, Status, Created-Date, Tags)
  - `Idea` — extends IdeaFrontmatter with content and filePath
  - Status transition: "raw" → "worked" (one-way)
- Persistence:
  - Ideas stored as markdown files in `docs/business-os/ideas/inbox/{ideaId}.user.md`
  - "Worked" ideas can stay in inbox with Status="worked" (no file move required)
  - Content stored as markdown body (after frontmatter)
  - Git commits via RepoWriter worktree pattern
- API/event contracts:
  - Server action signature: `async function updateIdea(ideaId: string, updates: Partial<IdeaFrontmatter> & { content?: string }): Promise<WriteResult>`
  - Client component props: `{ ideaId: string, initialContent: string, initialStatus: string }`

### Dependency & Impact Map
- Upstream dependencies:
  - `RepoWriter` needs `updateIdea()` method (NEW — must implement)
  - `RepoReader.getIdea()` (EXISTS — read idea for editing)
  - react-hook-form, zod (EXISTS — form handling)
  - @acme/design-system (EXISTS — UI components)
- Downstream dependents:
  - Idea detail page rendering (must show edit mode when active)
  - `/work-idea` skill (should detect already-worked ideas and skip file move)
- Likely blast radius:
  - **Small** — isolated to idea detail page + new server action
  - No changes to existing "Convert to Card" functionality
  - No changes to board views or card workflows
  - New `updateIdea()` method in RepoWriter (analogous to existing `updateCard()`)

### Tests & Quality Gates
- Existing tests:
  - `apps/business-os/src/lib/repo-writer.test.ts` — Tests for writeIdea, writeCard, updateCard
  - `apps/business-os/src/lib/repo-reader.test.ts` — Tests for getIdea
  - `apps/business-os/src/components/card-editor/CardEditorForm.test.tsx` — Form component tests (reference)
- Gaps:
  - No tests for `updateIdea()` method (NEW — needs implementation + tests)
  - No tests for inline editing UI (NEW — needs component tests)
- Commands/suites:
  - `pnpm typecheck` — TypeScript validation
  - `pnpm lint` — ESLint (many pre-existing errors, use --no-verify for Phase 0)
  - `pnpm test` — Jest unit tests
  - `pnpm docs:lint` — Frontmatter validation (for idea files)

### Recent Git History (Targeted)
- `apps/business-os/src/app/ideas/[id]/` — Recent work on idea detail page
  - Commit `6553521be8`: Added "Convert to Card" functionality (2026-01-29)
  - Pattern: Server action + client component + page integration
  - Can reuse this pattern for "Work Idea" inline editing

## External Research (If needed)
- No external research needed
- All required patterns exist in codebase (form handling, server actions, git operations)
- Design tokens and components available in @acme/design-system

## Questions

### Resolved
- Q: Should inline editing show in a modal or replace the page content?
  - A: Replace the page content (simpler, no modal complexity)
  - Evidence: User selected "Open inline editing mode on the idea" option

- Q: Should worked ideas move to a separate directory?
  - A: No — ideas stay in inbox with Status="worked"
  - Evidence: User requirement says "inline editing mode", not file movement
  - Evidence: `/work-idea` skill handles the inbox→worked file movement workflow

- Q: Can users revert a worked idea back to raw?
  - A: No — one-way transition per user requirement
  - Evidence: User selected "No - one-way transition only"

- Q: What markdown editor should be used?
  - A: Simple textarea + markdown preview for Phase 0
  - Evidence: CardEditorForm uses basic Textarea component from design system
  - Evidence: Phase 0 scaffold UI can use simple controls

- Q: Does RepoWriter have an updateIdea method?
  - A: No — needs implementation
  - Evidence: `grep updateIdea repo-writer.ts` returns no results
  - Evidence: `updateCard()` method exists (lines 294-371) — can follow same pattern

### Open (User Input Needed)
None — sufficient information to proceed to planning.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - Existing patterns are well-established (server actions, form handling, git operations)
  - `updateIdea()` method is straightforward (analogous to `updateCard()`)
  - UI components exist in design system (Textarea, Button, FormField)
  - Markdown preview component exists (MarkdownContent)
  - Risk: Worktree cleanliness check + error handling (but pattern exists in updateCard)

- **Approach:** 90%
  - Inline editing via simple textarea + preview is appropriate for Phase 0
  - Server action pattern proven (just implemented in convertToCard)
  - Git worktree pattern well-understood
  - Status transition logic is trivial (set Status="worked")
  - Risk: None significant — approach is conservative and proven

- **Impact:** 85%
  - Blast radius is small (isolated to idea detail page)
  - No changes to existing workflows (Convert to Card, board views)
  - `/work-idea` skill may need update to check for Status="worked" (minor)
  - Risk: Concurrent edits (worktree must be clean) — existing checks handle this

**What would raise Implementation to ≥90:**
- Spike: Implement `updateIdea()` method and verify worktree write works
- Spike: Test form validation with zod schema for idea updates

**What would raise Approach to ≥95:**
- User testing: Validate that textarea + preview is sufficient (vs. WYSIWYG)
- Prototype: Quick mockup to confirm UX flow (edit → save → see updated content)

**What would raise Impact to ≥90:**
- Code review: Verify `/work-idea` skill handles Status="worked" ideas correctly
- Test: Ensure concurrent edit prevention works (worktree cleanliness check)

## Planning Constraints & Notes

- Must-follow patterns:
  - Server action + client component split (proven in convertToCard)
  - RepoWriter for all file writes (with worktree cleanliness check)
  - Zod validation for form inputs
  - ErrorKey + ErrorDetails for error handling
  - Phase 0 eslint-disable comments for hardcoded copy / design system rules

- Rollout/rollback expectations:
  - Phase 0: Local-only, Pete-only
  - No feature flag needed (button replaces "Coming Soon" placeholder)
  - Rollback: Remove WorkIdeaButton component, restore "Coming Soon" text

- Observability expectations:
  - No special logging needed for Phase 0
  - Existing error handling via ErrorKey pattern is sufficient
  - Git commits provide audit trail

## Suggested Task Seeds (Non-binding)

1. **Implement RepoWriter.updateIdea() method** (S-effort)
   - Add `updateIdea()` method analogous to `updateCard()`
   - Read existing idea file, merge updates, write back, git commit
   - Unit tests in `repo-writer.test.ts`

2. **Create server action: updateIdea()** (S-effort)
   - File: `apps/business-os/src/app/ideas/[id]/actions.ts`
   - Zod schema: validate content (min 10 chars) and optional status
   - Call RepoWriter.updateIdea()
   - Return WriteResult

3. **Create IdeaEditorForm client component** (M-effort)
   - File: `apps/business-os/src/app/ideas/[id]/IdeaEditorForm.tsx`
   - react-hook-form + zod validation
   - Textarea for content editing
   - Preview toggle (show MarkdownContent)
   - Save/Cancel buttons
   - Loading state + error display
   - Sets Status="worked" on first save

4. **Create WorkIdeaButton client component** (S-effort)
   - File: `apps/business-os/src/app/ideas/[id]/WorkIdeaButton.tsx`
   - Toggle between view mode and edit mode
   - Disabled if Status != "raw" (already worked)
   - Shows IdeaEditorForm when active

5. **Integrate into idea detail page** (S-effort)
   - File: `apps/business-os/src/app/ideas/[id]/page.tsx`
   - Replace "Work Idea (Coming Soon)" button with WorkIdeaButton
   - Pass idea content and status as props

6. **Add unit tests** (M-effort)
   - Test RepoWriter.updateIdea() (read, merge, write, commit)
   - Test IdeaEditorForm (validation, save, cancel, error handling)
   - Test WorkIdeaButton (toggle edit mode, disable when worked)

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None
- Recommended next step: Proceed to `/plan-feature` with this fact-find brief
