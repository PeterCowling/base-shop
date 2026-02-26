---
Plan: process-improvements-completion-lifecycle
Business-Unit: BOS
Status: Archived
Created: 2026-02-26
Completed: 2026-02-26
Dispatch-ID: IDEA-DISPATCH-20260226-0014
---

# Plan: Process-improvements completion lifecycle

## Objective

Add a completion lifecycle to the process-improvements generator so that ideas that have been actioned no longer appear in the live report. The mechanism is a registry file (`docs/business-os/_data/completed-ideas.json`) that records completed ideas by a stable hash key derived from the source file path and idea title. The generator loads this registry at startup and skips matching items when building the live report. The generator also detects fully struck-through Markdown bullets (`~~text~~`) and suppresses them as a convenience path for operators who mark done items inline. A new export (`appendCompletedIdea`) gives the lp-do-build completion step a programmatic way to write registry entries. The build skill documentation is updated to make the completion step explicit. Unit tests cover all new filtering paths and the `appendCompletedIdea` idempotency guarantee.

## Outcome Contract

- Completed ideas no longer appear in the process-improvements report after the generator runs
- `completed-ideas.json` registry is the single source of truth for completion status
- `appendCompletedIdea()` is callable by the lp-do-build post-completion step
- Strikethrough ideas (`~~text~~`) in results-review files are also suppressed
- All filtering logic is covered by unit tests in `generate-process-improvements.test.ts`
- Drift check still passes after changes (existing `runCheck` tests remain green)

## Tasks

### TASK-01 — Extend `ProcessImprovementItem` and add registry loader
**Type**: code-change
**File(s)**: `scripts/src/startup-loop/generate-process-improvements.ts`
**Complexity**: S
**Depends on**: —
**Deliverable**: New interfaces, constant, and two pure functions exported from the generator module

Add the following to `generate-process-improvements.ts`:

1. Add optional `idea_key?: string` field to the existing `ProcessImprovementItem` interface (line 19). This allows the data file and HTML report to carry the key for downstream traceability.

2. Add a new exported interface `CompletedIdeaEntry`:
   ```typescript
   export interface CompletedIdeaEntry {
     idea_key: string;
     title: string;
     completed_at: string;
     plan_slug: string;
     output_link?: string;
     source_path: string;
   }
   ```

3. Add a new exported interface `CompletedIdeasRegistry`:
   ```typescript
   export interface CompletedIdeasRegistry {
     schema_version: "completed-ideas.v1";
     entries: CompletedIdeaEntry[];
   }
   ```

4. Add the constant:
   ```typescript
   const COMPLETED_IDEAS_RELATIVE_PATH = "docs/business-os/_data/completed-ideas.json";
   ```

5. Add exported pure function `deriveIdeaKey(sourcePath: string, title: string): string` using Node `crypto.createHash('sha1')` over `${sourcePath}::${title}`. This function must have no filesystem side effects and must be deterministic for equal inputs.

6. Add exported function `loadCompletedIdeasRegistry(repoRoot: string): Set<string>` that:
   - Reads `completed-ideas.json` at `COMPLETED_IDEAS_RELATIVE_PATH` relative to `repoRoot` if the file exists.
   - Parses the JSON and returns a `Set<string>` of all `idea_key` values from `entries`.
   - Returns an empty `Set<string>` if the file does not exist (graceful degradation — preserves existing behavior for repos without the registry).
   - Returns an empty `Set<string>` if parsing fails (does not throw).

---

### TASK-02 — Add filtering logic to `collectProcessImprovements()`
**Type**: code-change
**File(s)**: `scripts/src/startup-loop/generate-process-improvements.ts`
**Complexity**: S
**Depends on**: TASK-01
**Deliverable**: `collectProcessImprovements()` skips completed and struck-through ideas; each emitted idea item carries its `idea_key`

Make two changes inside `collectProcessImprovements()` (currently lines 340–481):

1. **Registry filter**: At the very start of the function body (before the `listFilesRecursive` call), call `loadCompletedIdeasRegistry(repoRoot)` and store the result as `const completedKeys: Set<string>`. In the idea-collection loop (currently lines 392–409), after calling `parseIdeaCandidate(ideaRaw)` and computing the title, call `deriveIdeaKey(sourcePath, idea.title)` and store as `ideaKey`. If `completedKeys.has(ideaKey)`, skip this item (`continue`). Otherwise set `idea_key: ideaKey` on the pushed `ProcessImprovementItem`.

2. **Strikethrough filter**: Before the existing `filter((item) => !/^none\.?$/i.test(item))` call on `ideasRaw` (currently line 380), add a filter that removes items whose raw bullet text — after stripping the leading `- ` or `* ` marker — matches the pattern `/^~~.+~~\s*(\|.*)?$/`. When a bullet is removed by this filter, write a one-line warning to `process.stderr` in the same format as existing warnings, identifying the source path and a truncated version of the raw text.

   Note: the strikethrough filter must operate on the raw bullet text *before* `sanitizeText` strips `~~` markers, which is why it must run before `extractBulletItems` further processes the content. The most straightforward place is to add the filter on the `ideasRaw` array that `extractBulletItems` returns, using the raw string from that array. Alternatively, detect the pattern in the bullet text returned by `extractBulletItems` by checking whether the string starts and ends with `~~` (after the marker stripping in `extractBulletItems` leaves the `~~` markers intact in the joined text). Inspect the actual text returned by `extractBulletItems` to confirm which approach works correctly — the key requirement is that a bullet like `~~Add view_item_list assertions~~` is suppressed.

---

### TASK-03 — Create `completed-ideas.json` initial registry file
**Type**: code-change
**File(s)**: `docs/business-os/_data/completed-ideas.json` (new file)
**Complexity**: S
**Depends on**: TASK-01
**Deliverable**: Seed registry with the one known-completed idea from the real results-review file

Create `docs/business-os/_data/completed-ideas.json` with `schema_version: "completed-ideas.v1"` and a single seed entry for the struck-through idea already present in `docs/plans/brikette-cta-sales-funnel-ga4/results-review.user.md`:

- `source_path`: `docs/plans/brikette-cta-sales-funnel-ga4/results-review.user.md`
- `title`: the sanitized title that `parseIdeaCandidate` would produce from the raw bullet text of that struck-through entry (compute this by inspection — it is the text after strikethrough markers are stripped and `sanitizeText` applied)
- `idea_key`: the sha1 of `${source_path}::${title}` using the same algorithm as `deriveIdeaKey`
- `completed_at`: `2026-02-26`
- `plan_slug`: `brikette-smoke-view-item-list`
- `output_link`: `docs/plans/_archive/brikette-smoke-view-item-list/`

To compute the correct `idea_key` and title without risk of mismatch: after TASK-01 is in place, run the generator against the live repo to observe what key would be derived for that idea, then use that value in the seed entry. Do not guess the hash value.

---

### TASK-04 — Add `appendCompletedIdea()` export
**Type**: code-change
**File(s)**: `scripts/src/startup-loop/generate-process-improvements.ts`
**Complexity**: S
**Depends on**: TASK-01
**Deliverable**: Exported `appendCompletedIdea()` function callable by the lp-do-build completion step

Export a new function:

```typescript
export function appendCompletedIdea(
  repoRoot: string,
  entry: Omit<CompletedIdeaEntry, "idea_key">,
): void
```

Implementation requirements:

1. Derive `idea_key` using `deriveIdeaKey(entry.source_path, entry.title)`.
2. Load the existing registry using the same read-path as `loadCompletedIdeasRegistry` (or start with an empty registry if the file does not exist).
3. If an entry with the same `idea_key` already exists in the registry, return immediately without writing (idempotent).
4. Append the new entry (with `idea_key` filled in) to `entries`.
5. Write the updated registry atomically using the existing `writeFileAtomic` helper.

The function must not throw when the registry file does not exist yet — that is the initial-creation path.

---

### TASK-05 — Update lp-do-build SKILL.md completion step
**Type**: doc-change
**File(s)**: `.claude/skills/lp-do-build/SKILL.md`
**Complexity**: S
**Depends on**: TASK-04
**Deliverable**: SKILL.md Plan Completion step explicitly documents how to record completed ideas

In the "Plan Completion and Archiving" section (step 2, the paragraph ending with `pnpm --filter scripts startup-loop:generate-process-improvements`), extend the instruction to include the following after the regenerate command:

> After regenerating, for each idea in `## New Idea Candidates` that was directly actioned by this build, add an entry to `docs/business-os/_data/completed-ideas.json` by calling `appendCompletedIdea()` from `scripts/src/startup-loop/generate-process-improvements.ts` (or by writing the JSON entry directly). Record `plan_slug` (the slug of the plan just completed), `output_link` (path to the archived plan directory), `completed_at` (today's date in ISO format), `source_path` (relative path to the results-review file where the idea was found), and `title` (the sanitized idea title as it appears in the report). Re-run `pnpm --filter scripts startup-loop:generate-process-improvements` after appending so the report reflects the exclusion immediately.
>
> Only mark ideas as complete if they were directly delivered by this build. Ideas that are deferred, out of scope, or earmarked for a future plan remain in the report.

---

### TASK-06 — Add unit tests for filtering, key derivation, and `appendCompletedIdea`
**Type**: code-change
**File(s)**: `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
**Complexity**: M
**Depends on**: TASK-01, TASK-02, TASK-04
**Deliverable**: Four new test cases covering all new behavior; all existing tests continue to pass

Add the following test cases to the existing `generate-process-improvements.test.ts` file. The file already imports `collectProcessImprovements`, `runCheck`, and `updateProcessImprovementsHtml` — extend the imports to also include `deriveIdeaKey`, `appendCompletedIdea`, and `loadCompletedIdeasRegistry`.

Test cases to add:

1. **`deriveIdeaKey` determinism**: calling `deriveIdeaKey` twice with identical arguments returns the same string; calling with different `sourcePath` or different `title` returns a different string.

2. **`collectProcessImprovements` skips completed ideas**: create a temp repo with a `results-review.user.md` containing one idea bullet and a `completed-ideas.json` registry whose single entry has the `idea_key` matching that idea. Assert that `data.ideaItems` is empty.

3. **Strikethrough suppression**: create a temp repo with a `results-review.user.md` that contains one normal idea bullet and one fully struck-through bullet (e.g. `- ~~Some completed idea~~`). Assert that `data.ideaItems` has length 1 and that the struck-through idea is not present.

4. **`appendCompletedIdea` idempotency**: create a temp repo, call `appendCompletedIdea` once for a given `(source_path, title)`, then call it again with identical arguments. Read `completed-ideas.json` and assert that `entries` has exactly one entry, not two.

---

### TASK-07 — Add drift-detection comment near `runCheck()`
**Type**: code-change
**File(s)**: `scripts/src/startup-loop/generate-process-improvements.ts`
**Complexity**: S
**Depends on**: TASK-02
**Deliverable**: Code comment confirming that the existing drift check automatically covers registry-driven filtering

Add a JSDoc comment immediately above the `runCheck` function explaining that the drift check works by re-running `collectProcessImprovements` (which reads `completed-ideas.json`) and comparing the fresh output against committed files. Any change to the registry — whether a new entry is appended or an entry is removed — will cause `collectProcessImprovements` to produce different `ideaItems`, which the drift check will detect. No modification to `runCheck` is required; this comment is the complete deliverable for TASK-07.

---

## Out of scope

- Backfilling historical completed ideas beyond the single seed entry in TASK-03. Operators can manually append entries to the registry for any older ideas; no automation is needed.
- A CLI subcommand or interactive tool for marking ideas complete from the command line. The `appendCompletedIdea` export plus the SKILL.md instruction is sufficient for the lp-do-build integration path.
- Any change to the `lp-do-ideas` dispatch schema. The dispatch schema models processing of dispatch packets, not the downstream completion lifecycle of ideas; these are separate concerns.
- Filtering of `riskItems` or `pendingReviewItems`. Only `ideaItems` are eligible for the completion lifecycle. Risks resolve through the reflection-debt ledger; pending reviews resolve when the results-review file is filled in.
- UI changes to `process-improvements.user.html` to expose completion data. The HTML page will simply not receive struck-through or completed items; no new UI affordances are needed.

## Risk notes

- **Key derivation correctness for TASK-03 seed entry**: the `idea_key` in the seed registry must be computed from the exact sanitized title string that `parseIdeaCandidate` produces for the struck-through bullet in the real results-review file. If the key does not match, the idea will not be suppressed. The mitigation is to compute the key by running the code after TASK-01 is complete, not by manually hashing a guessed title string.

- **Strikethrough detection placement (TASK-02)**: `extractBulletItems` runs `sanitizeText` on joined text, which strips `~~` markers. The strikethrough filter must therefore inspect raw bullet text before that stripping. The fact-find confirms that the current `sanitizeText` removes `~~text~~` → `text`, so the filter must run on the raw `ideasRaw` items from `extractBulletItems` before `sanitizeText` has a chance to strip the markers — or on the raw line text before `extractBulletItems` processes it. Verify by reading the actual `extractBulletItems` output for a struck-through bullet before deciding the exact placement.

- **Atomic write on first registry creation (TASK-04)**: `writeFileAtomic` calls `mkdirSync(..., { recursive: true })` so the `_data/` directory will be created if absent. No additional directory handling is needed.

- **Test isolation (TASK-06)**: all new tests must use `fs.mkdtemp` temp directories and clean up in `afterEach`/`afterAll`, consistent with the existing test pattern in the file.
