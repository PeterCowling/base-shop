---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: standing-data-freshness-enforcement
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/standing-data-freshness-enforcement/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Standing Data Freshness Enforcement Fact-Find Brief

## Scope

### Summary

Standing data files in `docs/business-os/startup-baselines/` (offer, channels, content-packet, forecast-seed, assessment-intake-packet, demand-evidence-pack across 4 businesses, plus templates and S3-forecast subdirectories) have no freshness enforcement. An agent or operator can make a strategy or build decision based on a 3-month-old offer doc with no warning. The aggregate-pack freshness policy (90-day / confidence < 0.6) is documented in three places but has zero code enforcement. The only implemented freshness checks cover MCP loop runtime artifacts (manifests, metrics, ledger) and generated-file drift — not standing content.

### Goals

- Standing-baselines files that exceed a staleness threshold are surfaced automatically — no `git log` required.
- The aggregate-pack 90-day / confidence-0.6 freshness policy documented in contracts is enforced in code.
- Freshness status is available to both automated consumers (scripts, MCP tools) and the operator (S10 weekly readout or equivalent).

### Non-goals

- Automatically refreshing stale content (that requires domain-specific work; this feature only surfaces the problem).
- Freshness enforcement for non-baselines standing data (future scope).
- Changing the documented 90-day / 0.6 thresholds (they are accepted as-is).

### Constraints & Assumptions

- Constraints:
  - Must work with inconsistent frontmatter field naming across existing files (some use `Created`/`Updated`, others `created`/`last_updated`).
  - Must not require manual frontmatter additions to all files before the check works — should fall back to git commit date for files without frontmatter dates.
  - Tests run in CI only (no local test execution).
- Assumptions:
  - `last_updated` (or variant) frontmatter field is the preferred freshness source when present; git commit date is fallback.
  - 90-day threshold for individual baselines (matching aggregate-pack policy) is appropriate unless operator overrides.
  - Advisory warnings (not hard blocks) are the right enforcement level for standing data — surfacing is the goal, not gating.

## Outcome Contract

- **Why:** Standing data files are the input to every startup-loop stage decision. Without freshness enforcement, an agent or operator can make a strategy decision based on a 3-month-old offer doc without any warning. The baselines reorganisation made this visible — the files are now tidy but still have no way to signal when they need refreshing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Startup-baselines files have a freshness enforcement mechanism — stale files are surfaced automatically via a script or preflight check, so decisions are never silently made on outdated standing data.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/mcp-preflight.ts` — existing artifact-freshness check (scans 3 file types only: `baseline.manifest.json`, `learning-ledger.jsonl`, `metrics.jsonl`)
- `packages/mcp-server/src/lib/loop-artifact-reader.ts` — `buildFreshnessEnvelope()` utility (advisory only)
- `docs/business-os/startup-loop/contracts/aggregate-pack-contracts.md` — documented 90-day / 0.6 policy (no code enforcement)

### Key Modules / Files

- `scripts/src/startup-loop/mcp-preflight.ts` — `runArtifactFreshnessCheck()` at lines 298-361; scans `startup-baselines/` but only for 3 runtime file types. Default threshold: 30 days (mtime-based). Advisory warnings only.
- `scripts/src/startup-loop/mcp-preflight-config.ts` — config: `STARTUP_LOOP_STALE_THRESHOLD_SECONDS` env var, default 30 days. `startupLoopArtifactRoot` defaults to repo root.
- `packages/mcp-server/src/lib/loop-artifact-reader.ts` — `buildFreshnessEnvelope()` at lines 76-129. Three-tier: ok / warning (>15d) / stale (>30d). Used by 5 MCP loop tools.
- `packages/mcp-server/src/tools/loop.ts` — `handlePackWeeklyS10Build()` at lines 1694-1774. Assembles S10 pack but does NOT read aggregate pack frontmatter or check freshness.
- `docs/business-os/startup-loop/contracts/aggregate-pack-contracts.md` — freshness policy: stale when `last_updated` > 90 days OR `confidence` < 0.6. Update triggers: Layer B build cycle, operator re-run, or S10 readout detecting degraded confidence.
- `docs/business-os/startup-loop/artifact-registry.md` — registers startup-baselines artifacts with canonical paths, producers, consumers. No per-file freshness metadata.
- `scripts/src/startup-loop/website/compile-website-content-packet.ts` — reads pack frontmatter including `last_updated` but validates field presence only, not age.

### Patterns & Conventions Observed

- **Frontmatter field naming is inconsistent**: `forecast-seed.user.md` uses `Created`/`Updated`/`Last-reviewed` (title case); `offer.md` and `channels.md` use `created`/`last_updated` (snake_case). Any freshness checker must normalize both conventions.
  - Evidence: sampled all file types in `docs/business-os/startup-baselines/`
- **Advisory-not-blocking is the pattern**: `buildFreshnessEnvelope` and mcp-preflight both surface warnings but never block operations. `check-stage-operator-views --check` is the only mechanism that exits non-zero on staleness (but it checks generation drift, not content age).
  - Evidence: `mcp-preflight.ts`, `loop-artifact-reader.ts`
- **Existing freshness utility is reusable**: `buildFreshnessEnvelope()` already implements the 3-tier classification (ok/warning/stale) with configurable thresholds. Extending it or mirroring its pattern for baselines would be consistent.
  - Evidence: `packages/mcp-server/src/lib/loop-artifact-reader.ts`

### Data & Contracts

- Types/schemas:
  - `FreshnessEnvelope` interface in `loop-artifact-reader.ts`: `{ status, ageSeconds, thresholdSeconds, sourceTimestamp }`
  - `McpPreflightCheck` in `mcp-preflight.ts`: `{ id, status, message }`
  - Aggregate pack contract fields: `last_updated` (ISO date), `confidence` (float), `status` (Active | Stale | Draft)
- Persistence:
  - Standing baselines files: markdown with YAML frontmatter in `docs/business-os/startup-baselines/<BIZ>/`
  - Aggregate packs: markdown in `docs/business-os/strategy/<BIZ>/`
- API/contracts:
  - Documented freshness policy: 90 days / confidence < 0.6 — zero code enforcement
  - `buildFreshnessEnvelope` default threshold: 30 days

### Dependency & Impact Map

- Upstream dependencies:
  - Frontmatter `last_updated` / `Updated` / `Last-reviewed` fields (when present)
  - Git commit dates (fallback when frontmatter absent)
- Downstream dependents:
  - `compile-website-content-packet.ts` — would benefit from freshness check before assembling packs
  - S10 weekly readout — should surface stale baselines per existing contract language
  - `mcp-preflight.ts` — natural home for expanded artifact-freshness check
  - Any agent consuming startup-baselines during fact-find or planning
- Likely blast radius:
  - Low: advisory warnings only. No existing behaviour changes. New warnings surface in preflight and/or S10 output.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner)
- Commands: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=<pattern> --no-coverage`
- CI integration: tests run in CI only per project policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| mcp-preflight | Unit | `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts` | Tests artifact-freshness check for the 3 file types; uses injectable clock and temp dirs |
| buildFreshnessEnvelope | Integration | `packages/mcp-server/src/__tests__/` (via loop tool tests) | Tested indirectly through MCP tool response assertions |
| S10 diagnosis | Integration | `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts` | References freshness/staleness but for diagnosis metrics, not standing data |

#### Coverage Gaps

- No test validates freshness of actual standing-baselines markdown files.
- No test validates the 90-day aggregate-pack freshness policy.

#### Testability Assessment

- Easy to test: Freshness check core logic is date comparison against threshold. I/O (frontmatter reading, git commit date lookup) is injectable. `mcp-preflight.test.ts` demonstrates the pattern — temp dirs, injectable clock.
- Hard to test: Git-log fallback requires either a real git repo in test or mocked `git log` output.
- Test seams needed: None new — existing patterns in `mcp-preflight.test.ts` suffice.

#### Recommended Test Approach

- Unit tests for: freshness check function (frontmatter parsing, date normalization, threshold evaluation, git-date fallback)
- Integration tests for: expanded mcp-preflight check covering `.md` files in startup-baselines

### Recent Git History (Targeted)

- `docs/business-os/startup-baselines/` — just reorganized (commits `69f80ee497`, `53ca9b397f`): files moved from flat to per-business subdirectories. No freshness metadata added.
- `scripts/src/startup-loop/mcp-preflight.ts` — last substantive change was MCP data-plane-wave-2; artifact-freshness check was introduced then and has not been extended since.

## Access Declarations

None. All data sources are local filesystem (frontmatter, git history).

## Questions

### Resolved

- Q: Should the check use frontmatter dates or git mtime?
  - A: Prefer frontmatter `last_updated` / `Updated` / `Last-reviewed` when present; fall back to git commit date (`git log -1 --format=%aI -- <file>`). Frontmatter is more reliable because git operations (rebase, cherry-pick) can change filesystem mtime. Git commit date is the second-best signal; filesystem mtime is least reliable.
  - Evidence: Existing pattern in `compile-website-content-packet.ts` (reads frontmatter `last_updated`); `mcp-preflight.ts` uses filesystem mtime (acceptable for its 3 runtime file types which are never rebased, but not suitable for content files).

- Q: Should this be a blocking check or advisory?
  - A: Advisory (warnings), matching the existing `buildFreshnessEnvelope` pattern. Standing data staleness should be surfaced but should not block agent operations.
  - Evidence: All existing freshness mechanisms are advisory except `check-stage-operator-views --check` (which checks generation drift, a different concern).

- Q: Where should the check live — mcp-preflight, a new standalone script, or the S10 pack build?
  - A: Extend `mcp-preflight.ts` `runArtifactFreshnessCheck()` to scan `.md` files (not just the 3 runtime files). Additionally add a standalone `pnpm` script for on-demand and S10 integration. This gives both automatic preflight coverage and an invocable CLI tool.
  - Evidence: `mcp-preflight.ts` already has the infrastructure (temp dirs, thresholds, warning reporting). `pack_weekly_s10_build` in `loop.ts` is the natural S10 integration point.

- Q: What staleness threshold for individual baselines?
  - A: 90 days, matching the documented aggregate-pack policy. Use the same `STARTUP_LOOP_STALE_THRESHOLD_SECONDS` env var pattern for override.
  - Evidence: `aggregate-pack-contracts.md` specifies 90 days; consistency is more important than a different threshold.

- Q: How to handle inconsistent frontmatter field names?
  - A: Normalize by checking fields in priority order: `last_updated` → `Last-updated` → `Updated` → `Last-reviewed` → `created` → `Created`. First match wins.
  - Evidence: Sampled all file types; these 6 variants cover all observed conventions.

### Open (Operator Input Required)

None. All design decisions are resolvable from existing patterns and documented contracts.

## Confidence Inputs

- Implementation: 90% — clear entry points, existing patterns to extend, well-tested area. Would reach 95% with confirmed frontmatter field priority order.
- Approach: 85% — extending mcp-preflight is the natural path; standalone script adds CLI access. Would reach 90% with confirmed S10 integration approach.
- Impact: 80% — addresses a real gap; value depends on how often stale data actually causes problems (currently invisible). Would reach 90% with one concrete example of a stale-data decision.
- Delivery-Readiness: 90% — all infrastructure exists, no external dependencies, well-bounded scope.
- Testability: 90% — existing test patterns in `mcp-preflight.test.ts` directly applicable; injectable clock + temp dirs.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Frontmatter field normalization misses a variant | Low | Low | Grep all files for date-like frontmatter fields before implementation; add fallback to git date |
| Git-log fallback is slow on large repos | Low | Low | Cache git dates per session; only invoke for files missing frontmatter dates |
| False-positive staleness warnings on rarely-changing files (e.g. assessment-intake-packet that genuinely hasn't changed) | Medium | Low | Threshold is advisory; operator can suppress per-file or adjust threshold |
| Aggregate-pack freshness depends on `confidence` field which is subjective | Low | Medium | Use `confidence` as documented in contracts; operator sets the value |

## Planning Constraints & Notes

- Must-follow patterns:
  - Reuse `buildFreshnessEnvelope` pattern (3-tier ok/warning/stale) for consistency.
  - Use injectable clock and temp dirs in tests (match `mcp-preflight.test.ts` pattern).
  - Normalize frontmatter field names case-insensitively.
- Rollout/rollback expectations:
  - Advisory only — no rollback needed. Worst case is noisy warnings, fixed by threshold adjustment.
- Observability expectations:
  - Freshness warnings visible in mcp-preflight output and (optionally) S10 pack build response.

## Suggested Task Seeds (Non-binding)

1. **Implement baselines freshness checker** — standalone TypeScript function that scans `startup-baselines/` markdown files, reads frontmatter dates (with normalization + git commit date fallback), evaluates against 90-day threshold, returns structured warnings. Testable with injectable filesystem and clock abstractions.
2. **Extend mcp-preflight** — add `.md` file scanning to `runArtifactFreshnessCheck()` alongside existing 3-file-type check.
3. **Add pnpm script** — `pnpm check-baselines-freshness` for CLI invocation and S10 integration.
4. **Tests** — unit tests for freshness checker (frontmatter parsing, date normalization, threshold, git fallback). Extend `mcp-preflight.test.ts` for the expanded scan.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Freshness checker function exists and is tested.
  - mcp-preflight artifact-freshness check covers `.md` standing-baselines files.
  - `pnpm check-baselines-freshness` script exists and reports stale files.
  - Stale files in startup-baselines/ produce warnings (not errors) in preflight output.
- Post-delivery measurement plan:
  - Run `pnpm check-baselines-freshness` weekly as part of S10. Track count of stale files over time.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| mcp-preflight artifact-freshness implementation | Yes | None | No |
| buildFreshnessEnvelope utility and pattern | Yes | None | No |
| Frontmatter field naming conventions | Yes | None — all 6 variants documented | No |
| Aggregate-pack freshness contract | Yes | None — documented policy confirmed, zero code enforcement confirmed | No |
| S10 weekly readout integration | Partial | [Missing Domain Coverage] Minor: S10 integration is suggested but not deeply investigated | No |
| Git-log fallback mechanism | Partial | [System Boundary Coverage] Minor: git command performance not benchmarked | No |

## Scope Signal

- Signal: right-sized
- Rationale: Scope is bounded to surfacing staleness in one well-defined directory tree. Implementation extends existing patterns. No external dependencies. Advisory-only enforcement avoids blast radius. The two Minor simulation findings (S10 integration depth, git performance) do not block planning — they can be resolved during implementation.

## Evidence Gap Review

### Gaps Addressed

- Confirmed all 26 files in startup-baselines/ and their frontmatter conventions.
- Confirmed mcp-preflight scans the correct directory but filters to 3 file types only.
- Confirmed aggregate-pack freshness policy is documented but unimplemented.
- Confirmed buildFreshnessEnvelope pattern is reusable.
- Confirmed existing test patterns are directly applicable.

### Confidence Adjustments

- No adjustments. Initial confidence aligned with evidence found.

### Remaining Assumptions

- 90-day threshold is appropriate for individual baselines (matches documented aggregate-pack policy).
- Advisory-only enforcement is the right level (no evidence of a need for hard blocks).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan standing-data-freshness-enforcement --auto`
