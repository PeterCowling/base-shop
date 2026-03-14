---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Status: Archived
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-site-content-build-resilience
Dispatch-ID: IDEA-DISPATCH-20260314160001-PLAT-011
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/caryina-site-content-build-resilience/analysis.md
---

# Caryina Site-Content Build Resilience Plan

## Summary
The Caryina shop crashes (500) on every page when `data/shops/caryina/site-content.generated.json` is absent. This plan fixes that in three layers: (1) port `productPage.trustStrip` into the materializer so regeneration can run safely; (2) add a `prebuild` script that auto-generates the file before `next build`; and (3) add a runtime fallback in `readPayload()` so the app serves safe hardcoded copy rather than throwing when the file is missing or malformed. A stale second tracked copy of the file is also removed, and unit tests are added for the new fallback paths.

## Active tasks
- [x] TASK-01: Port trustStrip to materializer — Complete (2026-03-14)
- [x] TASK-02: Add runtime fallback in contentPacket.ts — Complete (2026-03-14)
- [x] TASK-03: Add prebuild script to apps/caryina/package.json — Complete (2026-03-14)
- [x] TASK-04: Remove stale app-local content file — Complete (2026-03-14)
- [x] TASK-05: Add unit tests for fallback paths — Complete (2026-03-14)

## Goals
- App never crashes with 500 when content file is absent or malformed
- Fresh checkout builds and serves content without a manual generation step
- Single authoritative copy of the generated content file
- Unit tests cover fallback paths

## Non-goals
- Migrating content to a DB/CMS
- Internationalising fallback copy
- Runtime content hot-reload
- Changing the `compile-website-content-packet` pipeline

## Constraints & Assumptions
- Constraints:
  - `trustStrip` must not be dropped; it is customer-visible on every PDP
  - `prebuild` in `apps/caryina/package.json` runs with `cwd = apps/caryina/` — materializer must be invoked with `--repo-root ../..`
  - CI `caryina.yml` build command is unchanged (no workflow file PR needed — prebuild runs automatically as part of `next build`)
  - Testing policy: tests run in CI only, never locally
- Assumptions:
  - `## Reusable Trust Blocks` section in `HBAG/content-packet.md` provides the 3 trust bullet texts (confirmed)
  - Committed `data/shops/caryina/site-content.generated.json` at repo root is the authoritative copy
  - `cachedPayload` module-level cache in `contentPacket.ts` requires `jest.resetModules()` between tests testing the missing/malformed paths

## Inherited Outcome Contract
- **Why:** Fresh deployments and CI builds fail silently (500 on every page) when the content generation step is skipped. The materializer warning also means even manual re-runs are unsafe without the trustStrip fix.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Caryina app builds and serves content on fresh checkout without a separate manual generation step; all pages fall back to hardcoded safe content rather than throwing a 500 when the file is absent or malformed.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/caryina-site-content-build-resilience/analysis.md`
- Selected approach inherited:
  - Option C: Port trustStrip to materializer + add prebuild + add runtime fallback + delete stale copy + add tests
- Key reasoning used:
  - Option B (prebuild without trustStrip port) is unsafe: materializer would strip trustStrip on first hash-change regeneration
  - Option A alone (fallback only) leaves fresh checkout serving placeholder copy — doesn't fulfil the outcome contract
  - The `## Reusable Trust Blocks` heading is h2 (`##`), not h3 (`###`), so `extractBulletList()` cannot be used; a new h2-capable extractor is required

## Selected Approach Summary
- What was chosen:
  - Port `productPage.trustStrip` to `materializeSiteContentPayload()` using a new `extractH2BulletList()` function
  - Add `prebuild` script in `apps/caryina/package.json` with `--repo-root ../..`
  - Replace hard throws in `readPayload()` with `console.warn` + return of `SAFE_DEFAULTS`
  - `git rm` the stale `apps/caryina/data/shops/caryina/site-content.generated.json`
  - Add unit tests using `jest.resetModules()` + `jest.mock("node:fs", ...)`
- Why planning is not reopening option selection:
  - Analysis settled the trustStrip porting decision, the prebuild cwd constraint, and the h2-extractor requirement with direct code evidence

## Fact-Find Support
- Supporting brief: `docs/plans/caryina-site-content-build-resilience/fact-find.md`
- Evidence carried forward:
  - `readPayload()` throws on lines 157/161 — exact throw sites identified
  - `TRUST_STRIP_DEFAULTS` already in `contentPacket.ts` — pattern to follow for `SAFE_DEFAULTS`
  - `extractBulletList()` at line 95 uses `^###\s+` — confirmed can't match `##`
  - `cachedPayload` is module-level — `jest.resetModules()` required for isolation
  - Two tracked copies confirmed via `git ls-files`; app-local copy has diverged `chrome` key

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Port trustStrip to materializer | 85% | M | Complete (2026-03-14) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add runtime fallback in contentPacket.ts | 90% | S | Complete (2026-03-14) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Add prebuild script to apps/caryina/package.json | 90% | S | Complete (2026-03-14) | TASK-01 | - |
| TASK-04 | IMPLEMENT | Remove stale app-local content file | 95% | S | Complete (2026-03-14) | - | - |
| TASK-05 | IMPLEMENT | Add unit tests for fallback paths | 85% | M | Complete (2026-03-14) | TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no visual change | - | Content is copy/text; no rendering change |
| UX / states | Fallback returns safe defaults on missing/malformed file; shop renders degraded but functional | TASK-02 | `console.warn` makes degraded state visible in logs |
| Security / privacy | N/A — file is static JSON, no auth | - | No secrets in content file |
| Logging / observability / audit | `console.warn` when falling back to defaults | TASK-02 | CI logs capture prebuild materializer run output |
| Testing / validation | Unit tests for missing-file and malformed-JSON fallback paths | TASK-05 | Uses `jest.resetModules()` + `jest.mock("node:fs", ...)` |
| Data / contracts | Materializer schema extended with `trustStrip`; stale copy removed; single canonical path | TASK-01, TASK-04 | Schema drift resolved |
| Performance / reliability | Single point of failure eliminated; prebuild ensures fresh content before build | TASK-02, TASK-03 | Fallback is hot-path safe (returns constant, no I/O after first success) |
| Rollout / rollback | Committed JSON is rollback baseline; materializer change is additive | TASK-01 | No migration needed; revert JSON commit to roll back |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-02, TASK-04 | None | Independent; TASK-02 is foundation for TASK-05 |
| 2 | TASK-01 | None (independent of wave 1 but sequenced before TASK-03) | Can run in parallel with wave 1 |
| 3 | TASK-03 | TASK-01 complete | Prebuild only after materializer includes trustStrip |
| 3 | TASK-05 | TASK-02 complete | Tests only after fallback exists |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Content generation | `pnpm build` or CI push to `caryina.yml` | (1) `prebuild` runs materializer `--business HBAG --shop caryina --repo-root ../..`; (2) materializer reads `HBAG/content-packet.md`; (3) writes `data/shops/caryina/site-content.generated.json`; (4) `next build` consumes freshly-written file | TASK-01, TASK-03 | If content-packet is missing (corrupt checkout), materializer fails `ok:false` → prebuild exits non-zero → build fails with diagnostic (correct failure mode) |
| Runtime resilience | SSR page render when file absent or malformed | `readPayload()` logs warning, returns `SAFE_DEFAULTS`; all `get*Content()` exports return safe brand copy; pages render without crashing | TASK-02 | Fallback copy must be real brand copy (not generator placeholders) — TASK-02 responsibility |
| Stale copy removal | PR merge | `apps/caryina/data/shops/caryina/site-content.generated.json` removed from git; candidate resolution unchanged (repo-root copy is still candidate 1) | TASK-04 | None |
| Test coverage | CI test run | New describe block in `contentPacket.test.ts`: missing-file case returns `SAFE_DEFAULTS`; malformed-JSON case returns `SAFE_DEFAULTS`; existing chrome tests unaffected | TASK-05 | Must use `jest.resetModules()` to clear module cache between tests |

## Tasks

---

### TASK-01: Port trustStrip to materializer
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/startup-loop/website/materialize-site-content-payload.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/website/materialize-site-content-payload.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — `extractBulletList` pattern is clear; need to add `extractH2BulletList`; `## Reusable Trust Blocks` bullet content confirmed; `securePayment` key requires default since no matching bullet in content-packet
  - Approach: 90% — analysis resolved the h2-heading extractor requirement directly; no remaining approach uncertainty
  - Impact: 90% — without this, prebuild (TASK-03) cannot be wired safely; with it, schema drift is resolved
  - *min: 85% (Implementation)*
  - Held-back test (Implementation = 85%, not capped): The one unresolved detail — how to map the 3 `## Reusable Trust Blocks` bullets to the `{ delivery, exchange, origin, securePayment }` keys positionally vs by content-match — if it resolves badly (bullets reordered in content-packet), the mapping would be wrong. This is handled by making the mapping explicit (position 0 = delivery, position 1 = exchange, position 2 = origin) with a clear comment, which is acceptable for a controlled internal doc.
- **Acceptance:**
  - `materializeSiteContentPayload()` output includes `productPage.trustStrip` with `delivery`, `exchange`, `origin`, `securePayment` fields
  - `delivery`, `exchange`, `origin` values extracted from `## Reusable Trust Blocks` bullets in content-packet
  - `securePayment` falls back to `TRUST_STRIP_DEFAULTS.securePayment.en` (not from content-packet — no matching bullet exists)
  - Existing materializer tests continue to pass
  - New test: materializer output with a content-packet containing `## Reusable Trust Blocks` produces non-empty trustStrip
  - TypeScript: `SiteContentPayload.productPage.trustStrip` added to materializer type definition
- **Engineering Coverage:**
  - UI / visual: N/A — no UI change
  - UX / states: N/A — script-only change
  - Security / privacy: N/A
  - Logging / observability / audit: N/A — materializer stdout is sufficient
  - Testing / validation: Required — add test in `scripts/src/startup-loop/__tests__/materialize-site-content-payload.test.ts` for trustStrip extraction
  - Data / contracts: Required — add `trustStrip?: { delivery: LocalizedText; exchange: LocalizedText; origin: LocalizedText; securePayment: LocalizedText }` to `SiteContentPayload` in materializer; update `buildPayload()` to populate it
  - Performance / reliability: N/A — build-time script
  - Rollout / rollback: N/A — additive; no field removed
- **Validation contract:**
  - TC-01: materializer called with content-packet containing `## Reusable Trust Blocks` with 3 bullets → output `productPage.trustStrip.delivery`, `.exchange`, `.origin` non-empty strings matching first 3 bullets respectively
  - TC-02: materializer called with content-packet missing `## Reusable Trust Blocks` → `productPage.trustStrip` is either absent or has all fields from defaults (not empty strings that break PDP)
  - TC-03: `productPage.trustStrip.securePayment` is always populated (either from defaults) regardless of content-packet content
- **Execution plan:**
  - Red: add a test in `materialize-site-content-payload.test.ts` that asserts `result.payload.productPage.trustStrip.delivery` is non-empty (test will fail — field doesn't exist yet)
  - Green: (1) add `extractH2BulletList(markdown: string, heading: string): string[]` function using `^##\s+` pattern; (2) extend `SiteContentPayload` type in materializer with `trustStrip` field on `productPage`; (3) call `extractH2BulletList(packetContent, "Reusable Trust Blocks")` in `buildPayload()` and map position 0→delivery, 1→exchange, 2→origin, with `securePayment` always defaulting to `"Secure checkout"`; (4) test passes
  - Refactor: add a comment explaining the positional mapping and the `securePayment` default
- **Planning validation:**
  - Checks run: read `materialize-site-content-payload.ts` lines 94–113 (extractBulletList), confirmed h3-only pattern; read `HBAG/content-packet.md` confirmed `## Reusable Trust Blocks` with 3 bullets; confirmed `securePayment` has no matching bullet
  - Validation artifacts: `scripts/src/startup-loop/website/materialize-site-content-payload.ts`, `docs/business-os/startup-baselines/HBAG/content-packet.md`
  - Unexpected findings: `extractBulletList` stop-condition uses `^#{2,}\s+` — stops at any `##` or `###` heading. The new `extractH2BulletList` can reuse the same stop pattern.
- **Consumer tracing (new output: `trustStrip` in materializer payload):**
  - New field `productPage.trustStrip` produced by materializer → written to `data/shops/caryina/site-content.generated.json` → consumed by `contentPacket.ts` `getTrustStripContent()` via `readPayload().productPage.trustStrip` (line 245) → already uses `mergeLocalizedSection(TRUST_STRIP_DEFAULTS, ...)` so existing consumers (`PdpTrustStrip.tsx`, `page.tsx` in product slug) are unchanged. No consumer update needed.
- **Scouts:** Confirm `## Reusable Trust Blocks` heading text is stable in content-packet (no variant casing) — read during planning: confirmed as `## Reusable Trust Blocks`
- **Edge Cases & Hardening:**
  - Content-packet has 0 bullets in the section → all 3 keys (`delivery`, `exchange`, `origin`) fall back to defaults from `TRUST_STRIP_DEFAULTS`
  - Content-packet has 1 or 2 bullets → only mapped keys populated; unmapped fall back to defaults
  - Section heading renamed → no match → all fall back to defaults (acceptable — documented in analysis)
- **What would make this >=90%:**
  - Confirming the positional mapping is stable (delivery always first, exchange second, origin third) by cross-checking with `TRUST_STRIP_DEFAULTS` order — confirmed during planning
- **Rollout / rollback:**
  - Rollout: additive field; no existing consumer breaks; old JSON without trustStrip continues to work via `mergeLocalizedSection` defaults
  - Rollback: revert the materializer change; run materializer once to regenerate without trustStrip; commit
- **Documentation impact:** Remove `_manualExtension` warning from committed JSON after TASK-03 regenerates the file
- **Notes / references:** `extractBulletList` stop regex at line 104: `rest.search(/^#{2,}\s+/m)` — reuse this pattern in `extractH2BulletList`

---

### TASK-02: Add runtime fallback in contentPacket.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/caryina/src/lib/contentPacket.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/contentPacket.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — pattern is identical to `CHROME_DEFAULTS` / `TRUST_STRIP_DEFAULTS` already in the file; throw locations confirmed; `cachedPayload` variable identified
  - Approach: 95% — fully settled in analysis; no ambiguity
  - Impact: 90% — eliminates 100% of 500 crashes from missing/malformed file
  - *min: 90% (Implementation, Impact)*
  - Held-back test (Implementation = 90%): "What single unknown would drop this below 90%?" — The `SAFE_DEFAULTS` copy content. If we use placeholder text visible to customers on a degraded-mode page, it causes a brand issue. Mitigation: use real brand copy from the committed JSON for all text fields. This is fully resolvable within the task, so 90% stands.
- **Acceptance:**
  - `readPayload()` does not throw when no candidate file exists — returns `SAFE_DEFAULTS` after logging a `console.warn`
  - `readPayload()` does not throw when all candidates have malformed JSON — returns `SAFE_DEFAULTS` after logging a `console.warn`
  - All `get*Content()` exports (`getHomeContent`, `getShopContent`, `getLaunchFamilyCopy`, `getProductPageContent`, `getSupportContent`, `getPolicyContent`, `getSeoKeywords`, `getContentSourcePaths`, `getChromeContent`, `getTrustStripContent`) return usable non-empty values in the fallback state
  - `console.warn` message includes the list of checked paths (same detail as current error message)
  - TypeScript: no new type errors
- **Engineering Coverage:**
  - UI / visual: N/A — no rendering change; fallback returns same-typed values
  - UX / states: Required — fallback state returns safe brand copy; shop renders without crashing in degraded mode
  - Security / privacy: N/A
  - Logging / observability / audit: Required — `console.warn` with checked paths list on both fallback triggers (missing file and invalid file)
  - Testing / validation: Required — tested by TASK-05
  - Data / contracts: Required — `SAFE_DEFAULTS` must be a valid `SiteContentPayload` that passes the `parsed.home && parsed.shop && ...` structure check in `parsePayloadFromPath`; however since we bypass `parsePayloadFromPath` in the fallback path, `SAFE_DEFAULTS` just needs to satisfy `SiteContentPayload` TypeScript type
  - Performance / reliability: Required — `SAFE_DEFAULTS` is a module-level constant (no I/O); fallback path is fast
  - Rollout / rollback: Required — change is purely additive; existing throw behaviour unreachable after change; rollback = revert the file
- **Validation contract:**
  - TC-01: all candidate paths mocked to `existsSync → false` → `readPayload()` returns object with `home.heading.en` non-empty (SAFE_DEFAULTS used)
  - TC-02: candidate path mocked to exist with `readFileSync → "not-json{"` → `readPayload()` returns `SAFE_DEFAULTS` (malformed JSON case)
  - TC-03: `console.warn` called once in TC-01 scenario with message containing checked paths
  - TC-04: `getHomeContent("en")` called after TC-01 state → returns string, does not throw
- **Execution plan:**
  - Red: N/A — this is a pure implementation change; tests are in TASK-05 which depends on this task
  - Green: (1) Define `SAFE_DEFAULTS: SiteContentPayload` constant in `contentPacket.ts` using real brand copy from `data/shops/caryina/site-content.generated.json` for home/shop/productPage/support/policies; use `TRUST_STRIP_DEFAULTS` for trustStrip; include `launchFamilies` with real labels; (2) in `readPayload()`, replace the two `throw new Error(...)` statements with `console.warn(...)` + `return SAFE_DEFAULTS`; (3) also set `cachedPayload = SAFE_DEFAULTS` in the fallback return so subsequent calls don't re-read the filesystem
  - Refactor: add a `// @visible-fallback` comment above `SAFE_DEFAULTS` explaining it is used when the file is absent; ensure copy is real brand text
- **Planning validation:**
  - Checks run: confirmed both throw sites at lines 157 and 161; confirmed `cachedPayload` is module-level let at line 115; confirmed `TRUST_STRIP_DEFAULTS` shape at lines 233–238; confirmed all exports use `readPayload()` as the single entry point
  - Validation artifacts: `apps/caryina/src/lib/contentPacket.ts`
  - Unexpected findings: `cachedPayload` is set inside the loop at line 151 on first successful parse. In the fallback path, we should also set `cachedPayload = SAFE_DEFAULTS` to avoid re-reading the filesystem on every SSR request during degraded operation.
- **Consumer tracing (SAFE_DEFAULTS as new output of readPayload):**
  - `getHomeContent()`, `getShopContent()`, `getLaunchFamilyCopy()`, `getProductPageContent()`, `getTrustStripContent()`, `getSupportContent()`, `getPolicyContent()`, `getChromeContent()`, `getSeoKeywords()`, `getContentSourcePaths()` — all call `readPayload()` and access specific keys. All keys must be present in `SAFE_DEFAULTS`. TypeScript compiler will enforce this at compile time (strict typing). All consumers are safe — no consumer-specific update needed.
- **Scouts:** None — pattern is already established in the same file
- **Edge Cases & Hardening:**
  - File partially written (concurrent write) → `Unexpected end of JSON input` retried 3× by `parsePayloadFromPath`; if still fails after 3 attempts, falls back to `SAFE_DEFAULTS`
  - Valid file exists but missing required top-level keys → `parsePayloadFromPath` returns `null` → falls through to fallback
- **What would make this >=90%:** Already at 90%; would reach 95% with confirmed `SAFE_DEFAULTS` copy reviewed and approved by operator.
- **Rollout / rollback:**
  - Rollout: purely additive; no existing behaviour changed until the file is absent
  - Rollback: revert `contentPacket.ts`
- **Documentation impact:** None beyond the `@visible-fallback` comment
- **Notes / references:** `cachedPayload` set-in-fallback note: line 151 is inside a success loop — the fallback path must explicitly set `cachedPayload = SAFE_DEFAULTS` before returning

---

### TASK-03: Add prebuild script to apps/caryina/package.json
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/caryina/package.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/package.json`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — single-line change; `--repo-root ../..` requirement confirmed; materializer CLI path confirmed in `scripts/package.json`
  - Approach: 95% — fully settled
  - Impact: 90% — eliminates the need for any manual generation step before build
  - *min: 90% (Implementation, Impact)*
  - Held-back test (Implementation = 90%): "What would drop this below 90%?" — `pnpm --filter scripts` resolution failing in the context of `cwd = apps/caryina/` when running as a workspace script. This is standard pnpm workspace behaviour and has been confirmed working for other apps that call cross-workspace scripts via `package.json`. Confidence 90% stands.
- **Acceptance:**
  - `apps/caryina/package.json` has a `"prebuild"` script
  - `prebuild` invokes `pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --repo-root ../..`
  - Running `pnpm --filter @apps/caryina build` from repo root triggers `prebuild` automatically before `next build`
  - `data/shops/caryina/site-content.generated.json` is up-to-date after `prebuild` runs
  - TypeScript: no change
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — build-time only
  - Security / privacy: N/A
  - Logging / observability / audit: N/A — materializer stdout captured in CI logs
  - Testing / validation: N/A — validated by running build in CI; no unit test needed for a one-line package.json script
  - Data / contracts: Required — prebuild must run AFTER TASK-01 lands (materializer includes trustStrip); constraint enforced by TASK-01 blocking TASK-03
  - Performance / reliability: N/A — build-time only; materializer is fast (<1s)
  - Rollout / rollback: Required — if materializer fails (content-packet missing), build fails with diagnostic rather than silently deploying a broken app; this is the correct behaviour
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/caryina build` from repo root runs materializer before `next build` (confirmed by checking CI log output)
  - TC-02: if `HBAG/content-packet.md` is absent, `prebuild` exits non-zero and build stops (correct failure mode; no silently broken deploy)
- **Execution plan:**
  - Red: N/A — single-line config change, no test required
  - Green: Add `"prebuild": "pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business HBAG --shop caryina --repo-root ../.."` to the `"scripts"` object in `apps/caryina/package.json`
  - Refactor: None
- **Planning validation:**
  - Checks run: confirmed `scripts/package.json` has `startup-loop:materialize-site-content-payload` script at line 19; confirmed `--repo-root` is a supported CLI flag in materializer at line 464 (`parseCliArgs`)
  - Validation artifacts: `scripts/package.json`, `scripts/src/startup-loop/website/materialize-site-content-payload.ts`
  - Unexpected findings: None
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Build run from inside `apps/caryina/` directly (not from repo root) → `--repo-root ../..` resolves correctly since `../..` is relative to `apps/caryina/` = repo root
  - pnpm workspace resolution: `pnpm --filter scripts` works from any directory in the workspace
- **What would make this >=90%:** Already at 90%; running the prebuild manually once and observing the output would raise to 95%.
- **Rollout / rollback:**
  - Rollout: effective immediately on next CI build
  - Rollback: remove the `prebuild` line from `package.json`
- **Documentation impact:** Update `_manualExtension` field in the committed JSON or remove it — no longer needed after prebuild is wired
- **Notes / references:** pnpm `prebuild` lifecycle hook runs automatically before `build` — no extra wiring needed

---

### TASK-04: Remove stale app-local content file
- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove `apps/caryina/data/shops/caryina/site-content.generated.json` from git
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/data/shops/caryina/site-content.generated.json` (deleted)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — `git rm` a tracked file; zero code change; confirmed the candidate list always tries repo-root copy first
  - Approach: 95% — analysis resolved this; stale copy was never preferred
  - Impact: 95% — removes maintenance confusion; no functional change
  - *min: 95%*
- **Acceptance:**
  - `apps/caryina/data/shops/caryina/site-content.generated.json` no longer exists in the git tree
  - `apps/caryina/data/shops/caryina/` directory also removed (it will be empty)
  - App still resolves content file correctly via `data/shops/caryina/site-content.generated.json` (repo root, candidate 1)
  - Typecheck passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A
  - Security / privacy: N/A
  - Logging / observability / audit: N/A
  - Testing / validation: N/A — no test needed; candidate resolution unchanged
  - Data / contracts: Required — verify `GENERATED_PAYLOAD_CANDIDATES` (lines 109–113 in `contentPacket.ts`) still has the repo-root path as first candidate; confirmed during planning
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — file was never preferred; its removal has zero runtime impact
- **Validation contract:**
  - TC-01: after `git rm`, `git ls-files apps/caryina/data/` returns empty
  - TC-02: `pnpm --filter @apps/caryina typecheck` passes
- **Execution plan:**
  - Red: N/A
  - Green: `git rm -r apps/caryina/data/`
  - Refactor: None
- **Planning validation:**
  - Checks run: confirmed `GENERATED_PAYLOAD_CANDIDATES[0]` = `path.resolve(process.cwd(), "data/shops/caryina/site-content.generated.json")` — repo root, not app-local; confirmed app-local is candidate index 1
  - Validation artifacts: `apps/caryina/src/lib/contentPacket.ts` lines 109–113
  - Unexpected findings: `apps/caryina/data/` only contains `shops/caryina/site-content.generated.json` — removing the directory removes only this one file
- **Scouts:** None
- **Edge Cases & Hardening:** None — file deletion is atomic; no edge cases
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: effective on commit
  - Rollback: `git revert` or restore the file from git history; low priority since it was never preferred
- **Documentation impact:** None
- **Notes / references:** `git rm -r apps/caryina/data/` removes the directory and all contents

---

### TASK-05: Add unit tests for fallback paths
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/caryina/src/lib/contentPacket.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/contentPacket.test.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `jest.mock("node:fs", ...)` pattern confirmed in repo; `jest.resetModules()` required to clear `cachedPayload` cache; this is the tricky part — if reset doesn't clear the cache, tests will not correctly test the missing-file path
  - Approach: 85% — standard pattern; the `cachedPayload` isolation challenge is known and the `jest.resetModules()` approach is confirmed as viable from other tests in the repo
  - Impact: 90% — tests directly verify the core resilience behaviour
  - *min: 85% (Implementation, Approach)*
  - Held-back test (Implementation = 85%): "`cachedPayload` module-level variable may not be reset by `jest.resetModules()` if the module is re-required before the mock is re-established." The correct pattern is: (1) call `jest.resetModules()`; (2) re-apply `jest.mock("node:fs", ...)`; (3) require the module fresh using `jest.isolateModules()` or a dynamic require. If this pattern fails, the test would always hit the cached value from a previous test that succeeded. Resolution: use `jest.isolateModules(() => { const { readPayload } = require("./contentPacket"); ... })` inside each fallback test case.
- **Acceptance:**
  - New `describe("readPayload — fallback paths")` block in `contentPacket.test.ts`
  - TC-01: all candidates mocked `existsSync → false` → `getHomeContent("en")` returns object with non-empty `heading` string; `console.warn` called
  - TC-02: candidate mocked to exist with `readFileSync → "invalid json{"` → same result as TC-01
  - TC-04: existing chrome locale tests (`describe("getChromeContent — DE locale")` etc.) continue to pass unaffected
  - `pnpm --filter @apps/caryina typecheck` passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: Required — validates the degraded state UX (fallback returns usable copy)
  - Security / privacy: N/A
  - Logging / observability / audit: Required — verifies `console.warn` is called in fallback state
  - Testing / validation: Required — this task IS the testing coverage
  - Data / contracts: N/A — no schema change in tests
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract:**
  - TC-01: `existsSync` mocked to `() => false` for all paths → `getHomeContent("en").heading` is a non-empty string → `console.warn` spy called with message containing "Missing"
  - TC-02: `existsSync` mocked to return `true` for one path, `readFileSync` mocked to return `"invalid{json"` → `getHomeContent("en").heading` is a non-empty string (SAFE_DEFAULTS used) → `console.warn` spy called
  - TC-03: existing chrome tests in same file still pass after adding new describe block
- **Execution plan:**
  - Red: N/A (tests are new — they will pass once TASK-02 is done and the tests are written correctly)
  - Green: Add `describe("readPayload — fallback paths")` block to `contentPacket.test.ts`. Each test uses: (1) `jest.isolateModules(() => { jest.mock("node:fs", () => ({ existsSync: () => false, readFileSync: jest.fn() })); const mod = require("./contentPacket"); expect(mod.getHomeContent("en").heading).toBeTruthy(); })`. Note: path is `"./contentPacket"` (same directory as the test file). Similar approach for malformed JSON test.
  - Refactor: Add `jest.spyOn(console, "warn")` before the mock to assert the warn is called
- **Planning validation:**
  - Checks run: confirmed `contentPacket.ts` uses `import * as fs from "node:fs"` — `jest.mock("node:fs", ...)` is the correct intercept; confirmed `cachedPayload` is module-scoped (not exported) — `jest.resetModules()` clears it by reloading the module; confirmed `jest.isolateModules()` pattern used in scripts tests
  - Validation artifacts: `apps/caryina/src/lib/contentPacket.ts` lines 1, 115, 142–164
  - Unexpected findings: `contentPacket.test.ts` currently imports `getChromeContent` at module level (line 1). The new fallback tests must NOT be in the same static import scope as the existing chrome tests — they need fresh module instances. Use `jest.isolateModules()` to keep them isolated.
- **Consumer tracing (new test describe block):**
  - Tests consume `getHomeContent` (exported from `contentPacket.ts`) — no change to consumer code
  - `jest.isolateModules()` means the mock only affects tests inside the isolate block; chrome tests remain at module-top-level import (unaffected)
- **Scouts:** None
- **Edge Cases & Hardening:**
  - If `jest.isolateModules()` is unavailable in the jest version used by caryina → fallback to `jest.resetModules()` + dynamic require in `beforeEach`/`afterEach` block
- **What would make this >=90%:**
  - Confirming `jest.isolateModules()` works correctly in the caryina jest config (can be verified by running existing isolated-module tests in other parts of the repo)
- **Rollout / rollback:**
  - Rollout: tests added; CI will run them
  - Rollback: revert `contentPacket.test.ts`
- **Documentation impact:** None
- **Notes / references:** `GENERATED_PAYLOAD_CANDIDATES` has 3 paths — mock must return `false` for all three `existsSync` calls; use a general `existsSync: () => false` mock to cover all candidates

---

## Risks & Mitigations
- **Positional bullet mapping (TASK-01)**: `## Reusable Trust Blocks` bullets may be reordered in the content-packet. Mitigation: use positional mapping with fallback-to-defaults for any missing position; document the expected order in a comment. If bullets are reordered, trustStrip fields fall back to defaults (acceptable).
- **`cachedPayload` isolation in tests (TASK-05)**: Module-level cache may bleed between tests if isolation is not correct. Mitigation: use `jest.isolateModules()` per test, confirmed as the right pattern.
- **pnpm workspace `--filter scripts` from `apps/caryina/` (TASK-03)**: Cross-workspace pnpm invocation from `prebuild`. Mitigation: this is standard pnpm workspace behaviour; confirmed by analogy with other cross-workspace scripts in the repo.

## Observability
- Logging: `console.warn` emitted by `readPayload()` when falling back to `SAFE_DEFAULTS`; message includes list of checked paths
- Metrics: None — no instrumentation change
- Alerts/Dashboards: None — CI build failure (prebuild exit non-zero) is the alert mechanism for missing content-packet

## Acceptance Criteria (overall)
- [ ] `pnpm --filter @apps/caryina build` succeeds on fresh checkout without running materializer manually
- [ ] `data/shops/caryina/site-content.generated.json` is regenerated by `prebuild` and contains `productPage.trustStrip` with non-empty values
- [ ] `readPayload()` does not throw when content file is absent — returns `SAFE_DEFAULTS` with `console.warn`
- [ ] `readPayload()` does not throw when content file is malformed JSON — returns `SAFE_DEFAULTS`
- [ ] `apps/caryina/data/shops/caryina/site-content.generated.json` no longer in git
- [ ] New unit tests cover missing-file and malformed-JSON fallback paths and pass in CI
- [ ] `pnpm --filter @apps/caryina typecheck` passes
- [ ] Existing `contentPacket.test.ts` chrome locale tests still pass

## Decision Log
- 2026-03-14: Option C selected (port trustStrip + prebuild + fallback) over Options A/B/D. Rationale in analysis.
- 2026-03-14: h2 extractor required for `## Reusable Trust Blocks` (h2 heading not matchable by existing `extractBulletList`). Resolved in TASK-01 plan.
- 2026-03-14: Stale `apps/caryina/data/` copy to be deleted. Default confirmed (low risk; was never preferred by candidate list).
- 2026-03-14: `cachedPayload` must be set to `SAFE_DEFAULTS` in fallback path to avoid repeated I/O on degraded requests. Resolved in TASK-02.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Port trustStrip to materializer | Yes — `materialize-site-content-payload.ts` read; `HBAG/content-packet.md` read; h2 extractor requirement identified in analysis | None — h2 extractor resolved in task plan | No |
| TASK-02: Add runtime fallback in contentPacket.ts | Yes — `contentPacket.ts` read; both throw sites at lines 157/161 confirmed; `TRUST_STRIP_DEFAULTS` pattern confirmed; `cachedPayload` cache noted | Minor: `cachedPayload` must be explicitly set to `SAFE_DEFAULTS` in fallback path — addressed in execution plan | No |
| TASK-03: Add prebuild script | Partial — TASK-01 must complete first (dependency enforced) | None when TASK-01 precondition met | No |
| TASK-04: Remove stale file | Yes — `git ls-files` confirmed both tracked paths; candidate resolution order confirmed | None | No |
| TASK-05: Add unit tests | Partial — TASK-02 must complete first (dependency enforced); `jest.isolateModules()` pattern required for `cachedPayload` isolation | Minor: `cachedPayload` isolation requires `jest.isolateModules()` per-test — addressed in execution plan | No |

## Overall-confidence Calculation
- TASK-01: 85% × M(2) = 170
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × S(1) = 90
- TASK-04: 95% × S(1) = 95
- TASK-05: 85% × M(2) = 170
- Sum: 615 / 7 = **87.9% → rounded to 87%**
- Overall-confidence: 87%
