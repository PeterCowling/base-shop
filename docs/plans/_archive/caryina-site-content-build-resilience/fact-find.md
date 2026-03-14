---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: caryina-site-content-build-resilience
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/caryina-site-content-build-resilience/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314160001-PLAT-011
Trigger-Why: Every page in the Caryina shop hard-throws a 500 error if site-content.generated.json is missing, taking the entire shop offline on fresh deployments or CI builds that skip the generation step.
Trigger-Intended-Outcome: type: operational | statement: The Caryina app never crashes with a raw 500 on a missing or malformed content file — it either loads from a committed baseline or serves safe hardcoded fallbacks, with a build-time step that regenerates the file before any deployment
---

# Caryina Site-Content Build Resilience Fact-Find Brief

## Scope
### Summary
The Caryina Next.js app requires `data/shops/caryina/site-content.generated.json` to be present at runtime. Every page in the shop calls `readPayload()` from `apps/caryina/src/lib/contentPacket.ts`, which throws a hard `Error` if the file is missing or structurally invalid. The file is manually generated using a `scripts/` CLI — there is no `prebuild` hook to regenerate it automatically. On a fresh checkout or a CI runner that has not run the generation step, every server-rendered page throws a 500.

This work makes the app resilient: the file should be auto-generated before build, and the app should serve safe fallbacks (or a coherent error page) rather than an unhandled runtime crash when the file is absent.

### Goals
- Add a `prebuild` step to `apps/caryina/package.json` that regenerates `site-content.generated.json` from the committed content-packet before `next build` runs.
- Ensure the app never throws an unhandled runtime error for a missing or malformed file — serve hardcoded fallbacks instead.
- Resolve the two-copy divergence (root `data/` vs `apps/caryina/data/`) to a single authoritative path.
- Add a test that verifies `readPayload()` falls back gracefully when the file is absent.

### Non-goals
- Changing the content-packet generation pipeline (`compile-website-content-packet`).
- Migrating all content to a DB or CMS.
- Internationalising the fallback copy (fallback can be EN-only).
- Adding runtime content refresh/hot-reload.

### Constraints & Assumptions
- Constraints:
  - The file is committed to git (both paths tracked); the materializer has a manual warning not to re-run it yet (`productPage.trustStrip` not ported). The prebuild step must only run the materializer when a content-packet exists and the warning condition is resolved — or must use the committed file as the baseline.
  - The `apps/caryina` build uses `next build --webpack`; no Turbopack edge case concerns here.
  - CI does not run the materializer (`caryina.yml` `build-cmd` contains no generation step).
  - Testing policy: never run jest locally; push and let CI run tests.
- Assumptions:
  - The materializer warning (`productPage.trustStrip` not yet ported) means a blind prebuild run would strip content. The safest prebuild is one that **only regenerates if the source hash has changed** — or the plan must first resolve the trustStrip gap in the materializer before wiring up the prebuild.
  - The committed `data/shops/caryina/site-content.generated.json` (repo root) is the primary copy used by the app in production (it is resolved first by `GENERATED_PAYLOAD_CANDIDATES`).
  - The `apps/caryina/data/` copy is an older diverged copy still tracked in git — it differs by the presence of a stale `chrome` key that was removed from the main copy.

## Outcome Contract

- **Why:** Fresh deployments and CI builds fail silently (500 on every page) when the content generation step is skipped. The materializer warning also means even manual re-runs are unsafe without the trustStrip fix.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Caryina app builds and serves content on fresh checkout without a separate manual generation step; all pages fall back to hardcoded safe content rather than throwing a 500 when the file is absent or malformed.
- **Source:** operator

## Current Process Map

- Trigger: Developer runs `pnpm --filter @apps/caryina build` (or CI triggers `caryina.yml`)
- End condition: App is deployed to Cloudflare Worker

### Process Areas
| Area | Current step-by-step flow | Owners / systems | Evidence refs | Known issues |
|---|---|---|---|---|
| Content generation | Operator manually runs `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina`. Result written to `data/shops/caryina/site-content.generated.json`. File is committed. | Developer / scripts CLI | `scripts/src/startup-loop/website/materialize-site-content-payload.ts` | Warning in JSON: "Do not run materializer without porting productPage.trustStrip first." Materializer does not emit trustStrip; file was extended manually post-generation. |
| Two-copy divergence | Two copies tracked in git: `data/shops/caryina/site-content.generated.json` (repo root, used by app in production) and `apps/caryina/data/shops/caryina/site-content.generated.json` (app-local, older, contains stale `chrome` key). | Developer | `contentPacket.ts` GENERATED_PAYLOAD_CANDIDATES lines 109–113; `git ls-files` output | Copies have diverged. App-local copy has stale `chrome` key that was removed from main copy and from `contentPacket.ts`. |
| App startup / runtime | On every server render, `readPayload()` in `contentPacket.ts` tries three candidate paths. If none exist: throws `Error("Missing generated site-content payload...")`. If file exists but is invalid: throws `Error("Invalid generated site-content payload...")`. | Next.js SSR / contentPacket.ts | `contentPacket.ts` lines 142–164 | Hard throw on both missing and invalid. No fallback. 500 propagates to every page that calls any `get*Content()` function. |
| CI build | `caryina.yml` calls `pnpm exec turbo run build --filter=@apps/caryina^...` then `opennextjs-cloudflare build`. No generation step before either. Relies entirely on committed file. | GitHub Actions / caryina.yml | `.github/workflows/caryina.yml` lines 54–62 | If committed file is stale or missing, build succeeds but deployed app serves 500 on every page. |
| No prebuild hook | `apps/caryina/package.json` has no `prebuild` script. `build` is `next build --webpack`. | apps/caryina/package.json | `apps/caryina/package.json` line 6 | Generation is entirely manual, undiscoverable from the build command. |

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates
None — this is a known concrete defect, not an unknown prescription problem.

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/src/app/[lang]/layout.tsx` — calls `getChromeContent()` on every page render; first point of 500 failure
- `apps/caryina/src/app/[lang]/page.tsx` — calls `getHomeContent()`
- `apps/caryina/src/app/[lang]/shop/page.tsx` — calls `getShopContent()`
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — calls `getProductPageContent()`, `getTrustStripContent()`
- `apps/caryina/src/app/[lang]/checkout/page.tsx` — calls `getSeoKeywords()`

### Key Modules / Files
- `apps/caryina/src/lib/contentPacket.ts` — the single module that reads the file; contains `readPayload()` with hard throws (lines 156–163); also contains `CHROME_DEFAULTS` and `TRUST_STRIP_DEFAULTS` as in-code fallbacks for optional sections
- `scripts/src/startup-loop/website/materialize-site-content-payload.ts` — the CLI tool that generates the file from `docs/business-os/startup-baselines/HBAG/content-packet.md`; does NOT include `trustStrip` in its output schema
- `data/shops/caryina/site-content.generated.json` — repo-root copy; used by app (candidate 1 in `GENERATED_PAYLOAD_CANDIDATES`); last generated 2026-02-28, manually extended with `trustStrip` post-generation
- `apps/caryina/data/shops/caryina/site-content.generated.json` — app-local copy; diverged (older, still has `chrome` key); checked into git; not used by running app (candidate 2, tried after repo root)
- `apps/caryina/package.json` — no `prebuild` script; `build` = `next build --webpack`
- `.github/workflows/caryina.yml` — CI deploy pipeline; no generation step

### Patterns & Conventions Observed
- `CHROME_DEFAULTS` and `TRUST_STRIP_DEFAULTS` in `contentPacket.ts` — evidence that the pattern of "hardcoded fallback + optional override from file" is already established for optional sections. This pattern should be extended to required sections.
- `parsePayloadFromPath` has retry logic for `Unexpected end of JSON input` (race condition guard) but returns `null` on failure — not a throw. The throw only happens in `readPayload()` after all candidates fail.
- The materializer's output schema (`SiteContentPayload` in `materialize-site-content-payload.ts`) does not include `trustStrip`, meaning any regeneration from the current materializer would strip the manually-added `trustStrip` from the file.

### Data & Contracts
- Types/schemas/events:
  - `SiteContentPayload` defined in `contentPacket.ts` (lines 71–106) — the expected JSON shape
  - `SiteContentPayload` also defined in `materialize-site-content-payload.ts` — slightly different (no `trustStrip`, no `chrome`) — schema drift between generator and consumer
- Persistence:
  - Two tracked copies: `data/shops/caryina/site-content.generated.json` (repo root, primary) and `apps/caryina/data/shops/caryina/site-content.generated.json` (app-local, stale)
  - Both committed to git; neither is `.gitignore`d
- API/contracts:
  - `GENERATED_PAYLOAD_CANDIDATES` resolution order: `process.cwd()/data/...` → `process.cwd()/apps/caryina/data/...` → `process.cwd()/../data/...`

### Dependency & Impact Map
- Upstream dependencies:
  - `docs/business-os/startup-baselines/HBAG/content-packet.md` — source for materializer
  - `docs/business-os/strategy/HBAG/logistics-pack.user.md` — source for policy copy
- Downstream dependents:
  - Every server-rendered page in `apps/caryina/src/app/[lang]/` (32 files import from `contentPacket`)
  - `apps/caryina/src/components/SiteFooter.tsx`, `Header.tsx`, `ShippingReturnsTrustBlock.tsx`
- Likely blast radius:
  - Missing file → 100% of server-rendered caryina pages throw 500
  - Graceful fallback → 0 pages affected

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest (config: `apps/caryina/jest.config.cjs`)
- Commands: `pnpm --filter @apps/caryina test` (CI only per testing policy)
- CI integration: `reusable-app.yml` runs Jest with `jest-force-coverage: true`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| contentPacket chrome | Unit | `apps/caryina/src/lib/contentPacket.test.ts` | Only tests `getChromeContent()` with DE/IT/EN locales — works because chrome uses `CHROME_DEFAULTS` which doesn't need the file |
| Page rendering | Unit | `apps/caryina/src/app/[lang]/*/page.test.tsx` (many) | Tests call page components; rely on real file being present in test env |
| Missing-file path | — | None | No test for `readPayload()` throwing when file is absent |
| Invalid-file path | — | None | No test for malformed JSON fallback |

#### Coverage Gaps
- Untested paths:
  - `readPayload()` when all candidates are missing → hard throw untested
  - `readPayload()` when file is malformed → hard throw untested
  - Any fallback behavior (doesn't exist yet)
- Extinct tests: none

#### Recommended Test Approach
- Unit tests for: `readPayload()` fallback when file absent (mock `fs.existsSync` to return false)
- Unit tests for: `readPayload()` fallback when file is malformed JSON
- Unit tests for: each `get*Content()` export returns hardcoded fallback copy when file absent

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No visual change; content is copy/text only | None | No |
| UX / states | Required | Currently: 500 error page on missing file — no graceful state | Missing file = entire shop offline; no empty state, no degraded mode, no helpful message | Yes — define fallback UX: which content sections get hardcoded defaults vs redirect to error page |
| Security / privacy | N/A | File is static JSON with no secrets; no auth involved | None | No |
| Logging / observability / audit | Required | Currently: error thrown propagates as unhandled 500 with no structured log | No logging when file is missing or malformed; operator has no visibility into which deployment is running stale content | Yes — add a warning log when falling back to defaults |
| Testing / validation | Required | `contentPacket.test.ts` only covers chrome defaults path; no tests for missing/invalid file | Zero coverage of error paths; fallback logic once added needs unit tests | Yes |
| Data / contracts | Required | Two-copy divergence (root vs app-local); materializer schema missing `trustStrip`; schema drift between generator and consumer | App-local copy is stale and diverged; regenerating from materializer would drop `trustStrip`; need to resolve before prebuild can be wired | Yes — resolve which path is canonical; port `trustStrip` to materializer or accept manual-only for that field |
| Performance / reliability | Required | Currently: if file is absent, every SSR request fails and throws; no cache or retry | Single point of failure with no degraded mode | Yes — fallback ensures reliability; prebuild ensures freshness |
| Rollout / rollback | Required | File is committed; regeneration is manual; no prebuild guard | If materializer run produces bad output, it breaks deployed app silently; no rollback mechanism other than reverting the JSON commit | Yes — prebuild should be idempotent; committed baseline is implicit rollback |

## Questions
### Resolved
- Q: Is the file committed to git or gitignored?
  - A: Both copies are tracked in git. Neither is listed in any `.gitignore`.
  - Evidence: `git ls-files` output confirmed both `data/shops/caryina/site-content.generated.json` and `apps/caryina/data/shops/caryina/site-content.generated.json` are tracked.

- Q: Does `contentPacket.ts` have any graceful fallback today?
  - A: Partial. `CHROME_DEFAULTS` and `TRUST_STRIP_DEFAULTS` are in-code fallbacks for the `chrome` and `trustStrip` optional keys. But `readPayload()` throws hard when the file is absent or missing required top-level keys (`home`, `shop`, `productPage`, `support`, `policies`).
  - Evidence: `contentPacket.ts` lines 135–163.

- Q: Why does the app-local copy exist separately?
  - A: The candidate resolution list was designed to work when `cwd()` is either the repo root or the app directory. The app-local copy appears to be a stale leftover from when the app was run from its own directory. It has diverged — it still has the `chrome` key that was removed from the main copy.
  - Evidence: `contentPacket.ts` lines 109–113; `diff` output showing the two files differ.

- Q: Why can't the materializer just be run in `prebuild` today?
  - A: The materializer's output schema does not include `productPage.trustStrip`. The currently-committed file has `trustStrip` added manually after generation. Running the materializer would overwrite and lose `trustStrip`. The JSON file itself contains an explicit warning: "Do not run materializer without porting productPage.trustStrip first."
  - Evidence: `data/shops/caryina/site-content.generated.json` line 3 (`_manualExtension` field); `materialize-site-content-payload.ts` `buildPayload()` — no `trustStrip` in `productPage`.

- Q: What is the correct fix approach?
  - A: Two-part fix. (1) Port `trustStrip` to the materializer's `buildPayload()` — reads from the content packet's trust-strip section, falling back to the `TRUST_STRIP_DEFAULTS` already defined in `contentPacket.ts`. Once ported, the materializer can be wired as a `prebuild` step. (2) Add graceful fallback in `readPayload()` — return a hardcoded `SAFE_DEFAULTS` payload instead of throwing, so the app serves degraded-but-functional content on a fresh checkout before the prebuild step has run.
  - Evidence: `materialize-site-content-payload.ts` `buildPayload()` structure; `TRUST_STRIP_DEFAULTS` in `contentPacket.ts`.

### Open (Operator Input Required)
- Q: Should the stale `apps/caryina/data/shops/caryina/site-content.generated.json` be deleted from git as part of this work?
  - Why operator input is required: This copy is tracked in git and has non-trivial diff from the main copy. Deleting it is low-risk (the app doesn't prefer it and it's stale) but it changes the git tree structure.
  - Decision impacted: Whether the plan includes a task to `git rm` the app-local copy.
  - Decision owner: Operator
  - Default assumption (if any) + risk: Default = delete it; risk is minimal since `GENERATED_PAYLOAD_CANDIDATES` tries the repo-root copy first and the app-local copy is already stale. Recommend including deletion in the plan.

## Confidence Inputs
- Implementation: 90% — all relevant code is read; the fix is well-scoped: port trustStrip to materializer + wire prebuild + add fallback in `readPayload()`
- Approach: 85% — the two-part approach is clear; the only uncertainty is whether the trustStrip porting should be a separate task or bundled
- Impact: 95% — confirmed that every page crashes on missing file; confirmed the exact throw location
- Delivery-Readiness: 85% — would be 90% if operator confirms the app-local copy deletion
- Testability: 90% — unit tests for `readPayload()` fallback are straightforward; `fs.existsSync` and `fs.readFileSync` are mockable

What would raise each to ≥90%:
- Implementation: already at 90%; would reach 95% after confirming content-packet's trustStrip section structure
- Approach: confirm operator preference on the stale copy deletion
- Impact: already at 95%
- Delivery-Readiness: operator answer on the one open question
- Testability: already at 90%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Materializer run strips trustStrip before it is ported | High (if prebuild wired before fix) | High — production content lost | Fix materializer first; prebuild only wired after materializer schema includes trustStrip |
| Fallback copy is developer-placeholder text visible to customers | Medium | Medium — trust/brand damage | Use real brand copy in the hardcoded fallback, not generator placeholders |
| Stale app-local copy causes confusion on candidate resolution | Low | Low | Delete stale app-local copy as part of cleanup |
| Materializer content-packet source drift causes silent stale content | Medium | Medium — outdated product copy in production | Wire sourceHash check in prebuild; only regenerate when hash changes |

## Planning Constraints & Notes
- Must-follow patterns:
  - `CHROME_DEFAULTS` / `TRUST_STRIP_DEFAULTS` pattern in `contentPacket.ts` — the fallback approach must mirror this existing pattern
  - `prebuild` must be idempotent (safe to run when file already exists and hash is unchanged)
  - `prebuild` script in `apps/caryina/package.json` runs with `cwd = apps/caryina/`; the materializer must be invoked with `--repo-root ../..` to resolve the content-packet path correctly
  - Testing policy: no jest locally; tests run in CI only
- Rollout/rollback expectations:
  - The committed JSON is the implicit rollback baseline; never delete it without a replacement
  - Prebuild should write to the same `data/shops/caryina/site-content.generated.json` path (repo root)
- Observability expectations:
  - `console.warn` or structured log when `readPayload()` falls back to defaults (aids debugging)

## Suggested Task Seeds (Non-binding)
1. Port `productPage.trustStrip` to `materializeSiteContentPayload()` in `materialize-site-content-payload.ts` — read from content-packet `### Trust Strip` section, fall back to `TRUST_STRIP_DEFAULTS`-equivalent defaults
2. Wire `prebuild` in `apps/caryina/package.json`: `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --repo-root ../..` — note: must pass `--repo-root` because `package.json` scripts run with `cwd` = `apps/caryina/`, but the materializer default `repoRoot` is `process.cwd()` which would mis-resolve the content-packet path
3. Add `SAFE_DEFAULTS` payload constant in `contentPacket.ts`; replace hard throws in `readPayload()` with `console.warn` + return of safe defaults
4. Delete stale `apps/caryina/data/shops/caryina/site-content.generated.json` (operator confirm)
5. Add unit tests: `readPayload()` returns defaults when file absent; `readPayload()` returns defaults when file is malformed JSON
6. Remove `_manualExtension` warning comment from the committed JSON (no longer needed once materializer is updated)

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `prebuild` script added to `apps/caryina/package.json`
  - `readPayload()` does not throw when file is absent
  - At least 2 new unit tests covering the fallback paths
  - `apps/caryina` typecheck passes
  - CI build succeeds without pre-generating the file manually
- Post-delivery measurement plan:
  - Deploy to staging, remove or rename the JSON file on the test runner, confirm app serves content (not 500)

## Evidence Gap Review
### Gaps Addressed
- How the file is generated: confirmed — `materializeSiteContentPayload()` CLI in `scripts/`, invoked manually with `--business HBAG --shop caryina`
- Whether it is committed: confirmed — both copies tracked in git, neither gitignored
- Why the crash happens: confirmed — `readPayload()` throws `Error` on line 157/161; no catch above it in any page
- Whether CI regenerates it: confirmed — no generation step in `caryina.yml`
- What the correct fix is: confirmed — two-part: port trustStrip to materializer + add fallback in `readPayload()`

### Confidence Adjustments
- Approach starts at 85% (not 95%); the trustStrip section format in the content packet has not been verified (the materializer needs to parse it correctly), keeping it at 85%

### Remaining Assumptions
- The `docs/business-os/startup-baselines/HBAG/content-packet.md` exists and has a `### Trust Strip` section (or equivalent) that the materializer can parse — not verified but assumed from the context note in the JSON
- The `SAFE_DEFAULTS` fallback copy will use the hardcoded brand copy already in `CHROME_DEFAULTS` / `TRUST_STRIP_DEFAULTS` as a model

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `contentPacket.ts` throw paths | Yes | None | No |
| Materializer output schema vs consumer schema drift | Yes | [Data] [High]: `trustStrip` in consumer not emitted by generator — requires porting before prebuild can be wired | Yes — resolved in task seed 1 |
| Two-copy divergence | Yes | [Data] [Medium]: app-local copy is stale and tracked in git | Operator decision on deletion — defaulted to delete |
| CI pipeline (no generation step) | Yes | [Reliability] [High]: CI builds succeed but deployed app crashes on any page | No — addressed by prebuild task |
| Test coverage for error paths | Yes | [Testing] [High]: zero tests for missing/invalid file | No — addressed by task seed 5 |
| Rollback path | Yes | [Rollout] [Low]: committed file serves as implicit rollback | No |

## Scope Signal
- Signal: right-sized
- Rationale: The scope is tightly bounded to two modules (`contentPacket.ts` and `materialize-site-content-payload.ts`) plus one config file (`package.json`). The materializer trustStrip porting is a prerequisite but is a small, well-understood change. The fallback logic mirrors an existing pattern already in the codebase.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items: none (the one open question about the stale copy deletion defaults to "delete" and is low-risk)
- Recommended next step: `/lp-do-analysis caryina-site-content-build-resilience`
