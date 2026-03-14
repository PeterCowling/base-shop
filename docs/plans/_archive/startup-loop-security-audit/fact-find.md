---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Infra
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: startup-loop-security-audit
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/startup-loop-security-audit/analysis.md
Trigger-Why: Security audits are required before any site goes live. There is currently no security-audit domain in the S9B launch QA gate, no structured runtime/site-level security checklist in the startup loop, and the CI-level checks that exist (dependency audit, secret scanning) are absent from app-specific deploy workflows.
Trigger-Intended-Outcome: type: operational | statement: Every site progressing through the startup loop to launch is checked against a structured security baseline (OWASP top 10 runtime/headers, dependency CVEs, secrets, auth hardening, cookie security) before it goes live, with a hard gate preventing S9B→SIGNALS advance when critical security failures are present. | source: operator
---

# Startup Loop: Security Audit Integration — Fact-Find Brief

## Scope

### Summary

Add a security audit domain to the S9B launch QA gate (`/lp-launch-qa`) and integrate site-level security checks into the startup loop lifecycle. Security audits covering OWASP top-10 runtime controls, dependency CVEs, secrets exposure, auth hardening, and HTTP security headers must gate every site launch.

### Goals

- Add `domain-security.md` as the 7th domain module in `lp-launch-qa`, with OWASP-focused runtime checks as hard blockers.
- Add GATE-LAUNCH-SEC to the loop-spec S9B stage definition.
- Create `cmd-advance/s9b-gates.md` — a new advance gate module that enforces GATE-LAUNCH-SEC during the S9B→SIGNALS advance. Without this module, the gate is documented but not enforced by `/startup-loop advance`.
- Extend CI to include `pnpm audit` and TruffleHog secret scanning in `.github/workflows/brikette.yml`. `ci.yml` explicitly excludes `apps/brikette/**` in `paths-ignore`, so brikette-only deploys bypass TruffleHog in `ci.yml` — this is a real gap. For `reusable-app.yml` (shared pipeline for caryina and future apps), add `pnpm audit` only; callers of the shared pipeline also trigger `ci.yml` which covers TruffleHog for non-brikette apps.
- Register a self-evolving prescription candidate that periodically signals when security debt accumulates post-launch.

### Non-goals

- Penetration testing or manual red-team exercises (out of scope for an automated gate).
- Rewriting auth infrastructure or implementing new auth systems (security gate checks existing implementation; does not rebuild it).
- Changing the `ci.yml` core security jobs (they already exist and are correct).

### Constraints & Assumptions

- Constraints:
  - S9B must remain `conditional: false` — the security gate applies to all businesses.
  - The `lp-launch-qa` domain module pattern is well-established; the new module must follow the exact same schema as existing domain modules (check IDs, pass/fail/warn, required output schema).
  - CI workflow changes must not break existing jobs or change the Cloudflare deploy flow.
- Assumptions:
  - Site-level checks (headers, CSP) are done via automated HTTP request inspection using available tools (curl, online header checker APIs, or Lighthouse security audits where applicable).
  - The brikette app is the primary first consumer, but the gate is loop-wide (applies to caryina and future businesses too).

---

## Outcome Contract

**Why:** Security audits are a universal pre-launch requirement for any site that collects user data, processes payments, or handles authentication. No structured security domain currently exists in the launch gate.

**Intended Outcome:** type: operational | statement: S9B security domain is live, hard-blocks site launch on critical security failures, and CI runs dependency audit on every deploy pipeline. | source: operator

---

## Current Process Map

### S9B Gate — Current State

**Trigger**: `/startup-loop advance --business <BIZ>` when DO (build) is complete.

**Current flow**:
1. Operator invokes `/lp-launch-qa --business <BIZ>` (or `--domain <X>`).
2. Skill dispatches 6 domain subagents in parallel (when `--domain all`).
3. Each domain returns `{ domain, status: pass|fail|warn, checks: [...] }`.
4. Cross-domain synthesis runs. Go/no-go is emitted.
5. Report written to `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md`.
6. Loop state updated at `docs/business-os/startup-baselines/<BIZ>/loop-state.json`.

**Current domains (6)**:
| Module | Checks | Blocker threshold |
|---|---|---|
| `domain-conversion.md` | C1–C5 | Any fail = NO-GO |
| `domain-seo.md` | S1–S6 | Warn only |
| `domain-performance.md` | P1–P5 | P1–P3 fail = NO-GO |
| `domain-legal.md` | L1–L6 | Any fail = NO-GO |
| `domain-brand-copy.md` | BC-04, BC-05, BC-07 | Warn only |
| `domain-measurement.md` | M1–M7 | M1, M2, M7 fail = NO-GO |

**Missing**: No security domain. No OWASP headers, CSP, HTTPS, auth hardening, cookie security, or dependency CVE checks in the QA gate.

**End condition**: 6/6 domain verdicts collected; go/no-go emitted; report written; loop state updated.

### CI Pipeline — Current State

**`ci.yml` (core platform CI)**:
- `security-audit` job: `pnpm audit --audit-level=high` with retry on transient errors. Ignores GHSA-p6mc-m468-83gw (documented exception).
- `secret-scanning` job: TruffleHog v3 (`--only-verified`), full git history.
- Both jobs run on every push (except staging branch) and every PR.
- **Important**: `ci.yml` has `paths-ignore` that explicitly excludes `apps/brikette/**` and `.github/workflows/brikette.yml`. This means pushes that trigger only `brikette.yml` do NOT trigger `ci.yml`, so TruffleHog in `ci.yml` does NOT cover brikette-specific deploys. **Secret scanning gap exists for brikette.** TASK-05 is updated to include TruffleHog in `brikette.yml`.

**`brikette.yml` (app-specific deploy — standalone, no shared pipeline)**:
- No `security-audit` step.
- Triggered on push to `dev`, `staging`, `main` branches when brikette paths change.
- **Gap**: `pnpm audit` is absent from the brikette deploy pipeline.

**`reusable-app.yml` (shared pipeline)**:
- Used by `caryina.yml` and intended for future apps.
- No `security-audit` step.
- **Gap**: `pnpm audit` is absent from the shared app deploy pipeline — adding it here covers caryina and all future apps using this pipeline.

**Known CI exception**: `GHSA-p6mc-m468-83gw` is permanently ignored (`--ignore GHSA-p6mc-m468-83gw`). This exception is hardcoded; no review cadence is enforced.

### Self-Evolving Loop — Current State

- `authority_level: shadow` — candidates are ranked but not autonomously actioned.
- Candidates feed through `backbone-queue.jsonl` → `queue-state.json` → IDEAS-03 → DO.
- `repo-maturity-signals.latest.json` tracks `security_policy_present: true` — security presence is already a maturity signal.
- No prescription candidate currently exists to re-signal when security debt grows post-launch (e.g., new CVEs, headers drift, certificate expiry).
- **Gap**: self-evolving loop has no mechanism to schedule periodic security re-checks on live sites.

---

## Evidence Audit (Current State)

### Entry Points

| File | Role |
|---|---|
| `.claude/skills/lp-launch-qa/SKILL.md` | S9B skill orchestrator — defines 6 domains, invocation, go/no-go rules |
| `docs/business-os/startup-loop/specifications/loop-spec.yaml` (line 1207) | Canonical S9B stage definition; ordering: `[DO, S9B]`, `[S9B, SIGNALS]` |
| `.github/workflows/ci.yml` (lines 59–130) | `security-audit` and `secret-scanning` CI jobs — repo-level dependency + secrets checks |
| `.github/workflows/brikette.yml` | App-specific deploy workflow — **no security step** |

### Key Modules / Files

| File | Role |
|---|---|
| `.claude/skills/lp-launch-qa/modules/domain-legal.md` | Reference domain module pattern (L1–L6 checks, required output schema) |
| `.claude/skills/lp-launch-qa/modules/domain-performance.md` | Reference domain module pattern (P1–P5, blocker vs warn) |
| `.claude/skills/lp-launch-qa/modules/domain-measurement.md` | Reference domain module pattern (M1–M7) |
| `docs/business-os/startup-loop/specifications/loop-spec.yaml` | Runtime-authoritative stage graph; must add GATE-LAUNCH-SEC annotation |
| `.claude/skills/startup-loop/modules/cmd-advance/sell-gates.md` | Reference gate module pattern (GATE-SELL-STRAT-01, GATE-SELL-ACT-01) — new `s9b-gates.md` must follow this pattern |
| `.claude/skills/startup-loop/SKILL.md` (line 55) | `cmd-advance` module routing table — new `s9b-gates.md` must be registered here |
| `scripts/src/startup-loop/s6b-gates.ts` | Reference deterministic gate implementation pattern |
| `docs/business-os/startup-loop/self-evolving/BRIK/policy-state.json` | Self-evolving policy state (shadow authority; candidate belief schema) |
| `.github/workflows/reusable-app.yml` | Shared pipeline for caryina and future apps — correct layer for loop-wide CI pnpm audit |

### Data & Contracts

- `lp-launch-qa` domain module output schema: `{ domain: "<name>", status: "pass|fail|warn", checks: [{ id, status, evidence }] }`
- Loop-spec gate annotation convention: `GATE-<FAMILY>-<NN>` with Hard/Soft type, trigger, rule, and shell check
- Self-evolving prescription schema: evidenced by `backbone-queue.jsonl` and `policy-state.json` candidate belief schema
- CI job pattern: `--audit-level=high`, retry on transient 500s, explicit `--ignore <GHSA>` for known exceptions

### Dependency & Impact Map

**Upstream inputs to new security domain**:
- Deployed site URL (already available from site baseline `latest.user.md`)
- HTTP response headers (fetchable by curl/tool in QA subagent)
- `pnpm audit` output (already available in CI; needs mirroring to app-specific workflows)

**Downstream dependents**:
- `lp-launch-qa` SKILL.md: domain count increases from 6 → 7; dispatch-all path must include new domain
- `loop-spec.yaml` S9B `secondary_skills`: no change needed (security domain runs within lp-launch-qa)
- `modules/cmd-advance.md` (the actual loader, **not** SKILL.md): requires two additions — (1) a new entry in Module Loading Order for S9B→SIGNALS transitions, (2) a new "QA / Security Family" entry in Gate and Dispatch Map listing GATE-LAUNCH-SEC. SKILL.md is a secondary reference. Without updating `cmd-advance.md`, GATE-LAUNCH-SEC is documented but not enforced by `/startup-loop advance`. **This is the critical missing enforcement path.**
- `loop-state.json` S9B checkpoint: already written as `complete`/`blocked`; no schema change needed

---

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| `UI / visual` | N/A | Domain modules are markdown files (no UI) | None | No |
| `UX / states` | N/A | Operator-facing via `/lp-launch-qa` CLI; no UI state machine | None | No |
| `Security / privacy` | Required | `ci.yml` has pnpm audit + TruffleHog; no runtime security checks in S9B | **Primary gap**: OWASP headers, CSP, HTTPS, cookie flags, auth hardening missing from launch gate | Yes — core deliverable |
| `Logging / observability / audit` | Required | QA report artifact written to `docs/business-os/site-upgrades/<BIZ>/`; loop state updated | New security domain must produce a machine-readable check array (same as existing domains) for report inclusion | Yes |
| `Testing / validation` | Required | No automated tests for lp-launch-qa skill modules; domain-legal and domain-performance have no dedicated unit tests | New domain module will follow same (untested) pattern; integration tested via a live QA run | Yes |
| `Data / contracts` | Required | Domain output schema is consistent across all 6 modules; loop-spec gate annotations follow a uniform pattern | New module and gate must conform to existing schema; loop-spec version bump required | Yes |
| `Performance / reliability` | N/A | Domain modules are static markdown check definitions; no runtime hot paths | None | No |
| `Rollout / rollback` | Required | Loop-spec version bump is additive; existing loop runs unaffected | GATE-LAUNCH-SEC must not retroactively block businesses that have already passed S9B; gate applies only on new/re-run QA | Yes |

---

## Current Process Map — Self-Evolving Integration

**Gap in self-evolving loop**: No periodic re-check prescription for security debt on live sites.

**Proposed integration point**: Register a signal-based prescription candidate that fires when:
- A new `pnpm audit` high/critical CVE appears in CI on the `main` branch of an app that has previously passed S9B; OR
- A business passes S9B > 90 days ago without a subsequent security re-check in the QA report log.

This would produce an `IDEA-DISPATCH` routed to `lp-do-fact-find` (IDEAS-03 path) with an area anchor pointing to the affected dependency or site URL. The self-evolving loop already supports this dispatch pattern; it would need a new prescription definition in the prescription registry.

---

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| lp-launch-qa domain module structure | Yes | None | No |
| Loop-spec S9B stage definition | Yes | Gate annotation section is well-established; adding GATE-LAUNCH-SEC is straightforward | No |
| CI pipeline gaps | Yes | brikette.yml has no pnpm audit — confirmed by reading the workflow file | No |
| Self-evolving prescription model | Partial | Policy state is shadow mode; prescription registry not fully investigated — no blocking risk | No |
| Gate advance contract (cmd-advance modules) | Yes | **Critical finding fixed**: cmd-advance has no S9B gate family. GATE-LAUNCH-SEC must be backed by a new `cmd-advance/s9b-gates.md` module AND registered in the startup-loop SKILL.md module routing table. TASK-04 added to address this. | No |
| Existing S9B blocker/warning severity definitions | Yes | Blocker: Conversion + Legal; blocker: P1–P3, M1/M2/M7. Security would add new blocker family | No |

---

## Scope Signal

**Signal: right-sized**

**Rationale**: The work involves 2 new skill modules (`domain-security.md`, `cmd-advance/s9b-gates.md`), 4 file modifications (`lp-launch-qa/SKILL.md`, `loop-spec.yaml`, `modules/cmd-advance.md`, `startup-loop/SKILL.md`), and 2 CI workflow additions (`brikette.yml`, `reusable-app.yml`). Each piece follows a proven pattern (domain module → 6 existing references; cmd-advance gate module → 5 existing references; CI pnpm audit → 1 existing reference in `ci.yml`). No new infrastructure. Blast radius is medium-low: all files are skill/config; no production code changes; rollout is unconditional additive (no flag).

---

## Confidence Inputs

| Dimension | Score | Evidence | What raises to ≥80 | What raises to ≥90 |
|---|---|---|---|---|
| Implementation | 85 | Domain module pattern is copy-paste-extend; loop-spec gate format is documented and validated by existing gates | None additional — pattern is fully evidenced | Ship one domain module and confirm it passes `validate-engineering-coverage.sh` |
| Approach | 80 | Three parallel integration layers (skill module, loop-spec gate, CI extension) are each independently straightforward | Confirm the security check list for domain-security.md (which specific OWASP checks to include) | Operator confirms desired OWASP check scope before build |
| Impact | 90 | Security audits are universally required; CI gap in brikette.yml is a confirmed live risk | None | N/A |
| Delivery-Readiness | 82 | Pattern fully established; only the check list content needs finalising | Confirm OWASP check scope (see Open Questions) | Operator approves check scope |
| Testability | 70 | No unit tests exist for existing domain modules; integration test path is a live QA run | Add a test fixture pattern (mock domain response); or document that validation is via live run | None — domain modules are inherently integration-tested |

---

## Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| OWASP check scope too broad — blocks launch for minor header issues that are warn-only | Medium | Medium | Carefully tier checks into Blocker (critical: missing HTTPS, exposed credentials, no SameSite cookie) vs Warn (advisory: suboptimal CSP score, missing HSTS preload) |
| New hard gate retroactively blocks businesses that already passed S9B | Medium | Low | Gate condition: `conditional: false` at stage level, but gate only fires on new QA runs — existing `loop-state.json` S9B checkpoints are not re-evaluated |
| Self-evolving prescription fires too frequently on transient CVEs | Low | Medium | Prescription filter: only dispatch when a new high/critical CVE persists for >7 days in main-branch CI |
| brikette.yml pnpm audit reveals existing high CVEs that need immediate remediation | Low | Low | Acceptable risk: this is the desired outcome — surfacing rather than hiding existing CVEs |
| Domain-security.md check scope drifts from OWASP spec over time | Low | Low | Include a `OWASP-Reference: <version>` field in the domain module frontmatter; add a periodic review note |

---

## Open Questions

| Question | Status | Blocking? |
|---|---|---|
| Which OWASP top-10 checks are automatable without a full pentest tool? | Resolved | No — see below |
| Should failing security checks be Hard blockers (all) or tiered (critical = blocker, advisory = warn)? | Resolved | No — tiered approach adopted (see Risks) |
| Does the self-evolving prescription registry have a defined schema for new prescriptions? | Open | No — self-evolving is shadow mode; prescription registration is advisory for now |
| Should the CI pnpm audit gap in brikette.yml be treated as a separate micro-build or bundled into this plan? | Resolved | No — bundled; it is a simple step addition |

**Resolved: Automatable OWASP runtime checks (no pentest tool needed)**:
1. **HTTPS enforcement** — check site URL returns HTTPS; HTTP redirects to HTTPS.
2. **HTTP security headers** — verify presence of `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`. Absence = fail.
3. **Content Security Policy** — verify `Content-Security-Policy` header present; `unsafe-inline` / `unsafe-eval` in script-src = warn; absent CSP = fail.
4. **Cookie security flags** — verify session/auth cookies have `HttpOnly`, `Secure`, `SameSite=Lax|Strict`.
5. **Dependency CVEs** — `pnpm audit --audit-level=high` pass condition (already in CI; to be mirrored to QA report).
6. **Repository secrets exposure** — confirm no `.env` files or private keys are committed to the repo root (checked via `git ls-files`). Note: build artifact scanning (checking `out/` for static-export builds or `.open-next/` for Worker builds) is a CI responsibility handled by TruffleHog; domain check validates only repo-level secrets presence.
7. **Auth hardening** — verify login endpoints: no default credentials accepted; rate limiting or CAPTCHA present where auth exists.
8. **CORS policy** — verify API routes do not return `Access-Control-Allow-Origin: *` for credentialed requests.

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed `brikette.yml` has no security step by reading the file directly (lines 1–60).
- Confirmed `ci.yml` has `security-audit` and `secret-scanning` jobs (lines 59–130) — these exist and are correct.
- Confirmed S9B stage definition and ordering constraints in `loop-spec.yaml` (line 1207; ordering at lines 1291–1292).
- Confirmed `lp-launch-qa` has exactly 6 domains; no security domain exists.
- Confirmed domain module output schema by reading `domain-legal.md` and `domain-performance.md`.
- Confirmed gate annotation pattern by reading `sell-gates.md` and `s6b-gates.ts`.
- Confirmed self-evolving is shadow mode from `policy-state.json` — no live autonomous dispatch risk.

### Confidence Adjustments

- Testability score reduced to 70 (from initial estimate of 80): no existing unit tests for domain modules confirm the pattern is integration-tested only. This is an accepted project convention, not a new gap.
- Self-evolving prescription integration scoped to advisory/planning only: shadow mode means no live risk, and a full prescription registration schema investigation is not blocking.

### Remaining Assumptions

- The specific OWASP check IDs for `domain-security.md` (listed in Open Questions resolution above) are reasonable defaults; operator may wish to add or remove items before build.
- CI audit in `brikette.yml` and `reusable-app.yml` is added as `--audit-level=high` (hard fail from day one). If existing high/critical CVEs are present when this ships, they must be remediated as part of the same plan — a warn-on-fail step would contradict the hard-gate outcome contract. Remediation of pre-existing CVEs is not a separate plan; it is a precondition for TASK-05 (CI workflow changes) to pass.

---

## Analysis Readiness

**Go.**

Recommended deliverable: code-change (multi-file — 2 new modules, 4 skill/spec file edits, 2 CI workflow additions).
Primary execution skill: `lp-do-build`.
Six tasks with sequencing constraints:
1. **TASK-01**: Create `.claude/skills/lp-launch-qa/modules/domain-security.md` (8 checks; tiered blocker/warn). Independent.
2. **TASK-02**: Update `.claude/skills/lp-launch-qa/SKILL.md` — add security to domain list and dispatch-all path. Depends on TASK-01 (need check IDs).
3. **TASK-03**: Add `GATE-LAUNCH-SEC` annotation to `loop-spec.yaml` S9B stage and version-bump spec. Independent.
4. **TASK-04**: Create `.claude/skills/startup-loop/modules/cmd-advance/s9b-gates.md` — new advance gate module defining GATE-LAUNCH-SEC enforcement at S9B→SIGNALS. Update `modules/cmd-advance.md` (the actual advance loader file, Module Loading Order + Gate and Dispatch Map sections) to load this module when the current transition touches S9B→SIGNALS advance. This is the enforcement path; SKILL.md is a secondary reference only. Depends on TASK-03 (gate ID from loop-spec).
5. **TASK-05**: Add `pnpm audit --audit-level=high` step AND TruffleHog secret-scanning step to `.github/workflows/brikette.yml`. Add `pnpm audit --audit-level=high` step to `.github/workflows/reusable-app.yml`. Note: TruffleHog is not needed in `reusable-app.yml` because all callers (caryina etc.) also run through a branch that triggers `ci.yml`; the gap is specific to brikette's standalone pipeline which `ci.yml` explicitly excludes. Independent.
6. **TASK-06** (advisory): Draft self-evolving prescription candidate for periodic security re-check post-launch.
