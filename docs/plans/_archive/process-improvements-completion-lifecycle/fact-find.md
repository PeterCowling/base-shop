---
Type: Fact-Find
Plan: process-improvements-completion-lifecycle
Business-Unit: BOS
Status: Archived
Fact-Find-Date: 2026-02-26
Dispatch-ID: IDEA-DISPATCH-20260226-0014
---

# Fact-Find: Process-improvements completion lifecycle

## Current behavior

### Generator pipeline

`scripts/src/startup-loop/generate-process-improvements.ts` is the sole source of truth for the live report. The `collectProcessImprovements(repoRoot)` function (line 340) walks `docs/plans/**` and builds three arrays:

- **`ideaItems`** — collected from every `results-review.user.md` that has a non-empty `## New Idea Candidates` section (lines 367–409). Each bullet in that section becomes one `ProcessImprovementItem`. No filtering beyond `!/^none\.?$/i/`.
- **`riskItems`** — collected from `reflection-debt.user.md` ledger entries where `status === "open"` (lines 412–446).
- **`pendingReviewItems`** — collected from `build-record.user.md` files whose sibling `results-review.user.md` is invalid (lines 448–474).

### `ProcessImprovementItem` interface (lines 19–28)

```typescript
export interface ProcessImprovementItem {
  type: ProcessImprovementType;          // "idea" | "risk" | "pending-review"
  business: string;
  title: string;
  body: string;
  suggested_action?: string;
  source: string;
  date: string;
  path: string;
}
```

There is no `completed_at`, `status`, `output_link`, or any completion-related field on this interface.

### HTML report injection

`updateProcessImprovementsHtml()` (line 524) does a direct replacement of the three `var IDEA_ITEMS = [...];` JavaScript array assignments inside `docs/business-os/process-improvements.user.html`. The HTML page auto-refreshes every 30 seconds (line 6). Every refresh re-renders every idea from every `results-review.user.md` in the repo, including those from archived plans.

### Data file

`docs/business-os/_data/process-improvements.json` is written on each generator run with the full unfiltered arrays. Current content shows 60+ idea items, many of which are artefacts of "None identified" or similar placeholder text that was not filtered by the `!/^none\.?$/i/` regex (e.g., `"New loop process: None identified."` at line 16 of `process-improvements.json`).

### lp-do-build plan completion step (SKILL.md lines 152–159)

At plan completion the build orchestrator:
1. Produces `build-record.user.md`
2. Auto-drafts `results-review.user.md` (pre-fills `## New Idea Candidates`)
3. Runs reflection debt emitter
4. Runs `pnpm --filter scripts startup-loop:generate-process-improvements`

There is no step to record that the ideas from the completed plan's `results-review.user.md` are now resolved/actioned.

### lp-do-ideas dispatch schema

`docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json` defines a `queue_state` enum (line 147) of `["enqueued", "processed", "skipped", "error"]`. There is no `"completed"` state — the dispatch schema models processing of the dispatch packet itself, not the downstream completion lifecycle of ideas that the dispatch produced.

### Real example of the staleness problem

`docs/plans/brikette-cta-sales-funnel-ga4/results-review.user.md` contains:

```
- ~~Add `view_item_list` assertions to the Playwright smoke test~~ | Actioned: plan
  `brikette-smoke-view-item-list` archived 2026-02-26 — `view_item_list` added to
  `REQUIRED_EVENTS` in `ga4-funnel-smoke.mjs`
```

The operator struck through this idea in the source file to signal it is done, but the generator's `extractBulletItems()` + `sanitizeText()` pipeline strips Markdown strikethrough (`~~text~~`) — so this idea appears in the live report exactly as if it were still open. There is no mechanism to suppress it.

---

## The gap

### What is missing

1. **No completion field on `ProcessImprovementItem`.** There is nowhere to record `completed_at`, `output_link`, or `status` for an idea that has been actioned.

2. **No filtering logic in `collectProcessImprovements()`.** Even if a completion record existed, the generator does not read it.

3. **No post-build completion write step.** `lp-do-build` does not record which ideas from the completed plan's `results-review.user.md` are now actioned by the build.

4. **Strikethrough not detected.** The `sanitizeText()` function (line 62) removes Markdown formatting including `~~strikethrough~~` text, which operators already use informally to mark done ideas. This convention is silently swallowed.

### Why it matters

Every plan build appends its ideas to the report permanently. As the repo ages, the live report becomes an ever-growing backlog of stale items that were already acted on, making it impossible to use as a real-time action list. The operator cannot trust the report to reflect "what still needs doing."

---

## Data model decision

### Chosen approach: Option A — Completion registry JSON

**File:** `docs/business-os/_data/completed-ideas.json`

**Schema per entry:**

```json
{
  "idea_key": "<stable-hash-or-slug>",
  "title": "<original idea title, first 120 chars>",
  "completed_at": "2026-02-26",
  "plan_slug": "brikette-smoke-view-item-list",
  "output_link": "docs/plans/_archive/brikette-smoke-view-item-list/",
  "source_path": "docs/plans/brikette-cta-sales-funnel-ga4/results-review.user.md"
}
```

**Key derivation:** `idea_key = sha1(source_path + "::" + title_normalized)` where `title_normalized` is the sanitized title string used in the `ProcessImprovementItem.title` field. This is deterministic and reproducible from the same `results-review.user.md` source without modifying that file.

**Generator change:** `collectProcessImprovements()` loads the registry at startup, builds a `Set<string>` of completed `idea_key` values, and skips matching ideas when iterating bullet items.

**lp-do-build change:** At plan completion, after regenerating process-improvements, write a new entry to `completed-ideas.json` for each idea bullet in the plan's `results-review.user.md` that the build directly actioned. This is an explicit operator-confirmed step (write entries for ideas addressed by this build, not all ideas).

**Justification:**

- Does not require touching any historical `results-review.user.md` files. Historical files are immutable records of what was observed; adding completion signals to them would conflate observation with lifecycle state.
- The registry is a single append-only file easy to inspect, audit, and manually correct.
- Stable key derivation from `(source_path, title)` is robust: the title comes from the same parse path already used by the generator, so key collisions are avoided.
- Works retroactively: existing completed ideas can be backfilled into the registry without any code change.
- The registry pattern mirrors how `docs/business-os/startup-loop/ideas/trial/queue-state.json` models dispatch lifecycle — a separate state file rather than mutations to source artifacts.

### Rejected alternatives

**Option B — Frontmatter in `results-review.user.md`:**
Requires editing historical files every time an idea is completed. `results-review.user.md` files are meant to be write-once records of what was observed at build time. Mutating them post-hoc to add `Completed-Ideas:` frontmatter violates the append-only nature of the record and creates maintenance overhead across potentially many files. Key management (which slug corresponds to which bullet across files) would also be error-prone.

**Option C — Inline pipe-delimited status:**
Same historical-file-mutation problem as Option B, but worse: the existing pipe-delimited segment format is already complex and fragile. Adding `| status: completed | completed_at: ... | output_link: ...` segments to existing bullets requires regex changes to `parseIdeaCandidate()` and produces Markdown that is difficult to read in a standard viewer. Also requires editing historical files.

---

## Required changes

### TASK-01: Extend `ProcessImprovementItem` and add registry loader

**File:** `scripts/src/startup-loop/generate-process-improvements.ts`

- Add optional `idea_key?: string` field to `ProcessImprovementItem` interface. This lets the data file carry the key for downstream traceability.
- Add `CompletedIdeaEntry` interface: `{ idea_key: string; title: string; completed_at: string; plan_slug: string; output_link?: string; source_path: string }`.
- Add `COMPLETED_IDEAS_RELATIVE_PATH = "docs/business-os/_data/completed-ideas.json"` constant.
- Add `loadCompletedIdeasRegistry(repoRoot: string): Set<string>` function that reads `completed-ideas.json` if it exists, parses it, and returns the set of `idea_key` values. Returns empty set if file does not exist (graceful degradation).
- Add `deriveIdeaKey(sourcePath: string, title: string): string` pure function using Node `crypto.createHash('sha1')` over `${sourcePath}::${title}`.

### TASK-02: Add filtering logic to `collectProcessImprovements()`

**File:** `scripts/src/startup-loop/generate-process-improvements.ts`

- At the start of `collectProcessImprovements()`, call `loadCompletedIdeasRegistry(repoRoot)` to get `completedKeys: Set<string>`.
- In the idea-collection loop (currently lines 392–409), after calling `parseIdeaCandidate(ideaRaw)`, compute `ideaKey = deriveIdeaKey(sourcePath, idea.title)`. If `completedKeys.has(ideaKey)`, skip the item.
- Set `idea_key: ideaKey` on each emitted `ProcessImprovementItem` so the key appears in the data file.
- Also detect strikethrough: before passing `ideasRaw` items to `parseIdeaCandidate`, filter out items where the raw bullet text matches `/^~~.+~~\s*(\|.*)?$/` (fully struck-through bullet). Log a warning to stderr so the operator knows a struck-through idea was suppressed.

### TASK-03: Create `completed-ideas.json` initial file

**File:** `docs/business-os/_data/completed-ideas.json` (new)

- Create the file with the known-completed ideas from current results-review files.
- Specifically: the `~~Add view_item_list assertions~~` idea from `brikette-cta-sales-funnel-ga4/results-review.user.md` should be the first entry as a real validation case.
- File format: `{ "schema_version": "completed-ideas.v1", "entries": [...] }`.

### TASK-04: Add `appendCompletedIdea()` export for lp-do-build post-step

**File:** `scripts/src/startup-loop/generate-process-improvements.ts`

- Export `appendCompletedIdea(repoRoot: string, entry: Omit<CompletedIdeaEntry, 'idea_key'>): void` function that:
  1. Derives `idea_key` from `entry.source_path + "::" + entry.title` (same `deriveIdeaKey()` function).
  2. Loads existing registry (or starts empty).
  3. Skips if `idea_key` already present (idempotent).
  4. Appends the entry.
  5. Writes atomically.
- This function is the programmatic interface for the lp-do-build post-step.

### TASK-05: Update `lp-do-build` SKILL.md completion step

**File:** `.claude/skills/lp-do-build/SKILL.md`

- In the "Plan Completion and Archiving" section (currently step 2, line 153), extend the completion procedure:
  - After regenerating process-improvements, add an explicit step: "For each idea in `## New Idea Candidates` that was directly actioned by this build, call `appendCompletedIdea()` (or equivalently, add an entry to `docs/business-os/_data/completed-ideas.json`) recording `plan_slug`, `output_link` (path to the archived plan or the built artifact), and `completed_at` (today). Re-run `pnpm --filter scripts startup-loop:generate-process-improvements` after appending so the report reflects the exclusion."
  - Note that not all ideas need to be marked complete — only those directly delivered by the current build. Ideas that are deferred, out-of-scope, or for a future plan remain in the report.

### TASK-06: Update generator unit tests

**File:** `scripts/src/startup-loop/__tests__/generate-build-summary.test.ts` and/or a new `generate-process-improvements.test.ts` (check whether one exists)

- Add test: `collectProcessImprovements()` skips an idea when its `idea_key` appears in `completed-ideas.json`.
- Add test: `deriveIdeaKey()` is deterministic for same inputs, different for different inputs.
- Add test: struck-through bullet (`~~text~~`) is filtered from ideas.
- Add test: `appendCompletedIdea()` is idempotent (calling twice with same idea key does not duplicate).

### TASK-07: Update `runCheck()` to include `completed-ideas.json` in drift detection (optional, low priority)

**File:** `scripts/src/startup-loop/generate-process-improvements.ts`

- The existing `runCheck()` function compares committed HTML/JSON against freshly generated output. If `completed-ideas.json` is updated between generator runs, the check will correctly detect drift in `IDEA_ITEMS`. No specific change required here — this is a confirmation that the existing drift detection covers the new filtering behavior automatically.
- Document this explicitly in a code comment near `runCheck()` so future maintainers know filtering is covered.

---

## Planning brief

| Task | Type | File(s) | Complexity | Depends On |
|------|------|---------|------------|------------|
| TASK-01 | IMPLEMENT | `scripts/src/startup-loop/generate-process-improvements.ts` | S | — |
| TASK-02 | IMPLEMENT | `scripts/src/startup-loop/generate-process-improvements.ts` | S | TASK-01 |
| TASK-03 | IMPLEMENT | `docs/business-os/_data/completed-ideas.json` (new) | S | TASK-01 |
| TASK-04 | IMPLEMENT | `scripts/src/startup-loop/generate-process-improvements.ts` | S | TASK-01 |
| TASK-05 | IMPLEMENT | `.claude/skills/lp-do-build/SKILL.md` | S | TASK-04 |
| TASK-06 | IMPLEMENT | `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` | M | TASK-01, TASK-02, TASK-04 |
| TASK-07 | IMPLEMENT | `scripts/src/startup-loop/generate-process-improvements.ts` | S | TASK-02 |

### Execution notes

- TASK-01 through TASK-04 are all changes to the same file. They should be executed sequentially in a single build cycle to avoid merge conflicts on the TypeScript source.
- TASK-03 (creating the seed registry file) can be done in parallel with TASK-04 but depends on TASK-01 for the schema definition.
- TASK-05 is a doc/skill change with no code dependency — it can be committed independently once TASK-04's API is settled.
- TASK-06 tests cover all of TASK-01 through TASK-04 and should be written after the implementation is complete.
- TASK-07 is confirmatory — may reduce to a code comment addition rather than a real code change once TASK-02 is in place. If the existing drift check already covers the new filtering behavior without modification, TASK-07 can be closed as a documentation note.

### Key invariants to preserve

- The generator must remain runnable with no `completed-ideas.json` present (returns empty set, no crash). This preserves the existing `runCli()` behavior for new repositories.
- `deriveIdeaKey()` must be a pure function with no filesystem side effects, suitable for use in tests and the `--check` mode.
- The `completed-ideas.json` format must use `schema_version: "completed-ideas.v1"` to allow future migration without ambiguity.
- `appendCompletedIdea()` must be idempotent: running lp-do-build twice on the same completed plan must not produce duplicate registry entries.
