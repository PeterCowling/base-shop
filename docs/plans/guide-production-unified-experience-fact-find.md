---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Created: 2026-02-08
Last-updated: 2026-02-08
Feature-Slug: guide-production-unified-experience
Related-Plan: docs/plans/guide-production-unified-experience-plan.md
Business-Unit: BOS
---

# Unified Guide Production Experience Fact-Find Brief

## Scope

### Summary

Guide production is already partially AI-driven: `/improve-en-guide` handles SEO audit/fixes, `/improve-translate-guide` handles parallel 17-locale translation, and business-os provides a web-based WYSIWYG editor with editorial sidebar, SEO scoring, and validation dashboards. But the workflow has a **gap at the start** (no AI-driven guide creation) and **gaps in the middle** (manual manifest editing, no readiness assessment, no publication automation). The goal is to make guide production end-to-end AI-driven via Claude CLI skills, with the user participating when they want/need to, and business-os serving as the monitoring/review surface.

### Architecture Principle

**AI agent via Claude CLI (or Codex CLI) is the primary production tool.** Not web UI forms with API endpoints. The agent edits files directly as part of skill/workflow execution. Business-os web app is for monitoring, reviewing, and manual refinement — not the primary creation path.

### Current Workflow (with gaps marked)

```
[MANUAL] Pick topic, decide guide type
    ↓
[SEMI-MANUAL] create-guide.ts (creates JSON stubs + outputs manifest template)
    ↓
[MANUAL] Paste manifest entry into guide-manifest.ts          ← GAP
[MANUAL] Write initial EN content                             ← GAP
    ↓
/improve-en-guide (AI: SEO audit + iterative fixes)           ✅ WORKS
    ↓
[OPTIONAL] Review in business-os web editor                   ✅ WORKS
    ↓
/improve-translate-guide (AI: parallel 17-locale translation) ✅ WORKS
    ↓
[MANUAL] Change status to "live" in manifest                  ← GAP
[MANUAL] Regenerate manifest snapshot                         ← GAP
    ↓
Guide Published
```

### Target Workflow

```
/create-guide <topic> (AI: scaffold + initial content + manifest entry)
    ↓
/improve-en-guide (AI: SEO audit + iterative fixes)
    ↓
[OPTIONAL] Review in business-os / manual adjustments
    ↓
/improve-translate-guide (AI: parallel 17-locale translation)
    ↓
/publish-guide <key> (AI: readiness check + status change + snapshot regen)
    ↓
Guide Published
```

User can intervene at any point. Each skill is independently useful. Business-os shows real-time state.

### Goals

- AI can create a new guide end-to-end from a topic brief (scaffold, content, manifest, slugs, tags)
- AI can assess guide readiness and handle publication (checklist verification, status change, snapshot regeneration)
- Business-os dashboard gains search/filter for monitoring the growing guide corpus
- All manual TypeScript file editing is eliminated from the guide production workflow
- The user can review/adjust at any stage via business-os web editor or by re-running skills

### Non-goals

- Replacing the existing WYSIWYG editor in business-os (it works, keep it for manual refinement)
- Replacing `/improve-en-guide` or `/improve-translate-guide` (battle-tested, 100% success rate)
- Building web UI forms for guide creation (the AI is the creation tool)
- Automated translation without the structure-first pattern (proven 0% success rate)
- Real-time collaborative editing
- Image upload/management system

### Constraints & Assumptions

- Constraints:
  - Skills must edit brikette's TypeScript and JSON files directly (same as existing skills do)
  - All file edits must pass `pnpm typecheck` and pre-commit hooks
  - The manifest snapshot must be regenerated after manifest changes (existing pattern)
  - Translation must use the structure-first pattern (validated by `validate-guide-structure.sh`)
  - Generated files (`generate-guide-slugs.ts`, `guides.index.ts`) must remain valid TypeScript
- Assumptions:
  - Claude CLI is the execution environment (parallel subagents available)
  - User has local dev environment with brikette and business-os repos
  - Existing validation scripts and SEO audit tooling continue to work

## Repo Audit (Current State)

### AI-Driven Capabilities (Working)

| Capability | Skill/Tool | Maturity |
|-----------|-----------|----------|
| EN content SEO audit + iterative fixes | `/improve-en-guide` | Production — score-gated, snapshot-safe |
| 17-locale parallel translation | `/improve-translate-guide` | Production — 100% success rate with structure-first |
| Interactive workflow selection | `/improve-guide` | Production — orchestrates audit + translate |
| JSON baseline validation | `baseline-validate-and-fix-json.ts` | Production — restores corrupted files from git |
| Structural validation (phases 1+2) | `validate-guide-structure.sh` | Production — section counts, IDs, body lengths |
| SEO scoring | `audit-guide-seo.ts` | Production — 10-point scale, issue categorization |
| Guide stub creation | `create-guide.ts` | Semi-manual — creates JSON stubs, outputs manifest template |

### Business-OS Web Capabilities (Working)

| Capability | Location | Status |
|-----------|----------|--------|
| Guide dashboard (list by status) | `business-os/src/app/guides/page.tsx` | Basic — no search/filter |
| Full WYSIWYG editor (Tiptap) | `business-os/.../RichTextEditor.tsx` | Complete |
| Editorial sidebar (status/areas/checklist) | `business-os/.../EditorialSidebar.tsx` | Complete |
| SEO audit integration | `business-os/.../SeoAuditBadge.tsx` + API | Complete |
| Translation coverage tracking | `business-os/api/guides/bulk-translation-status` | Complete |
| Validation dashboard | `business-os/src/app/guides/validation/page.tsx` | Complete |
| Content CRUD API | `business-os/api/guides/[guideKey]/route.ts` | Complete |
| Manifest override system | `business-os/.../manifest-overrides-fs.ts` | Complete |
| Per-site publication schema | `@acme/guide-system` (`sites` field) | Schema + code wired |

### What's Missing (Gaps)

#### GAP-1: No AI-driven guide creation skill

**Current state:** `create-guide.ts` creates JSON stubs for all locales and outputs a manifest template, but the user must manually paste the manifest entry into `guide-manifest.ts`, add slugs to `generate-guide-slugs.ts`, and add tags to `guides.index.ts`. There's no AI generation of initial content.

**What's needed:** A `/create-guide` skill that:
- Takes a topic brief (title, type, audience, key points)
- Generates the manifest entry directly into `guide-manifest.ts` (AI can edit TS files — it does this throughout the codebase)
- Generates initial EN content with SEO-ready structure (sections, intro, FAQs)
- Adds the slug mapping to `generate-guide-slugs.ts`
- Adds the key+tags entry to `guides.index.ts`
- Creates content stubs for all 18 locales
- Regenerates the manifest snapshot
- Leaves guide in `"draft"` status, ready for `/improve-en-guide`

**Why AI-driven, not web form:** The AI can make intelligent decisions about guide type, block configuration, structured data types, related guides, and initial content structure — things a web form would need complex conditional logic for. The AI already edits these same files in other skills.

#### GAP-2: No publication/readiness skill

**Current state:** To publish a guide, someone must manually change `status: "draft"` to `status: "live"` in `guide-manifest.ts`, verify all checklist items are complete, and regenerate the manifest snapshot. There's no automated readiness verification.

**What's needed:** A `/publish-guide` skill that:
- Checks all quality gates (SEO score ≥9.0, all locales translated, content complete)
- Verifies structural integrity via `validate-guide-structure.sh`
- Updates status in manifest (draft → review → live)
- Regenerates manifest snapshot
- Reports what passed/failed with evidence
- Optionally: auto-runs `/improve-en-guide` if SEO score is below threshold

#### GAP-3: No dashboard search/filter

**Current state:** Business-os guide dashboard groups by status with alphabetical sorting. With 165+ guides, finding a specific one requires scrolling. No text search, area filter, or tag filter.

**What's needed:** Client-side search and filter on the existing dashboard page. This is a web UI enhancement (not a skill) since it's about browsing/monitoring.

#### GAP-4: Tag management is code-only

**Current state:** Tags live exclusively in `guides.index.ts`. No skill or UI manages them. The AI could suggest tags during creation, but there's no workflow for updating tags on existing guides.

**What's needed:** Tags should be part of the `/create-guide` skill output. For existing guides, the AI can edit `guides.index.ts` directly when asked, or tags could be added to the manifest (where they'd be derivable like status and section).

#### GAP-5: Related guides not automated

**Current state:** `relatedGuides` arrays in the manifest are manually curated. The validation dashboard detects orphans and missing reciprocals, but fixing them requires manual manifest editing.

**What's needed:** Part of `/create-guide` (suggest related guides based on content) and potentially a `/fix-guide-links` skill that reads the validation report and auto-fixes orphans, missing reciprocals, and suggests new cross-links.

#### GAP-6: No preview link from business-os

**Current state:** `draftPathSegment` and preview token infrastructure exist, but there's no "Preview" button in the business-os editor that opens the guide on brikette.

**What's needed:** A simple "Preview on site" button in the editorial sidebar. Small web UI enhancement.

#### GAP-7: Redundant registration files could be eliminated

**Current state:** Three files contain data derivable from the manifest:
- `generate-guide-slugs.ts` — key→slug (manifest already has `slug`)
- `slugs/namespaces.ts` — key→namespace overrides (manifest already has `primaryArea`)
- `guides.index.ts` — partially redundant (only `tags` is unique data)

**What's needed:** Either auto-generate these files as part of any skill that modifies the manifest, or consolidate tags into the manifest and derive these files entirely.

### Entry Points (Skills)

- `/improve-guide` — `.claude/skills/improve-guide/SKILL.md` (orchestrator)
- `/improve-en-guide` — `.claude/skills/improve-en-guide/SKILL.md` (EN audit + fixes)
- `/improve-translate-guide` — `.claude/skills/improve-translate-guide/SKILL.md` (parallel translation)

### Entry Points (Business-OS Web)

- Dashboard: `apps/business-os/src/app/guides/page.tsx`
- Editor: `apps/business-os/src/app/guides/edit/[guideKey]/page.tsx`
- Validation: `apps/business-os/src/app/guides/validation/page.tsx`

### Key Modules / Files

**Skills & Scripts:**
- `apps/brikette/scripts/create-guide.ts` — existing scaffold script
- `apps/brikette/scripts/audit-guide-seo.ts` — SEO scoring engine
- `apps/brikette/scripts/validate-guide-structure.sh` — structural validation
- `apps/brikette/scripts/baseline-validate-and-fix-json.ts` — JSON integrity
- `apps/brikette/scripts/generate-manifest-snapshot.ts` — snapshot generator

**Guide Registration (files skills would edit):**
- `apps/brikette/src/routes/guides/guide-manifest.ts` — 4,540 lines, 165 entries
- `apps/brikette/src/data/generate-guide-slugs.ts` — 181 lines, 169 key→slug mappings
- `apps/brikette/src/data/guides.index.ts` — 297 lines, tags + derived status/section
- `apps/brikette/src/guides/slugs/overrides.ts` — 864 lines, per-locale slug overrides
- `apps/brikette/src/guides/slugs/namespaces.ts` — 165 lines, namespace overrides

**Content:**
- `apps/brikette/src/locales/{lang}/guides/content/{key}.json` — ~3,060 files across 18 locales

**Shared Package:**
- `packages/guide-system/src/manifest-types.ts` — schemas, types, `resolveGuideStatusForSite()`
- `packages/guide-system/src/content-schema.ts` — Zod content validation
- `packages/guide-system/src/block-types.ts` — 14 block type schemas

### Patterns & Conventions Observed

- **AI edits TypeScript directly** — all existing skills (build-feature, improve-en-guide, etc.) edit TS files. No AST manipulation needed — the AI understands the file structure.
- **Validation-gated workflows** — every skill runs validation scripts before and after changes. Evidence: `/improve-en-guide` runs `baseline-validate-and-fix-json.ts` first, `audit-guide-seo.ts` after each edit.
- **Structure-first, translate-second** — translation must never happen alongside structural changes. Evidence: 0% success rate for combined approach vs 100% for structure-first. Memory note in `MEMORY.md`.
- **Snapshot-safe editing** — skills take snapshots before modifying content files. Evidence: `/improve-en-guide` SKILL.md safety protocol.
- **Manifest override pattern** — business-os layers JSON overrides on TS manifest. Evidence: `manifest-overrides-fs.ts`.

### Data & Contracts

- Types/schemas:
  - `GuideManifestEntry` — 20+ fields, full Zod schema via `createManifestEntrySchema()`
  - `GuideContentInput` — strict content schema (seo, sections, faqs, intro, etc.)
  - `GuideBlockDeclaration` — discriminated union of 14 block types
  - `ManifestOverride` — areas, primaryArea, status, draftPathSegment, auditResults
- Persistence:
  - Guide content: `apps/brikette/src/locales/{lang}/guides/content/{key}.json`
  - Manifest source: `apps/brikette/src/routes/guides/guide-manifest.ts` (TypeScript)
  - Manifest overrides: `apps/brikette/src/data/guides/guide-manifest-overrides.json`
  - Manifest snapshot: `apps/brikette/src/data/guides/guide-manifest-snapshot.json`
  - Registration files: `generate-guide-slugs.ts`, `guides.index.ts`, `slugs/overrides.ts`, `slugs/namespaces.ts`

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/guide-system` — types, schemas, registry
  - `@acme/guides-core` — URL routing helpers
  - Brikette scripts — SEO audit, validation, snapshot generation
- Downstream dependents:
  - Brikette build — consumes manifest, content, generated files at build time
  - Brikette runtime — guide rendering, SEO, structured data
  - Business-os — reads manifest snapshot for dashboard/editor
  - Staging/production deploys — guide visibility controlled by status
- Likely blast radius:
  - New skills: isolated (skill files only)
  - File edits by skills: same blast radius as manual edits — validated by typecheck + pre-commit hooks
  - Dashboard UI changes: isolated (internal tool)

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (business-os, brikette), Vitest (guide-system)
- **Commands:** `pnpm --filter brikette test`, `pnpm --filter business-os test`
- **Validation scripts:** `validate-guide-structure.sh`, `audit-guide-seo.ts`, `baseline-validate-and-fix-json.ts`
- **CI integration:** Pre-commit hooks (typecheck-staged, lint-staged-packages)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Guide status filtering | unit | `brikette/.../guide-status-filtering.test.ts` | 8 tests (TC-21–24, TC-05, TC-42–44) |
| Per-site publication | unit | `guide-system/.../manifest-sites.test.ts` | 5 tests (TC-34–38) |
| Content readiness/i18n | unit | `brikette/.../content-readiness/` | i18n parity, namespace migration |
| SEO audit | script | `audit-guide-seo.ts` | Scoring engine with 10-point scale |
| Structural validation | script | `validate-guide-structure.sh` | Section counts, IDs, body lengths |
| JSON integrity | script | `baseline-validate-and-fix-json.ts` | All-locale JSON parse check |

#### Coverage Gaps
- No automated tests for skill workflows (skills are tested by running them)
- No tests for `create-guide.ts` script output
- No tests for manifest snapshot generation correctness

#### Testability Assessment
- **Easy to test:** Validation scripts (CLI, deterministic), Zod schemas (pure functions), file generation (compare output)
- **Hard to test:** AI content generation quality (subjective), skill orchestration (multi-step)
- **Test seams:** Skills produce files that can be validated by existing scripts — the validation scripts ARE the test suite

#### Recommended Test Approach
- **Validation-gated:** Each skill should run existing validation scripts as gates (already the pattern)
- **Regression tests:** After `/create-guide` runs, verify output passes `pnpm typecheck`, `validate-guide-structure.sh`, and `audit-guide-seo.ts`
- **Snapshot comparison:** Verify generated TS files match expected format

### Recent Git History (Targeted)

- `guide-status-single-source` work (this session) — manifest is now single source of truth for status, brikette uses `resolveGuideStatusForSite()`
- `guide-publication-decoupling` — added `sites` field to manifest schema, per-site publication support
- WYSIWYG editor and editorial sidebar landed in business-os (from archived plans)

## Questions

### Resolved

- Q: Should guide creation be web-form-driven or AI-driven?
  - A: AI-driven via Claude CLI skills. The AI edits TypeScript files directly (proven pattern across the codebase). Business-os web app is for monitoring and manual refinement.
  - Evidence: User direction; all existing skills edit files directly

- Q: Can the AI reliably edit `guide-manifest.ts` (4,540-line TypeScript file)?
  - A: Yes — the AI already edits this file in the guide-status-single-source work (this session). The file has a clear repetitive structure (schema-validated entries). AI can find insertion points and add new entries.
  - Evidence: Commit `0f84589476` modified 72 entries in this file

- Q: What validation catches errors in AI-generated guide registrations?
  - A: Multiple layers: `GUIDE_MANIFEST_ENTRY_SCHEMA.parse()` at runtime (Zod), `pnpm typecheck` (TypeScript), pre-commit hooks (eslint, typecheck-staged), `validate-guide-structure.sh` (structural), `audit-guide-seo.ts` (quality). If the AI gets it wrong, the build fails fast.
  - Evidence: All existing skills use these same validation layers

- Q: Does the `create-guide.ts` script handle everything needed?
  - A: No — it creates JSON stubs and outputs a manifest template, but doesn't write to `guide-manifest.ts`, `generate-guide-slugs.ts`, or `guides.index.ts`. It also doesn't generate initial content. A skill would wrap this script AND handle the remaining steps.
  - Evidence: `create-guide.ts` source code

- Q: Are there existing patterns for skills that edit multiple files atomically?
  - A: Yes — `/build-feature` routinely edits multiple files, runs validation, and commits. The writer lock prevents concurrent clobbering. Pre-commit hooks catch errors.
  - Evidence: `scripts/agents/with-writer-lock.sh`, all build-feature task executions

- Q: Should `/create-guide` generate full initial content or just structural scaffolding?
  - A: Full initial content (AI-written sections, FAQs, intro). The AI generates content, `/improve-en-guide` refines it, the user can review/adjust in business-os before translation. Draft status + user review step mitigates risk of inaccurate local knowledge.
  - Evidence: User decision (2026-02-08)

### Open (User Input Needed)

None — all questions resolved.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 85%
  - Strong existing patterns — skills already edit TS files, run validation scripts, and use parallel subagents. The main new work is a `/create-guide` skill and a `/publish-guide` skill. The AI knows how to edit `guide-manifest.ts` (proven this session). Dashboard search is straightforward React. What would raise to 90%: run a dry-run of the `/create-guide` workflow manually (add one guide via AI) and verify all validation passes.

- **Approach:** 88%
  - AI-driven via CLI skills is the right architecture — it's how the existing guide workflow works, it's how the entire build-feature system works, and it avoids building complex web UI forms. Business-os as monitoring surface is the right split. What would raise to 90%: confirm the user is happy with this architecture (answered — they explicitly asked for CLI/skill-driven).

- **Impact:** 85%
  - Blast radius is well-understood — new skills are isolated, file edits are validated by existing toolchain (typecheck, eslint, validation scripts). Business-os dashboard changes are internal only. What would raise to 90%: verify that a full create→improve→translate→publish cycle produces correct output end-to-end.

- **Testability:** 80%
  - Existing validation scripts (SEO audit, structural validation, JSON integrity, typecheck) serve as the test suite. New skills just need to run them as gates. Dashboard UI changes are tested manually. What would raise to 90%: add a regression test that runs `/create-guide` in dry-run mode and validates output against all existing scripts.

## Planning Constraints & Notes

- Must-follow patterns:
  - Skills edit files directly (no API intermediary for creation)
  - All edits validated by: `pnpm typecheck`, pre-commit hooks, validation scripts
  - Structure-first, translate-second (for any translation work)
  - Snapshot-safe editing (take snapshots before modifying content files)
  - Writer lock for git commits (`scripts/agents/with-writer-lock.sh`)
  - New guides start as `status: "draft"` — never auto-publish to live
- Rollout/rollback expectations:
  - Skills can be built and shipped independently
  - Each skill is useful standalone (no all-or-nothing dependency)
  - Business-os dashboard improvements are independent of skill work
  - Rollback: git revert any AI-generated files
- Observability expectations:
  - Skills report what they did (files created/modified, validation results)
  - Business-os dashboard reflects current state (manifest snapshot)
  - Validation scripts provide detailed error output

## Suggested Task Seeds (Non-binding)

### New Skills (AI-driven production)

1. **`/create-guide` skill** (GAP-1) — Takes topic brief → generates manifest entry in `guide-manifest.ts`, slug in `generate-guide-slugs.ts`, tags in `guides.index.ts`, initial EN content JSON, locale stubs for all 18 locales, regenerates manifest snapshot. Leaves guide in draft status.

2. **`/publish-guide` skill** (GAP-2) — Takes guide key → checks all quality gates (SEO ≥9.0, all locales translated, content complete, structural validation), updates status in manifest (draft→review or review→live), regenerates manifest snapshot. Reports pass/fail with evidence.

3. **`/fix-guide-links` skill** (GAP-5) — Reads validation dashboard data (orphans, missing reciprocals) → auto-fixes `relatedGuides` arrays in manifest, suggests cross-link insertions in content.

### Business-OS Web Enhancements (monitoring/review surface)

4. **Dashboard search & filter** (GAP-3) — Add text search, area filter, status filter to guide dashboard. Client-side filtering.

5. **Preview button** (GAP-6) — Add "Preview on site" button in editorial sidebar that opens brikette URL with preview token.

### Infrastructure Improvements

6. **Auto-generate redundant files** (GAP-7) — Script that regenerates `generate-guide-slugs.ts` and namespace overrides from manifest. Run as part of snapshot generation. Eventually consolidate tags into manifest to eliminate `guides.index.ts` manual maintenance.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None — all questions resolved
- Recommended next step: Proceed to `/plan-feature guide-production-unified-experience`
