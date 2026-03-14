---
Type: Analysis
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-site-content-build-resilience
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/caryina-site-content-build-resilience/fact-find.md
Related-Plan: docs/plans/caryina-site-content-build-resilience/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Caryina Site-Content Build Resilience Analysis

## Decision Frame
### Summary
The Caryina shop throws 500 errors on every server-rendered page when `data/shops/caryina/site-content.generated.json` is absent. Generation is entirely manual, there is no prebuild hook, and the materializer currently cannot be run safely because `productPage.trustStrip` is not in its output schema (the field was added manually after generation). Two decisions need to be made:

1. **Resilience approach**: Should the app have a runtime fallback, a prebuild guard, or both?
2. **trustStrip gap**: Should we port `trustStrip` to the materializer (enabling automated prebuild) or keep it manual-only and rely solely on the committed file?

### Goals
- App never hard-crashes (500) when the content file is absent or malformed
- No manual step required between fresh checkout and a successful build
- Two-copy divergence resolved; single authoritative path
- Unit tests cover the fallback paths

### Non-goals
- Migrating to a DB/CMS
- Internationalising fallback copy
- Runtime content hot-reload
- Changing the content-packet generation pipeline (`compile-website-content-packet`)

### Constraints & Assumptions
- Constraints:
  - `trustStrip` in `productPage` must not be dropped; it is customer-visible content on every PDP
  - CI `caryina.yml` build command cannot be changed without a separate PR touching the workflow file
  - `prebuild` in `apps/caryina/package.json` runs with `cwd = apps/caryina/`; materializer needs `--repo-root ../..`
  - Testing policy: tests run in CI only, not locally
- Assumptions:
  - The `## Reusable Trust Blocks` section in `HBAG/content-packet.md` is the correct source for trustStrip bullets — confirmed by reading the file (delivery, exchange, origin are all present)
  - The committed `data/shops/caryina/site-content.generated.json` (repo root) is the app's primary resolved path; the app-local copy at `apps/caryina/data/` is stale and safe to delete

## Inherited Outcome Contract
- **Why:** Fresh deployments and CI builds fail silently (500 on every page) when the content generation step is skipped. The materializer warning also means even manual re-runs are unsafe without the trustStrip fix.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Caryina app builds and serves content on fresh checkout without a separate manual generation step; all pages fall back to hardcoded safe content rather than throwing a 500 when the file is absent or malformed.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/caryina-site-content-build-resilience/fact-find.md`
- Key findings used:
  - `readPayload()` in `contentPacket.ts` throws a hard `Error` on lines 157/161 when no valid file is found — no fallback exists
  - `CHROME_DEFAULTS` and `TRUST_STRIP_DEFAULTS` already exist in `contentPacket.ts` as hardcoded fallbacks for optional sections — this pattern should be extended to required sections
  - Materializer `buildPayload()` does not include `productPage.trustStrip`; committed file was manually extended — regenerating would lose trustStrip
  - `## Reusable Trust Blocks` in `HBAG/content-packet.md` contains the 3 trust bullet texts the materializer can extract
  - Two copies tracked in git: repo-root (primary) and app-local (stale, has old `chrome` key); app-local is never preferred by the app
  - CI `caryina.yml` has no generation step; entire pipeline depends on the committed file being correct

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| No 500 on fresh checkout | Core goal — entire shop is offline otherwise | P0 |
| No content loss (trustStrip) | Customer-visible on every PDP; must not be dropped by regeneration | P0 |
| Minimal manual steps after landing | Prevents regression to the same fragile state | P1 |
| Test coverage | Ensures fallback paths don't silently regress | P1 |
| Data / schema integrity | Two-copy divergence is a maintenance hazard | P2 |
| Rollout safety | Prebuild must not corrupt committed content | P2 |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Fallback-only | Add `SAFE_DEFAULTS` payload in `contentPacket.ts`; replace hard throws with `console.warn` + return defaults. No prebuild, no materializer change. | Smallest change; ship fast; no risk of materializer overwriting content | Does nothing to keep content fresh; fresh checkout still serves placeholder copy; trustStrip gap remains | Stale/missing content served silently in production after future deploys | Yes (partial) |
| B — Prebuild-only (no trustStrip port) | Add `prebuild` script that runs materializer. Don't port trustStrip. Guard: skip regeneration if hash unchanged. | Automates generation; fresh checkout works | Materializer would overwrite trustStrip on first changed-hash run; guard only delays problem | Loss of customer-visible PDP trust copy after any content-packet edit | No — too risky |
| C — Port trustStrip + prebuild + fallback (recommended) | (1) Port `trustStrip` to materializer `buildPayload()` from `## Reusable Trust Blocks`. (2) Add `prebuild` that runs materializer. (3) Add `SAFE_DEFAULTS` fallback in `readPayload()`. (4) Delete stale app-local copy. (5) Add unit tests. | Solves all dimensions: no crash on fresh checkout; content stays fresh; no manual step; no content loss; tested | More tasks than A alone; materializer change requires care to extract trust bullets correctly | If `## Reusable Trust Blocks` section is renamed or removed from content-packet, trustStrip would revert to defaults — acceptable since defaults are reasonable copy | Yes — recommended |
| D — Committed-file-as-only-source + error page | Keep manual generation; add a proper Next.js error boundary that renders a useful "shop temporarily unavailable" page instead of a raw 500 | Honest failure mode; no content surprises | Still requires manual step on fresh checkout; production can go offline silently; doesn't fix the root fragility | Operator must always remember to run generation before push/deploy | No — addresses symptom only |

## Engineering Coverage Comparison
| Coverage Area | Option A (fallback only) | Option C (full: port + prebuild + fallback) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A — no visual change |
| UX / states | Fallback returns defaults; shop renders with placeholder copy instead of 500 | Same fallback + prebuild keeps fresh content; fresh checkout works end-to-end | Graceful degraded state on missing file; full state on normal build |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | `console.warn` when falling back | Same; also logs when materializer runs in prebuild | Add `console.warn` in fallback path; CI logs capture prebuild run |
| Testing / validation | Tests for missing/malformed file paths | Same; also test that prebuild produces valid output | Unit tests for `readPayload()` fallback; integration: prebuild + typecheck in CI |
| Data / contracts | No change to materializer schema; trustStrip remains manual | Materializer schema extended with `trustStrip`; app-local stale copy deleted; single canonical path | Schema drift resolved; one authoritative copy |
| Performance / reliability | Single point of failure eliminated for missing-file case; malformed-file case also covered | Same; additionally, fresh checkout produces correct content via prebuild | Full resilience across missing + malformed + fresh checkout |
| Rollout / rollback | Safe; fallback is purely additive | Materializer change is additive (new field added, not removed); committed file remains rollback baseline | Rollback = revert the JSON commit; no migration needed |

## Chosen Approach

- **Recommendation:** Option C — Port trustStrip to materializer, add prebuild script, add runtime fallback, delete stale copy, add unit tests.
- **Why this wins:** Only approach that simultaneously eliminates the 500 crash (via fallback), eliminates the manual generation step (via prebuild), and avoids content loss (by porting trustStrip before the prebuild runs). Option A alone fixes the crash but leaves fresh checkout serving placeholder copy indefinitely. Option B is unsafe until trustStrip is ported. Option C is the minimal complete fix.
- **What it depends on:**
  - `## Reusable Trust Blocks` section in `HBAG/content-packet.md` being machine-parseable (confirmed: contains 3 bullet lines matching delivery/exchange/origin semantics already in `TRUST_STRIP_DEFAULTS`)
  - The `--repo-root ../..` flag working correctly when materializer is invoked from `apps/caryina/` (confirmed: `materializeSiteContentPayload` accepts `repoRoot` option)

### Rejected Approaches
- **Option A (fallback only)** — Fixes the 500 crash but fresh checkout still serves placeholder copy from `SAFE_DEFAULTS`. Does not fulfil the outcome contract ("builds and serves content on fresh checkout without a separate manual generation step"). Retained as a component of Option C.
- **Option B (prebuild without trustStrip port)** — Unsafe: any content-packet edit triggering a hash change would cause the materializer to regenerate and strip `productPage.trustStrip`, replacing customer-visible PDP trust copy with empty/placeholder content. Eliminated.
- **Option D (error boundary only)** — Fixes the presentation of failure but not the failure itself. Fresh checkout still requires a manual step. Does not fulfil the outcome contract.

### Open Questions (Operator Input Required)
None — the stale `apps/caryina/data/shops/caryina/site-content.generated.json` question from the fact-find is resolved as: delete it (low risk, app never prefers it, data is stale). No operator input needed to proceed.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Content generation | Manual: operator runs materializer, commits result | Developer runs `pnpm build` or pushes to CI | `prebuild` in `apps/caryina/package.json` auto-runs materializer with `--repo-root ../..`; materializer reads `HBAG/content-packet.md`, writes `data/shops/caryina/site-content.generated.json`; `next build` then consumes the freshly-written file | Content-packet editing is still manual (out of scope); operator must still update `HBAG/content-packet.md` to change content | If content-packet is missing (corrupted checkout), materializer fails with `ok:false`; prebuild exits non-zero; build fails with a clear diagnostic (better than silent 500) |
| Runtime resilience | Hard throw + 500 on any missing/malformed file | SSR page render when file absent | `readPayload()` logs a warning and returns `SAFE_DEFAULTS`; all `get*Content()` functions return safe fallback copy; pages render with degraded but non-crashing content | File is still read on first call; cache logic unchanged | Fallback copy must be real brand copy, not generator placeholders, to avoid customer-facing quality issues |
| Two-copy divergence | Two tracked copies (root + app-local), diverged | This PR lands | `git rm apps/caryina/data/shops/caryina/site-content.generated.json`; only `data/shops/caryina/site-content.generated.json` remains; `GENERATED_PAYLOAD_CANDIDATES` still checks all three paths (no code change needed) | Candidate resolution order unchanged | None; app-local copy was never preferred by the candidate list |
| Materializer schema | Does not emit `productPage.trustStrip` | This PR lands | `buildPayload()` extracts trust bullets from `## Reusable Trust Blocks` in content-packet; maps to `{ delivery, exchange, origin }` matching `TRUST_STRIP_DEFAULTS` shape; `securePayment` falls back to default | `trustStrip` remains optional in consumer (`SiteContentPayload`); existing `mergeLocalizedSection` handling unchanged | `## Reusable Trust Blocks` section shape must remain stable in content-packet; if renamed, trustStrip reverts to defaults (acceptable) |
| Test coverage | Zero tests for missing/invalid file paths | This PR lands | Unit tests in `contentPacket.test.ts` cover: (a) missing file → returns `SAFE_DEFAULTS`, (b) malformed JSON → returns `SAFE_DEFAULTS` | Existing chrome locale tests unchanged | Tests run in CI only; must follow `fs.existsSync`/`fs.readFileSync` mock pattern |

## Planning Handoff
- Planning focus:
  - TASK-01: Port `productPage.trustStrip` to `materializeSiteContentPayload()` — add `extractH2BulletList()` (or generalise `extractBulletList()` to accept heading level) to read the `## Reusable Trust Blocks` h2 section; map bullets to `{ delivery, exchange, origin, securePayment }` with `securePayment` always using default (not present in content-packet); update materializer's `SiteContentPayload` type to include `trustStrip`
  - TASK-02: Add `SAFE_DEFAULTS` constant to `contentPacket.ts`; replace both `throw` statements in `readPayload()` with `console.warn(...) + return SAFE_DEFAULTS`
  - TASK-03: Add `prebuild` script to `apps/caryina/package.json`: `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --repo-root ../..`
  - TASK-04: `git rm apps/caryina/data/shops/caryina/site-content.generated.json`; remove `_manualExtension` warning from committed JSON
  - TASK-05: Add unit tests in `contentPacket.test.ts` for missing-file and malformed-JSON fallback paths
  - TASK-06: Typecheck (`pnpm --filter @apps/caryina typecheck`) and confirm CI passes
- Validation implications:
  - TASK-01 completion is a prerequisite for TASK-03: materializer must include trustStrip before prebuild is wired
  - TASK-02 can be done independently; it is purely additive (no schema change, no breaking change)
  - TASK-05 tests use mock of `fs.existsSync`/`fs.readFileSync` — may need to verify jest mock pattern for `node:fs` in this test suite
- Sequencing constraints:
  - TASK-01 before TASK-03 (materializer must include trustStrip before prebuild run could overwrite the file)
  - TASK-02 before TASK-05 (fallback must exist before tests for it)
  - TASK-04 can be done any time (only removes a stale tracked file)
  - TASK-06 is final validation gate
- Risks to carry into planning:
  - `## Reusable Trust Blocks` bullet parsing: confirm the materializer's `extractBulletList()` function can read this section from the content-packet; the heading level is `##` (h2), not `###` (h3) — needs a `##` matcher variant or a new extractor
  - `node:fs` mock in jest: `contentPacket.ts` uses `import * as fs from "node:fs"` — mock must target the exact module specifier

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `## Reusable Trust Blocks` heading is h2, not h3 — `extractBulletList()` only matches h3 headings | Confirmed risk | Medium — if not handled, trustStrip ported but always empty | `extractBulletList()` uses regex `^###\s+` which never matches `## Reusable Trust Blocks`; confirmed in code at line 95 | **Resolved at analysis:** TASK-01 must add an `extractH2BulletList()` variant that uses `^##\s+` (without the third `#`), or generalise `extractBulletList()` to accept heading level; do not use `extractBulletList()` for this section |
| `node:fs` mock targeting in jest | Medium | Medium — tests may not correctly intercept `readFileSync` calls | Depends on jest module resolution for `node:` specifiers in the caryina jest config | TASK-05 must verify mock approach before writing tests |
| `SAFE_DEFAULTS` copy uses generator placeholders | Low | Medium — customer-facing brand quality issue | Requires operator-approved copy for fallback | TASK-02 must use real brand copy for home/shop/policies sections — fact-find's committed JSON provides the baseline text |

## Planning Readiness
- Status: Go
- Rationale: All three analysis gates pass. Evidence gate: fact-find is Ready-for-analysis with complete engineering coverage matrix. Options gate: 4 options compared, Option C selected with elimination rationale. Planning handoff gate: chosen approach is decisive, 6 task seeds defined with sequencing constraints and risk transfer, end-state operating model complete. No operator-only questions remain.
