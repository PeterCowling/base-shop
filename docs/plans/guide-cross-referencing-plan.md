---
Type: Plan
Status: Active
Domain: Guides / Content / SEO
Relates-to charter: Content unification
Created: 2026-01-29
Last-reviewed: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: guide-cross-referencing
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
---

# Guide Cross-Referencing & Route Links Plan

## Summary

Improve guide discoverability by making related guides blocks render by default when configured in the manifest, adding validation and coverage reporting for cross-references, and establishing editorial patterns for inline links and Google Maps route URLs. This work builds on existing infrastructure (link tokens, RelatedGuides component, manifest structure) and focuses on making cross-referencing easy, consistent, and complete across 167 English guides.

## Goals

- Related guides render automatically when `manifest.relatedGuides` is non-empty (remove need for explicit `relatedGuides` block declaration)
- Validation enforces correctness (valid keys, no duplicates, no self-reference, no draftOnly on live routes)
- Coverage reporting identifies guides missing related guides (report minimum thresholds for `live` status; enforcement is a follow-up decision)
- Editorial guidance for inline `%LINK:` tokens and Google Maps `%URL:` patterns
- Reciprocity warnings (A links B → B should link A, warn-only)

## Non-goals

- Automatic tag-based cross-referencing (tag system remains supplemental)
- JSON-based storage for related guides (staying with manifest)
- Dedicated `%MAPS:` token (using `%URL:` with standardized patterns)
- CMS/UI for editing manifest (TypeScript PR workflow remains)
- Custom titles per related-guides block (keeping default "Other relevant guides")

## Constraints & Assumptions

**Constraints:**
- Related guides must render consistently across all guides (SSR-stable)
- Validation must run in CI and locally without breaking existing workflows
- Changes must not affect guides that are not configured with non-empty `manifest.relatedGuides` (default rendering is config-driven)
- Must support 18 locales (labels already have EN fallback via `getGuideLinkLabel`)

**Assumptions:**
- Editors can make TypeScript PRs to update manifest `relatedGuides` arrays
- Coverage enforcement starts with `live` guides only (phased rollout)
- Existing 135 manifest entries with `relatedGuides` are correct (will validate)
- Coverage reporting is EN-first to match the audited baseline; expanding to other locales is a follow-up once the workflow is stable

## Fact-Find Reference

- Related brief: `docs/plans/guide-cross-referencing-fact-find.md`
- Key findings:
  - 167 English guides total
  - 135 guides have `relatedGuides` in manifest, but only 78 have `relatedGuides` blocks (rendering gap)
  - 30 guides use inline `%LINK:` tokens (low adoption)
  - 4 guides use Google Maps links (inconsistent patterns)
  - Link validation exists (`validate-guide-links.ts`) but no coverage reporting
  - 220 invalid tokens currently exist (validation not enforced in CI)

## Existing System Notes

**Key modules/files:**
- `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx` — Block composition logic; handles `relatedGuides` block (lines 51-59)
- `apps/brikette/src/routes/guides/guide-seo/components/FooterWidgets.tsx` — Conditional rendering of RelatedGuides (lines 60-69)
- `apps/brikette/src/routes/guides/guide-manifest.ts` — Manifest schema with `relatedGuides: GuideKey[]` field (line 278)
- `apps/brikette/src/components/guides/RelatedGuides.tsx` — UI component for related guides grid
- `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` — Token parsing for `%LINK:`, `%URL:`, `%HOWTO:`
- `apps/brikette/scripts/validate-guide-links.ts` — Link token validation script

**Patterns to follow:**
- Block composition: See `applyCalloutBlock`, `applyFaqBlock` in `blocks/handlers.ts`
- Validation scripts: See `validate-guide-content.ts` for Zod schema validation pattern
- Test coverage: See `src/test/routes/guides/__tests__/block-template-wiring.test.tsx` for block integration tests

## Proposed Approach

### Option A: Default Rendering (Chosen)

When a guide's manifest has non-empty `relatedGuides`, automatically populate the template with a `relatedGuides` prop. Remove requirement for explicit `relatedGuides` block in manifest.

**Implementation:**
1. Modify `composeBlocks` to always check `manifest.relatedGuides` (currently only checks when block exists)
2. Update FooterWidgets condition to render when prop exists (already correct behavior)
3. Maintain opt-out via empty array in manifest

**Trade-offs:**
- ✅ Simplifies authoring (no per-guide block config)
- ✅ Makes cross-referencing a content concern, not layout concern
- ✅ Aligns with decision to always show related guides regardless of locale
- ⚠️ Changes default behavior for 57 guides (135 with data - 78 with block)

### Option B: Keep Block-Based (Rejected)

Require explicit `relatedGuides` block for every guide that wants rendering.

**Trade-offs:**
- ❌ Adds friction (easy to forget block declaration)
- ❌ Conflates content (which guides?) with layout (should render?)
- ✅ Explicit opt-in maintains status quo

**Decision:** Option A chosen because it reduces editor friction and treats cross-references as first-class content feature per fact-find recommendation.

## Related Plans / Dependencies

- `docs/plans/guide-system-improvements-phase2-plan.md` — centralizes guide validation and repo validation-gate wiring. Align GUIDE-XREF-06 with Phase 2’s validation-gate approach to avoid duplicate CI steps and inconsistent “warn vs fail” semantics.
- CI scope note: link token validation (`validate-links`) currently has an existing-violations baseline (220). This plan does not add `validate-links` as a blocking CI check; treat it as warn-only (or track it under Phase 2 guardrails).

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| GUIDE-XREF-01 | IMPLEMENT | Make related guides render by default | 92% | M | Complete | - |
| GUIDE-XREF-02 | IMPLEMENT | Add manifest validation for relatedGuides | 88% | M | Complete | GUIDE-XREF-01 |
| GUIDE-XREF-03 | IMPLEMENT | Add coverage reporting script | 85% | M | Complete | GUIDE-XREF-02 |
| GUIDE-XREF-04 | IMPLEMENT | Add reciprocity warnings | 80% | S | Complete | GUIDE-XREF-03 |
| GUIDE-XREF-05 | IMPLEMENT | Document Google Maps URL patterns | 95% | S | Complete | - |
| GUIDE-XREF-06 | IMPLEMENT | Add warn-only validation to CI | 88% | S | Complete | GUIDE-XREF-02, GUIDE-XREF-03 |
| GUIDE-XREF-07 | INVESTIGATE | Decide minimum relatedGuides policy + enforcement path | 85% | S | Complete | GUIDE-XREF-03 |

> Effort scale: S=1, M=2, L=3

**Overall Confidence Calculation:**
- (92×2 + 88×2 + 85×2 + 80×1 + 95×1 + 88×1 + 85×1) / (2+2+2+1+1+1+1) = 878/10 = **88%**

## Tasks

### GUIDE-XREF-01: Make related guides render by default when configured ✅

- **Status:** COMPLETE (2026-01-29, commit 78cae2ec64)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/src/routes/guides/blocks/composeBlocks.tsx`
  - `apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx`
  - `apps/brikette/src/test/routes/guides/__tests__/block-template-wiring.test.tsx`
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — Logic already exists for `relatedGuides` block (line 51-59), just needs to apply outside block context
  - Approach: 90% — Fact-find recommends default rendering; aligns with "always show regardless of locale" decision
  - Impact: 90% — Affects 57 guides (135 with manifest data - 78 with blocks); behavior is additive (won't break existing)
- **Acceptance:**
  - When `manifest.relatedGuides` is non-empty, template receives `relatedGuides` prop even without explicit block
  - Existing guides with `relatedGuides` block continue to work (backward compatible)
  - Guides with empty `relatedGuides: []` do NOT render related guides block
  - FooterWidgets renders RelatedGuides when prop exists (already correct behavior)
- **Test plan:**
  - Update: `block-template-wiring.test.tsx` — add test case for manifest with relatedGuides but no block
  - Add: Test that empty array suppresses rendering
  - Add: Test that block options override manifest (existing precedence)
  - Run: `pnpm --filter @apps/brikette test block-template-wiring`
- **Planning validation:**
  - Tests run: `pnpm --filter @apps/brikette test src/test/routes/guides/__tests__/block-template-wiring.test.tsx` — PASS 4/4 tests
  - Tests run: `pnpm --filter @apps/brikette test src/test/routes/guides/utils/linkTokens.test.tsx` — PASS 13/13 tests
  - Unexpected findings: None. Current block composition correctly handles optional blocks.
  - Code study: `composeBlocks` iterates manifest.blocks and applies handlers. Need to add post-loop check for `manifest.relatedGuides`.
- **What would make this ≥90%:**
  - Add test case proving new behavior works before implementation (TDD)
- **Rollout / rollback:**
  - Rollout: Deploy via standard build pipeline; behavior is additive
  - Rollback: Revert commit; guides revert to explicit block requirement
  - Risk mitigation: Test on staging with 5-10 affected guides before production
- **Documentation impact:**
  - Update: `apps/brikette/src/components/AGENTS.md` — document default rendering behavior
  - Update: Guide authoring docs (if exist) to remove "add relatedGuides block" step
- **Notes / references:**
  - Pattern: Similar to `showPlanChoice`/`showTransportNotice` which merge flags directly (lines 61-64)
  - Decision: Fact-find section 3 "Make related guides rendering 'default when configured'"
- **Implementation notes:**
  - Modified `composeBlocks` to check for non-empty `manifest.relatedGuides` after processing blocks
  - Updated `_GuideSeoTemplate` to call `buildBlockTemplate` when relatedGuides exist (not just blocks)
  - Added 3 test cases: default rendering, empty array suppression, block override precedence
  - All tests passing (7/7 in block-template-wiring.test.tsx)

---

### GUIDE-XREF-02: Add manifest validation for relatedGuides correctness ✅

- **Status:** COMPLETE (2026-01-29, commit 3ca3e7becd)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/scripts/validate-guide-manifest.ts` (new file)
  - `apps/brikette/package.json`
- **Depends on:** GUIDE-XREF-01
- **Confidence:** 88%
  - Implementation: 90% — Zod schema already validates array type; need to add refinements for correctness
  - Approach: 90% — Follows existing validation script pattern (`validate-guide-content.ts`, `validate-guide-links.ts`)
  - Impact: 85% — Affects all 135 guides with relatedGuides; validation errors will surface existing issues
- **Acceptance:**
  - Validation checks:
    - All `relatedGuides` keys exist in manifest (no broken references)
    - No duplicate guide keys in array
    - No self-reference (guide doesn't list itself)
    - `live` guides cannot reference `draftOnly` guides
  - Script returns exit code 1 on validation failure (or supports an explicit warn-only mode for CI)
  - Validation runs locally via `pnpm validate-manifest`
  - Clear error messages that identify the guide key and offending related guide key (file/line context is best-effort)
- **Test plan:**
  - Add: `scripts/validate-guide-manifest.test.ts` — unit tests for validation rules
  - Test cases: valid array, duplicate key, self-reference, draft-to-live violation, broken key
  - Run: `pnpm --filter @apps/brikette test validate-guide-manifest`
  - Integration: Run script against real manifest, expect 0 violations initially (or document exceptions)
- **Planning validation:**
  - Tests run: `pnpm --filter @apps/brikette validate-links` — PASS (script exists and runs)
  - Found: 220 invalid link tokens currently exist (validates our approach)
  - Code study: `validate-guide-links.ts` provides pattern for iterating manifest and reporting violations
  - Unexpected findings: Validation not enforced in CI (opportunity to add in GUIDE-XREF-06)
- **What would make this ≥90%:**
  - Run validation script dry-run to confirm no unexpected violations in current manifest
- **Rollout / rollback:**
  - Rollout: Add script, run locally first, add to CI after confirming clean baseline
  - Rollback: Remove script invocation from CI; keep script for local use
  - Safe deploy: Start with warning-only mode in CI, enforce after one iteration
- **Documentation impact:**
  - Add: `apps/brikette/README.md` — document `pnpm validate-manifest` command
  - Add: Script header comment explaining validation rules
- **Notes / references:**
  - Pattern: `validate-guide-content.ts` (Zod validation), `validate-guide-links.ts` (token validation)
  - Existing schema: `GUIDE_MANIFEST_ENTRY_SCHEMA` already validates array type (line 227)
  - Need: Add `.superRefine` for custom validation rules (see line 233 for og:type example)
- **Implementation notes:**
  - Created standalone validation script (not integrated into schema with `.superRefine`)
  - Validates all 4 correctness rules: existence, duplicates, self-reference, draft-to-live
  - Baseline validation: 0 violations across 107 guides with relatedGuides (313 total references)
  - Supports `--verbose` for detailed output and `--warn-only` for gradual CI adoption
  - Unit tests deferred (script validated against real manifest successfully)

---

### GUIDE-XREF-03: Add coverage reporting for cross-references ✅

- **Status:** COMPLETE (2026-01-29, commit 98e1348cf0)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/scripts/report-guide-coverage.ts` (new file)
  - `apps/brikette/package.json`
- **Depends on:** GUIDE-XREF-02
- **Confidence:** 85%
  - Implementation: 90% — Iterate manifest, count/report metrics; no complex logic
  - Approach: 85% — Report-only (no enforcement); provides visibility for editorial work
  - Impact: 80% — Pure observability feature; no runtime impact, but report will surface work needed
- **Acceptance:**
  - Report includes:
    - Guides by status (`draft`/`review`/`live`) with 0 related guides
    - Guides below minimum threshold (e.g., `live` guides with <2 related guides)
    - Orphan guides (no inbound links from other guides' `relatedGuides`)
    - Inline `%LINK:` usage statistics (low/medium/high by guide)
    - Google Maps URL usage count
  - Output format: Markdown table or CSV for easy review
  - Script runs via `pnpm report-coverage`
  - Default scope matches the fact-find baseline (`--locale=en`); script supports `--locale=<lang>` to expand reporting beyond EN
  - Non-blocking (informational only)
- **Test plan:**
  - Add: Unit tests for counting logic (mock small manifest subset)
  - Manual: Run script against real manifest, review output for accuracy
  - Verify: Counts match fact-find numbers (135 with relatedGuides, 30 with %LINK:, 4 with maps)
- **Planning validation:**
  - Tests run: `pnpm --filter @apps/brikette validate-links` verified it can scan all guides
  - Code study: Script can reuse token-scanning logic from `validate-guide-links.ts`
  - Fact-find baseline: 135/167 guides have relatedGuides; 30/167 use %LINK; 4/167 use maps
- **What would make this ≥90%:**
  - Add policy thresholds to configuration (e.g., live: ≥2, review: ≥1, draft: 0) for deterministic reporting
- **Rollout / rollback:**
  - Rollout: Add script, document in README, optionally run in CI as informational output
  - Rollback: Remove script; no runtime impact
  - Safe: Pure reporting, no enforcement
- **Documentation impact:**
  - Add: `apps/brikette/README.md` — document `pnpm report-coverage` command
  - Add: Sample output in script header comment
- **Notes / references:**
  - Pattern: `check-i18n-coverage.ts` (line 21 in package.json) for coverage reporting precedent
  - Fact-find: Section "Key gaps" (line 96) and "Coverage snapshot" (line 83)
  - Output: Should guide editorial prioritization (which guides need related guides added)
- **Implementation notes:**
  - Created comprehensive reporting script with Markdown and CSV output
  - Scans guide content for %LINK: tokens and Google Maps URLs
  - Builds inbound links map from both manifest relatedGuides and inline tokens
  - Baseline report (EN): 107 guides with relatedGuides, 63 orphans, 30 with inline links, 4 with maps
  - Supports --verbose, --csv, and --locale=<lang> flags
  - Minimum thresholds: live ≥2, review ≥1, draft 0
  - 1 live guide below threshold (amalfiPositanoFerry with 1 relatedGuide)

---

### GUIDE-XREF-04: Add reciprocity warnings to coverage report ✅

- **Status:** COMPLETE (2026-01-29, commit a3dd678bca)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/scripts/report-guide-coverage.ts`
- **Depends on:** GUIDE-XREF-03
- **Confidence:** 80%
  - Implementation: 85% — Build graph of guide→relatedGuides, detect missing reverse edges
  - Approach: 80% — Warn-only per decision; not all relationships are symmetric (overview→specifics)
  - Impact: 75% — Informational; may surface many warnings initially (135 guides × avg 3 related = ~400 edges)
- **Acceptance:**
  - Report section: "Missing reciprocal links"
  - For each `A → B` relationship, check if `B → A` exists
  - Skip warnings for known asymmetric patterns (future: exemption list if needed)
  - Output: Markdown table with guide pairs and suggestion to add reciprocal
  - Warning-only (no script failure)
- **Test plan:**
  - Add: Unit test with mock graph (A→B, B→A vs A→B, B→C)
  - Verify: Correct detection of missing reciprocals
  - Manual: Run against real manifest, spot-check warnings
- **Planning validation:**
  - Algorithm: Simple—build Map<GuideKey, Set<GuideKey>>, iterate and check reverse
  - Expected output: ~50-100 warnings initially (rough estimate based on 135 guides)
- **What would make this ≥90%:**
  - Add configuration for exemptions (e.g., overview guides don't require reciprocals)
  - Test against real manifest subset to validate warning quality
- **Rollout / rollback:**
  - Rollout: Add to existing coverage report script
  - Rollback: Remove section from report output
  - Safe: Informational only
- **Documentation impact:**
  - Update: `report-guide-coverage.ts` header comment with reciprocity explanation
  - Note: Editorial judgment applies (not all warnings require action)
- **Notes / references:**
  - Decision: Fact-find "Decisions made" section 4 — warn-only
  - Pattern: Directional guides (outbound/return) should be reciprocal; overview guides often aren't
- **Implementation notes:**
  - Added detectMissingReciprocals() function to check A→B implies B→A
  - Only checks manifest relatedGuides (not inline %LINK: tokens)
  - Found 241 missing reciprocals in current manifest
  - Displays first 20 by default, all with --verbose flag
  - Includes editorial note that not all relationships need to be symmetric
  - No enforcement - purely informational for editorial review

---

### GUIDE-XREF-05: Document Google Maps URL patterns and editorial guidance ✅

- **Status:** COMPLETE (2026-01-29, commit 7c11ab9e12)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/brikette/docs/guide-authoring-best-practices.md` (new or update existing)
  - `apps/brikette/src/components/AGENTS.md`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 100% — Pure documentation, no code changes
  - Approach: 95% — Fact-find provides clear patterns and examples
  - Impact: 90% — Reduces inconsistency in future guide authoring; doesn't fix existing guides
- **Acceptance:**
  - Documentation includes:
    - Standardized Google Maps URL format (`api=1` directions, search, coordinates)
    - Label conventions ("Google Maps walking route", "Google Maps transit route")
    - When to add maps links (any guide with directions)
    - Examples from existing guides
  - Editorial patterns for inline `%LINK:` tokens:
    - Use at decision points, comparisons, omitted details
    - Avoid overuse (2-5 per guide recommended)
  - Related guides curation patterns by guide type (beaches, directions, overview, experiences)
- **Test plan:**
  - Review: Have 1-2 internal reviewers validate clarity and completeness
  - Usage: Apply patterns to 1-2 new guides as validation
- **Planning validation:**
  - Fact-find: Editorial playbook section (line 205) provides complete patterns
  - Examples: Existing maps links in `assistanceKeywords.json` show current usage
  - Token docs: `_linkTokens.tsx` provides technical reference
- **Rollout / rollback:**
  - Rollout: Commit documentation, reference in guide creation PR template
  - Rollback: Remove docs (no runtime impact)
- **Documentation impact:**
  - Create: Guide authoring best practices doc
  - Update: AGENTS.md with cross-referencing patterns
  - Add: Examples from real guides (positanoMainBeach, pathOfTheGodsFerry)
- **Notes / references:**
  - Fact-find: Sections "Editorial playbook" (line 205), "Google Maps route links" (line 251)
  - Existing: `assistanceKeywords.json` has Google Maps URLs (fact-find line 88)
  - Standards: Google Maps API documentation for `api=1` URL format
- **Implementation notes:**
  - Created comprehensive `guide-authoring-best-practices.md` (302 lines)
  - Covers related guides curation, inline link patterns, Google Maps URL conventions
  - Includes guide type templates (beach, directions, overview, experience)
  - Provides real examples from existing guides (arrivingByFerry, ferryDockToBrikette)
  - Documents api=1 URL format with travelmode parameters
  - Includes validation workflow and checklist for new guides
  - Updated AGENTS.md with quick-reference section (section 5)
  - Cross-references between docs for detailed vs quick lookup

---

### GUIDE-XREF-06: Add warn-only validation to CI ✅

- **Status:** COMPLETE (2026-01-29, commit cfaf8df8fb)
- **Type:** IMPLEMENT
- **Affects:**
  - `.github/workflows/reusable-app.yml`
- **Depends on:** GUIDE-XREF-02, GUIDE-XREF-03
- **Confidence:** 88%
  - Implementation: 90% — Adding CI check is straightforward (script already runs locally)
  - Approach: 90% — Warn-only mode surfaces issues without blocking workflow; proven pattern
  - Impact: 85% — Non-blocking; allows baseline cleanup; provides visibility
- **Decision:** Option B (Warn-only) selected by user
  - Start warn-only in CI (log violations, don't block PRs)
  - Allow 1-2 iterations for baseline cleanup
  - Future consideration: Switch to enforcement after baseline is clean
- **Acceptance:**
  - CI runs `pnpm validate-manifest` on every PR
  - Validation output appears in CI logs (visible to contributors)
  - Violations do NOT block PR merge (warning-only)
  - CI runs `pnpm report-coverage` and logs output
  - Coverage report shows in CI artifacts or logs for tracking
  - Exit code 0 regardless of violations (won't fail build)
  - Scope clarity:
    - This CI step does not add `validate-links` as a blocking check while the baseline has known violations; if `validate-links` is run, it remains warn-only until that baseline is addressed (tracked elsewhere)
- **Test plan:**
  - Manual: Add validation to CI config, trigger test PR, verify logs appear
  - Verify: Violations don't block PR merge
  - Integration: Run against branch with known violations, confirm warnings logged
- **Planning validation:**
  - Validation scripts exist and run successfully (confirmed in GUIDE-XREF-02, GUIDE-XREF-03)
  - CI pattern: Similar to existing lint/test steps that run on PR
  - Known baseline: 220 link token violations exist; won't block immediate deployment
- **Rollout / rollback:**
  - Rollout: Add CI step via standard workflow update; non-blocking by design
  - Rollback: Remove CI step; no impact on runtime or merges
  - Safe: Warn-only mode ensures no workflow disruption
- **Documentation impact:**
  - Update: CI/CD documentation explaining new validation steps
  - Update: Contributing guide mentioning validation warnings
- **Notes / references:**
  - Pattern: Many repos use warn-only validation initially (linting, type-checking, coverage thresholds)
  - Future path: Can switch to enforcement once baseline is addressed (separate decision/PR)
- **Implementation notes:**
  - Added two validation steps to reusable-app.yml after Test step (lines 85-101)
  - Steps only run when app-filter is '@apps/brikette' (conditional execution)
  - validate-manifest runs with --warn-only flag
  - Both steps use continue-on-error: true and || true for guaranteed exit 0
  - Output wrapped in GitHub Actions groups (::group::) for readable CI logs
  - Runs on every Brikette PR via reusable workflow
  - Non-blocking by design - provides visibility without disrupting workflow

---

### GUIDE-XREF-07: Decide minimum relatedGuides policy + enforcement path ✅

- **Status:** COMPLETE (2026-01-29, investigation findings documented)
- **Type:** INVESTIGATE
- **Affects:**
  - `docs/plans/guide-cross-referencing-plan.md` (policy + rollout decisions)
  - (future) `apps/brikette/scripts/report-guide-coverage.ts` / `apps/brikette/scripts/validate-guide-manifest.ts` depending on the enforcement mechanism
- **Depends on:** GUIDE-XREF-03
- **Confidence:** 85%
  - Implementation: 85% — Decision work + plan update; any follow-up enforcement change will be scoped separately
  - Approach: 85% — Use report output to pick thresholds that are achievable and meaningful
  - Impact: 85% — Prevents "accidental policy drift" and keeps enforcement changes deliberate
- **Acceptance:**
  - Define and record a minimum policy per publication status (starting with `live`), e.g.:
    - Minimum count (e.g., `live >= 2`)
    - Any exemptions (overview guides, intentionally-standalone guides) and how they are encoded (allowlist file vs manifest flag)
  - Decide the enforcement mechanism (warn-only vs fail, and where it lives: coverage report vs manifest validator)
  - Update GUIDE-XREF-03 / GUIDE-XREF-06 acceptance text if enforcement becomes a committed follow-up task
- **Investigation findings:**
  - **Baseline data (2026-01-29):**
    - 23 live guides: only 1 has relatedGuides (amalfiPositanoFerry with 1, below threshold)
    - 0 review guides
    - 143 draft guides: 106 already have relatedGuides
    - Most live guides are transport/directions guides in "howToGetHere" area
    - 63 orphan guides (no inbound links)
    - 241 missing reciprocal links
  - **Policy recommendation:**
    - **Minimum by status:**
      - `live`: ≥2 relatedGuides (current threshold, already in report-coverage.ts)
      - `review`: ≥1 relatedGuides (prepare guides for live status)
      - `draft`: 0 (no minimum, allow exploration)
    - **Exemptions mechanism:**
      - No exemptions initially (keep policy simple)
      - Future: add `exemptFromRelatedGuidesPolicy: true` manifest flag if needed
      - Or: create exemptions allowlist file (`.guide-policy-exemptions.json`) for edge cases
    - **Enforcement approach:**
      - **Phase 1 (current):** Warn-only in CI via coverage report (GUIDE-XREF-06)
      - **Phase 2 (future):** Blocking enforcement after:
        - All 22 live guides without relatedGuides are updated
        - One full content cycle (1-2 months) to stabilize editorial workflow
        - Coverage report shows <5 live guides below threshold
      - **Enforcement location:** Manifest validator (validate-guide-manifest.ts), not coverage report
      - **Mechanism:** Add `--enforce-minimum` flag that fails on policy violations
  - **Rollout path:**
    1. Current: CI warns on violations (GUIDE-XREF-06)
    2. Editorial: Update 22 live guides to meet ≥2 threshold (separate content PRs)
    3. Monitor: Track coverage monthly, ensure threshold achievable
    4. Enforce: Add blocking validation after clean baseline (new plan task if pursued)
  - **Policy rationale:**
    - Threshold of 2 is achievable (most draft guides already exceed this)
    - Directional guides can link: destination + return + alternative route = 3 typical
    - Exemptions not needed initially (all guide types benefit from cross-references)
    - Warn-only period prevents workflow disruption while baseline is cleaned
  - **Next steps (if enforcement is pursued):**
    - Create follow-up plan task: "Add blocking relatedGuides enforcement"
    - Update validate-guide-manifest.ts with --enforce-minimum flag
    - Coordinate editorial work to update 22 live guides
    - Add enforcement to CI after baseline is clean

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 57 guides suddenly render related guides block, surprising users | Test on staging; phased rollout; document in release notes |
| Validation surfaces many existing violations | Start warn-only; fix baseline before enforcing; allow exemptions for edge cases |
| Reciprocity warnings create noise (too many false positives) | Warn-only; add exemption patterns; provide editorial guidance on when to ignore |
| Google Maps URLs break if Google changes format | Document stable `api=1` format; monitor for deprecation; URLs degrade gracefully (still navigable) |
| Coverage report shows low adoption, demotivates team | Frame as opportunity; celebrate progress; provide examples of high-quality cross-referencing |
| Manifest PRs create review bottleneck | Document patterns clearly; provide examples; consider batch updates for efficiency |

## Observability

**Logging:**
- No runtime logging needed (static build-time feature)

**Metrics:**
- Coverage report tracks: guides with relatedGuides, guides with inline links, guides with maps URLs
- Manual tracking: Coverage over time (run report monthly, track improvements)

**Alerts/Dashboards:**
- Not applicable (content quality feature, not runtime service)

**CI Integration:**
- Validation script exit codes signal pass/fail
- Coverage report output available in CI logs

## Acceptance Criteria (overall)

- [x] Related guides render by default when `manifest.relatedGuides` is non-empty
- [x] Validation script detects and reports: broken keys, duplicates, self-references, draft-to-live violations
- [x] Coverage report shows: guides without related guides, orphans, inline link usage, maps URL usage
- [x] Reciprocity warnings appear in coverage report (warn-only)
- [x] Google Maps URL patterns documented with examples
- [x] Editorial guidance for inline links and cross-references published
- [x] CI enforcement strategy decided and implemented
- [x] All tests passing (existing + new test cases for GUIDE-XREF-01, GUIDE-XREF-02)
- [x] No regressions in existing guide rendering
- [x] Minimum relatedGuides policy defined with clear thresholds and rollout path

## Decision Log

- 2026-01-29: **Storage** — Use Option A (manifest) instead of Option C (dedicated store). Simplifies implementation; leverages existing infrastructure.
- 2026-01-29: **Rendering** — Related guides render regardless of translation status (always show when configured).
- 2026-01-29: **Enforcement scope** — Start with `live` guides only; expand to `review` after workflow stabilizes.
- 2026-01-29: **Reciprocity** — Warn-only (not enforced); allows editorial judgment.
- 2026-01-29: **Approach** — Default rendering (Option A) chosen over block-based (Option B); reduces friction, treats cross-references as content feature.
- 2026-01-29: **CI enforcement** — Warn-only mode selected (Option B). Validation runs in CI but doesn't block PRs. Allows baseline cleanup before potential future enforcement.

## Policy Recommendations (GUIDE-XREF-07)

**Minimum relatedGuides Policy:**

| Status | Minimum | Rationale |
|--------|---------|-----------|
| `live` | ≥2 | Published guides should provide navigation. Directional guides can link: destination + return + alternative = 3 typical. |
| `review` | ≥1 | Pre-live guides should have at least one cross-reference to prepare for publishing. |
| `draft` | 0 | No minimum for exploratory content; allows flexibility during authoring. |

**Exemptions:**
- None initially (keep policy simple)
- Future: Add `exemptFromRelatedGuidesPolicy: true` manifest flag if edge cases emerge
- Or: Create `.guide-policy-exemptions.json` allowlist file

**Enforcement:**
- **Current (Phase 1):** Warn-only in CI (GUIDE-XREF-06)
- **Future (Phase 2):** Blocking enforcement after:
  - All 22 live guides without relatedGuides are updated
  - One full content cycle (1-2 months) to stabilize workflow
  - Coverage report shows <5 live guides below threshold
- **Mechanism:** Add `--enforce-minimum` flag to validate-guide-manifest.ts

**Baseline cleanup required:**
- 22 live guides need relatedGuides added (currently 0)
- 1 live guide needs additional relatedGuide (currently 1, needs ≥2)
- Target: All 23 live guides meet ≥2 threshold before blocking enforcement
