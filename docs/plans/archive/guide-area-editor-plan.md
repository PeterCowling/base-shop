> **Status: Superseded** — Absorbed into the [Unified Guide System Plan](../../.claude/plans/vivid-scribbling-pumpkin.md). All tasks from this plan are either completed or tracked there.

---
Type: Plan
Status: Active
Domain: CMS
Relates-to charter: none
Created: 2026-01-26
Last-reviewed: 2026-01-26
Last-updated: 2026-01-26
Overall-confidence: 88%
---

# Editable Guide Areas Plan


## Active tasks

No active tasks at this time.

## Summary

Enable content editors to select which site areas a guide publishes to (Experiences, Help, How to get here) via the editorial panel UI. Currently, areas are hardcoded in TypeScript (`guide-manifest.ts`) and require developer intervention to change.

## Success Signals (What “Good” Looks Like)

- Editors can change a guide’s areas + primary area from the editorial panel and see the updated pills immediately.
- The changes persist (refresh/new tab) and are reflected anywhere routing/grouping is derived from the manifest (e.g., base namespace selection).
- Invalid configurations are prevented (at least one area selected; primary area must be one of the selected areas).
- Changes are gated behind guide authoring + preview token and do not impact production runtime unless explicitly enabled.

## Audit Updates (2026-01-26)

Concrete repo findings that reduce implementation risk and remove unknowns:

- `apps/brikette/src/routes/guides/guide-manifest.ts` is imported by client-side guide rendering (via `GuideContent.tsx`), so **it must remain browser-safe** (no `fs` imports).
- Namespace routing/grouping is already derived from manifest areas in `apps/brikette/src/guides/slugs/namespaces.ts`, but `GUIDE_BASE_KEY_OVERRIDES` currently takes precedence over the manifest for many keys; this would make “editable areas” ineffective without adjusting precedence.
- The editorial panel already renders `manifest.areas` + `manifest.primaryArea` (`GuideEditorialPanel.tsx`) and is a natural place for inline editing in authoring mode.
- Existing authoring API patterns exist and are already gated by `isGuideAuthoringEnabled()` + preview token (`apps/brikette/src/app/api/guides/[guideKey]/route.ts`).

## Current Architecture

| Component | Location | Editable? |
|-----------|----------|-----------|
| Guide content (intro, sections, faqs) | `apps/brikette/src/locales/{lang}/guides/content/{key}.json` | Yes (via Guide Editor) |
| Guide manifest (areas, status, structuredData) | `apps/brikette/src/routes/guides/guide-manifest.ts` | No (hardcoded TypeScript) |
| Rendering overrides | `apps/brikette/src/config/guide-overrides.ts` | No (hardcoded TypeScript) |

## Proposed Architecture

Introduce a JSON-based manifest override layer that merges with the TypeScript manifest at runtime:

```
TypeScript manifest (defaults) + JSON overrides (editable) = Runtime manifest
```

**Storage (committed, dev-editable):** `apps/brikette/src/data/guides/guide-manifest-overrides.json`

Notes:

- This feature is designed for **local authoring / preview environments** where edits are committed back to the repo, not for “edit production content live”.
- Do **not** rely on bundler/HMR semantics for JSON imports. Treat overrides as a Node-only FS read so API writes are always reflected when the server reads from disk.
  - UI immediacy comes from optimistic UI + GET-after-PUT, not from module-level JSON imports.

**Override schema:**
```typescript
type ManifestOverride = {
  areas?: GuideArea[];
  primaryArea?: GuideArea;
};
type ManifestOverrides = Record<GuideKey, ManifestOverride>;
```

## Milestones

| Milestone | Focus | Effort | CI |
|-----------|-------|--------|-----|
| 1 | Schema + storage layer (types + JSON + IO) | S | **90%** |
| 2 | Migration + namespace merge (manifest-first) | M | **88%** |
| 3 | Authoring API (GET/PUT overrides) | S | **90%** |
| 4 | Editorial panel UI (toggle + autosave + errors) | M | **90%** |

## Tasks

### TASK-01: Create manifest override schema and types
- **Affects:** `apps/brikette/src/routes/guides/guide-manifest-overrides.ts` (new file)
- **CI:** 90%
  - Implementation: 92% — straightforward Zod schema, mirrors existing `GuideArea` types.
  - Approach: 90% — keeps overrides minimal (areas + primaryArea) to avoid expanding scope into status/publishing workflows.
  - Impact: 90% — additive and isolated.
- **Acceptance:**
  - Zod schema validates override structure
  - Schema enforces: `primaryArea` must be included in `areas` when both are provided
  - TypeScript types exported for use in API and UI
  - Unit tests for: valid overrides, invalid primaryArea, empty areas rejection

### TASK-02: Create JSON storage file with loader/writer
- **Affects:** `apps/brikette/src/data/guides/guide-manifest-overrides.json` (new), `apps/brikette/src/routes/guides/guide-manifest-overrides.node.ts` (new)
- **CI:** 90%
  - Implementation: 90% — reuse the safe “scoped path” + atomic write approach from `apps/brikette/src/locales/_guides/node-loader.ts`.
  - Approach: 90% — committed JSON keeps the runtime browser-safe while enabling authoring via API in dev.
  - Impact: 90% — additive.
- **Acceptance:**
  - Empty JSON object `{}` created as default
  - `loadGuideManifestOverridesFromFs()` reads and validates JSON (Node-only)
  - `writeGuideManifestOverridesToFs()` writes atomically (write temp → rename)
  - Handles missing file gracefully (returns `{}`) in authoring mode

### TASK-03a: Migrate existing `GUIDE_BASE_KEY_OVERRIDES` into manifest overrides (no behavior change)

- **Affects:** `apps/brikette/src/guides/slugs/namespaces.ts`, `apps/brikette/src/data/guides/guide-manifest-overrides.json`
- **CI:** 88%
  - Implementation: 85% — one-time mapping from base namespace → `GuideArea` (`assistance` → `help`, `experiences` → `experience`, `howToGetHere` → `howToGetHere`).
  - Approach: 90% — preserves current routing/grouping behavior before precedence changes.
  - Impact: 85% — touches routing classification; must be verified with tests.
- **Acceptance:**
  - For every key in `GUIDE_BASE_KEY_OVERRIDES`, JSON overrides define `areas: [mappedPrimary]` and `primaryArea: mappedPrimary`
  - A targeted test snapshot asserts “base namespace by guide key” is identical before vs after precedence change

### TASK-03: Integrate overrides into manifest resolution
- **Affects:** `apps/brikette/src/routes/guides/guide-manifest.ts`, `apps/brikette/src/guides/slugs/namespaces.ts`
- **CI:** 88%
  - Implementation: 88% — merge logic is straightforward, but requires careful separation of browser-safe defaults vs Node-only override loading.
  - Approach: 90% — make the manifest the single source of truth by reducing `GUIDE_BASE_KEY_OVERRIDES` to fallback-only *after migration* (TASK-03a).
  - Impact: 85% — impacts routing/grouping; mitigate with migration + targeted tests.
- **Acceptance:**
  - Node/server consumers can resolve a merged manifest (TypeScript + FS-loaded overrides)
  - Override values take precedence over TypeScript defaults, but are validated (no invalid runtime state)
  - `guideNamespaceKey()` and `publishedGuideKeysByBase()` respect manifest areas first; `GUIDE_BASE_KEY_OVERRIDES` only applies when a manifest entry is missing
  - Dev loop: updating overrides via API is reflected on the next request without requiring a server restart

### TASK-04: Create API endpoints for manifest overrides
- **Affects:** `apps/brikette/src/app/api/guides/[guideKey]/manifest/route.ts` (new)
- **CI:** 90%
  - Implementation: 90% — follow existing authoring API pattern: Node runtime + preview token gating.
  - Approach: 90% — API updates overrides; server-side resolution reads merged state via FS.
  - Impact: 90% — additive and gated.
- **Acceptance:**
  - `GET /api/guides/{guideKey}/manifest` returns current manifest (merged) + current override (if any)
  - `PUT /api/guides/{guideKey}/manifest` updates overrides for a specific guide key (areas + primaryArea)
  - Preview token required (same as content API)
  - Validates input against schema
  - Writes keep a small rollback foothold (e.g., `.bak` file) for local recovery

### TASK-05: Add area selector UI to editorial panel
- **Affects:** `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx`
- **CI:** 90%
  - Implementation: 90% — replace pills with toggles in authoring mode; reuse existing translation label map.
  - Approach: 90% — **decision locked**: edit in the editorial panel with **auto-save** + inline "Saving…"/"Saved" status.
  - Impact: 90% — gated behind authoring flag + preview token; non-authoring view remains read-only.
- **Acceptance:**
  - All three areas shown as toggleable options
  - Primary area indicated with visual distinction
  - At least one area must be selected (validation)
  - Changes persist via API call
  - Clear failure UX (inline error + revert to last-known-good state)
- **Testing:**
  - Integration tests for the editorial panel save flow (mock API, verify optimistic UI, verify error handling + rollback)

### TASK-06: Update "Publish to" display logic
- **Affects:** `apps/brikette/src/routes/guides/guide-seo/components/GuideEditorialPanel.tsx`
- **CI:** 90%
  - Implementation: 90% — straightforward conditional rendering + small styling tweaks.
  - Approach: 90% — reduce visual noise when primary is implied.
  - Impact: 90% — minimal.
- **Acceptance:**
  - "Primary" badge hidden when guide has only one area
  - Area labels properly translated
  - Visual feedback for editable vs display-only state

## Patterns to Follow

- **API pattern:** `apps/brikette/src/app/api/guides/[guideKey]/route.ts` — preview token auth, JSON response
- **Storage pattern:** `apps/brikette/src/locales/_guides/node-loader.ts` — scoped FS access + atomic-ish writes
- **Override pattern:** `apps/brikette/src/config/guide-overrides.ts` — per-guide configuration patterns

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Edits are not supported on read-only production FS | Gate API/UI behind authoring + preview token; treat JSON as committed source of truth |
| “Editable areas” has no effect due to `GUIDE_BASE_KEY_OVERRIDES` precedence | Make overrides fallback-only when no manifest entry exists; add namespace selection tests |
| Breaking existing guides with wrong area config | Validate that at least one area is selected; preserve existing behavior for guides without overrides |
| Preview-only feature leaking to production | Gate all UI and API behind `isGuideAuthoringEnabled()` |
| An override causes unintended routing/grouping | Git revert of JSON file; maintain a `.bak` write on each update; follow up with an “undo” UI if this becomes common |

## Non-goals (This Iteration)

- Editing guide lifecycle status (`draft`/`review`/`live`) from the UI.
- Making “live production edits” without committing changes back to the repo.
- Replacing other guide metadata systems (e.g., `apps/brikette/src/data/guides.index.ts`) outside of namespace/area routing.

## Acceptance Criteria (Overall)

- [ ] Content editors can select/deselect areas for any guide
- [ ] Primary area can be designated when multiple areas selected
- [ ] Changes persist across page reloads
- [ ] Existing guides without overrides continue working unchanged
- [ ] Feature gated behind guide authoring flag
- [ ] Namespace routing/grouping respects edited areas (manifest-first)

## Estimated Effort

- **TASK-01:** S (1-2 hours)
- **TASK-02:** S (1-2 hours)
- **TASK-03a:** M (2-4 hours) — migration + snapshot tests
- **TASK-03:** L (4-6 hours) — merge logic + precedence flip + tests
- **TASK-04:** S (1-2 hours)
- **TASK-05:** M (2-4 hours)
- **TASK-06:** S (30 min)

**Total:** ~12-18 hours across tasks
