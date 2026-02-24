---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17 (rev 10)
Feature-Slug: startup-loop-infra-measurement-bootstrap
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-launch-qa
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop — Infrastructure & Measurement Bootstrap: Plan

## Summary

This plan converts the mined brik infrastructure experience into durable startup loop improvements.
Seven deliverables: one decision task to lock the S1B template strategy, three new or replaced
prompt templates covering the full Phase 0-2 bootstrap and Phase 3 verification workflow, and three
skill/spec file updates that embed the new templates into the loop's gate enforcement machinery.

The centrepiece is an expanded S1B prompt template that front-loads a human-owned "access bundle"
session (P0) so agents can execute all subsequent phases unattended. Seven derived policies from brik
are encoded verbatim into the templates to prevent the same failure modes from recurring.

## Goals

- Produce a single-session human setup checklist (Phase 0 access bundle) that unlocks all subsequent
  agent automation for any new startup
- Replace the current thin S1B prompt with a comprehensive infra + measurement bootstrap template
  covering Phase 0 (human), Phase 1 (agent), and Phase 2 staging verification
- Produce a separate audit template for website-live businesses to close configuration gaps
- Produce a Phase 3 post-deploy verification template with explicit immediate/delayed split
- Update `loop-spec.yaml`, `startup-loop/SKILL.md`, and `lp-launch-qa/SKILL.md` to enforce the
  new policies via gate checks

## Non-goals

- Writing or modifying any production code for brik or any other business
- Adding Google Tag Manager support (Policy-03: not justified at startup scale)
- Covering Google Ads account linking (deferred; stub only in templates)
- Changes to any other startup loop stage beyond S1B and S9B gate additions

## Constraints & Assumptions

- Constraints:
  - `loop-spec.yaml` spec_version must bump if the S1B prompt template filename changes
  - New prompt templates must use `{{PLACEHOLDER}}` fill-before-use convention
  - New templates must be listed in `docs/business-os/workflow-prompts/README.user.md`
  - TASK-01 filename depends on TASK-D1 resolution; default is in-place expansion (same filename)
  - TASK-07 adds checks to `lp-launch-qa/SKILL.md` — no code changes; skill file edit only
- Assumptions:
  - Pete resolves TASK-D1 default (in-place expansion) before or during Wave 2; if overridden, TASK-01
    adjusts filename and TASK-04 bumps spec_version
  - The Consent Mode v2 known-good snippet from the fact-find (C-02) is the authoritative copy

## Fact-Find Reference

- Related brief: `docs/plans/startup-loop-infra-measurement-bootstrap/fact-find.md`
- Key findings used:
  - Phase 0 access bundle: 13 human-gated items (P0-01 through P0-13)
  - Phase 1 agent-automatable steps: G-01 through G-09, SC-01 through SC-03, D-01 through D-04,
    GH-01 through GH-04, C-01 through C-07
  - Phase 2 staging verification: V-01 through V-06
  - Phase 3 split: Immediate (PV-01 through PV-08) and Delayed (DV-01 through DV-05)
  - 7 Derived Policies (Policy-01 through Policy-07)
  - IDs glossary: GA4, Cloudflare, GCP, GitHub variable kinds
  - Known-good Consent Mode v2 snippet (verbatim, copy-paste safe)

## Proposed Approach

**Option A (chosen):** Expand the existing `measurement-agent-setup-prompt.md` in-place
(keep filename) and add two new template files alongside it. Update loop-spec.yaml to reference the
same filename (no version bump required if filename is unchanged). Produce separate audit and
verification templates as net-new files.

**Option B (rejected as default):** Create a new `infra-and-measurement-bootstrap-prompt.md`
filename, requiring a loop-spec.yaml filename update and spec_version bump. Only worthwhile if Pete
wants a clean version boundary between old and new S1B content.

**Option C (rejected):** Add a new S1C stage in the loop-spec. Adds complexity (new stage ID,
ordering constraints, gate checks) not justified by scope difference.

Chosen: Option A. TASK-D1 allows Pete to override to Option B if a version boundary is wanted.
All tasks proceed with Option A default until TASK-D1 produces an explicit override.

## Plan Gates

- Foundation Gate: Pass
  - Fact-find has all required fields: Deliverable-Type, Execution-Track, Primary-Execution-Skill,
    Startup-Deliverable-Alias, Delivery-Readiness confidence, channel/hypothesis landscape
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No
  - Mode is plan-only; no explicit auto-build intent

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-D1 | DECISION | S1B template strategy: in-place vs rename | 80% | S | Complete (2026-02-17) | - | TASK-01, TASK-04 |
| TASK-01 | IMPLEMENT | Write comprehensive S1B bootstrap prompt (Phase 0-2) | 85% | L | Complete (2026-02-17) | TASK-D1 | TASK-04, TASK-05, TASK-07 |
| TASK-02 | IMPLEMENT | Write measurement quality audit prompt (website-live) | 80% | M | Complete (2026-02-17) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Write post-deploy verification prompt (Phase 3) | 85% | M | Complete (2026-02-17) | - | TASK-05, TASK-07 |
| TASK-04 | IMPLEMENT | Update loop-spec.yaml + spec_version if filename changed | 82% | S | Complete (2026-02-17) | TASK-D1, TASK-01 | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Update workflow-prompts README.user.md | 80% | S | Complete (2026-02-17) | TASK-01, TASK-02, TASK-03, TASK-04 | - |
| TASK-06 | IMPLEMENT | Update startup-loop SKILL.md Gate A section | 83% | S | Complete (2026-02-17) | TASK-04 | - |
| TASK-07 | IMPLEMENT | Update lp-launch-qa SKILL.md — 7 new measurement checks | 80% | M | Complete (2026-02-17) | TASK-01, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-D1, TASK-02, TASK-03 | - | TASK-D1 is fast (decision); TASK-02 and TASK-03 are fully independent |
| 2 | TASK-01 | TASK-D1 resolved | Filename determined by D1; proceed with Option A default if no override |
| 3 | TASK-04 | TASK-D1, TASK-01 | Loop-spec update; version bump only if filename changed |
| 4 | TASK-05, TASK-06, TASK-07 | TASK-04; TASK-05 also needs TASK-02+03; TASK-07 needs TASK-01+03 | All parallel in Wave 4 |

---

## Tasks

---

### TASK-D1: S1B template strategy — in-place expansion vs rename

- **Type:** DECISION
- **Deliverable:** Recorded decision in this plan's Decision Log; filename consumed by TASK-01
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Decision:** Option A — in-place expansion, same filename. Confirmed by Pete 2026-02-17.
- **Affects:** `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`,
  `[readonly] docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** -
- **Blocks:** TASK-01, TASK-04
- **Confidence:** 80%
  - Implementation: 85% — the change mechanics for both options are well-understood
  - Approach: 80% — both options are valid; default is well-reasoned but not yet confirmed by Pete
  - Impact: 80% — choice affects whether downstream consumers of loop-spec need alignment check
- **Options:**
  - Option A — In-place expansion (default): keep filename `measurement-agent-setup-prompt.md`;
    overwrite content with comprehensive Phase 0-2 content. No loop-spec filename update; no
    spec_version bump required on that basis alone.
    Trade-offs: no clean version boundary; existing `loop-spec.yaml` reference continues to resolve.
  - Option B — New filename: create `infra-and-measurement-bootstrap-prompt.md`; update loop-spec.yaml
    `prompt_template` field for S1B; bump spec_version to `"1.2.0"`; run VC-02 downstream alignment.
    Trade-offs: clean version signal; one extra loop-spec edit + downstream docs check required.
- **Recommendation:** Option A. Avoids cascading spec changes. The content expansion is the value;
  the filename is a process artefact.
- **Decision input needed:**
  - Question: Expand the existing S1B template file in-place (Option A), or create a new filename
    with a loop-spec version bump (Option B)?
  - Why it matters: determines TASK-01 output path and whether TASK-04 must bump spec_version
  - Default + risk: Option A. Risk: no spec version signal for future reviewers of loop-spec.yaml;
    mitigated by noting the expansion date in the template header.
- **Acceptance:**
  - Decision recorded in this plan's Decision Log with explicit option chosen
  - TASK-01 proceeds with chosen filename
  - TASK-04 notes whether spec_version bump is required
- **Validation contract:** VC-D1: decision explicitly recorded in Decision Log with option A or B
  stated within 1 planning iteration over this task; else default to Option A and proceed.
- **Planning validation:** None: decision task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Decision Log entry in this plan

---

### TASK-01: Write comprehensive S1B bootstrap prompt template (Phase 0-2)

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`
  (Option A default; filename may change per TASK-D1 to `infra-and-measurement-bootstrap-prompt.md`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Used by startup loop S1B stage for every new `pre-website` business
- **Reviewer:** Pete (loop architecture owner)
- **Approval-Evidence:** Pete confirms template is complete for next S1B run
- **Measurement-Readiness:** Applied at next new S1B business entry; verified by TASK-D1 option choice
- **Affects:** `docs/business-os/workflow-prompts/_templates/measurement-agent-setup-prompt.md`
- **Depends on:** TASK-D1
- **Blocks:** TASK-04, TASK-05, TASK-07
- **Confidence:** 85%
  - Implementation: 87% — all content is fully documented in fact-find; Phase 0-2 tables are
    complete; Consent Mode v2 snippet is verbatim and copy-safe; IDs glossary is defined
  - Approach: 85% — template pattern (fill-before-use `{{PLACEHOLDER}}`) is established; file
    location is known; structure matches existing template conventions
  - Impact: 85% — directly prevents the brik failure modes: missing tokens, wrong consent snippet,
    staging contamination; applied to every future startup
- **Acceptance:**
  - [ ] File exists at chosen output path (non-empty)
  - [ ] Phase 0 access bundle table contains 12 main items (P0-01 through P0-12) in strict dependency
    order, plus 2 deferred items (P0-11a and P0-11b) that complete after Phase 1 SC-01
  - [ ] Phase 0 ordering is correct: P0-04b (SA grant on prod property) comes after P0-04 (prod
    property creation); P0-05b (SA grant on staging) comes after P0-05 (staging creation);
    P0-11 creates GSC property but does NOT verify yet (agent does DNS in SC-01 first)
  - [ ] Contains a "Deployment model" section explaining that `NEXT_PUBLIC_*` vars are GitHub Actions
    environment-scoped variables (not Cloudflare Pages dashboard vars when GitHub Actions builds)
  - [ ] Contains Phase 1 agent steps: GA4 (G-01 through G-09), Search Console (SC-01, SC-02,
    SC-03a (A), SC-03b (H — UI only, no Coverage API exists), SC-03c (A optional)), DNS (D-01
    through D-04), GitHub (GH-01 through GH-04), Code (C-01 through C-07)
  - [ ] G-08 (cross-domain linking) is classified `(H)` only — NOT `(H→A)`. Template explicitly
    states there is no GA4 Admin API endpoint for this configuration; owner adds domains in Tag
    Settings UI manually or accepts GA4-surfaced suggestions
  - [ ] Every Phase 1 DNS step (SC-01, D-01, D-02) explicitly names `CLOUDFLARE_API_TOKEN_DNS_EDIT`
  - [ ] Phase 1 analytics steps use `CLOUDFLARE_API_TOKEN_ANALYTICS_READ` (never DNS-Edit token)
  - [ ] SC-03b explicitly notes: "GSC Coverage/Pages report totals have no bulk API; manual GSC UI
    export only"
  - [ ] Contains Phase 2 staging verification (V-01 through V-06)
  - [ ] V-02 uses Tag Assistant (`tagassistant.google.com`) or `debug_mode: true` in gtag config for
    DebugView enablement — NOT `?gtag_debug=1` (not a standardised GA4 parameter)
  - [ ] V-02 includes the consent interaction note: events will not appear in DebugView if
    `analytics_storage` is denied; QA session must accept analytics cookies before checking DebugView
  - [ ] Consent Mode v2 snippet is the verbatim known-good block from fact-find C-02 (all 6 signals,
    `security_storage: granted`, `wait_for_update: 500`, `url_passthrough: true`)
  - [ ] Ordering rule documented: consent default synchronous inline `<script>` before
    `<Script strategy="afterInteractive">` gtag load
  - [ ] Contains IDs glossary covering GA4 (3 IDs), Cloudflare (2 IDs), GCP (2 IDs), GitHub (2 kinds)
  - [ ] All 7 Derived Policies (Policy-01 through Policy-07) referenced by number in relevant steps
  - [ ] V-05 pass criteria requires both: staging ID ≠ production ID AND staging ID belongs to a
    different GA4 property — both conditions must pass
  - [ ] Contains `{{PLACEHOLDER}}` fill-before-use variables for: business name, domain, timezone,
    currency, GCP project name, deployment platform
  - [ ] Contains explicit Blockers section listing all Phase 0 items that must be confirmed before
    Phase 1 can run; includes P0-11a/P0-11b as deferred items with explicit dependency note
  - [ ] Step classification: every step marked `(H)`, `(A)`, or `(H→A)` with rationale
  - [ ] No brik-specific IDs (`G-2ZSYXG8R7T`, `474488225`, `hostel-positano.com`) appear anywhere;
    all replaced with `{{PLACEHOLDER}}` form
- **Validation contract (VC):**
  - VC-01: File exists at output path -> pass when `test -f <path>` exits 0 within same task
    execution; else write is incomplete
  - VC-02: Phase 0 bundle completeness -> pass when all 12 main Phase 0 items (P0-01 through P0-12)
    plus deferred items P0-11a and P0-11b are present in the file (grep-checkable by ID) within same
    task execution; else add missing items
  - VC-03: Consent Mode snippet correctness -> pass when file contains `ad_storage`, `ad_user_data`,
    `ad_personalization`, `analytics_storage`, `security_storage: 'granted'`, `wait_for_update`
    all in the same code block within same execution; else fix snippet
  - VC-04: Token split enforcement -> pass when every occurrence of `SC-01`, `D-01`, `D-02` in the
    file is adjacent to `CLOUDFLARE_API_TOKEN_DNS_EDIT` (not the analytics token) within same
    execution; else fix token references
  - VC-05: Staging isolation policy -> pass when V-05 in the file contains both "different ID" and
    "different property" conditions within same execution; else update V-05
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: VC-01 fails until file is written; VC-02 through VC-05 fail until content
    completeness is verified
  - Green evidence plan: write file from fact-find content; run `grep` checks for VC-02 through VC-05
  - Refactor evidence plan: review for placeholder consistency, ordering clarity, and readability;
    verify no brik-specific IDs remain; verify G-08 is `(H)` only; verify SC-03b states no Coverage
    API; verify V-02 uses Tag Assistant / debug_mode — not `?gtag_debug=1`
- **Planning validation (required for L):**
  - Checks run: fact-find content verified complete; all 13 P0 items, all Phase 1 step IDs confirmed
    present in fact-find tables
  - Validation artifacts: `docs/plans/startup-loop-infra-measurement-bootstrap/fact-find.md`
  - Unexpected findings: None
- **Scouts:** None: all content is fully documented in fact-find; no unknown territory
- **Edge Cases & Hardening:**
  - If TASK-D1 chooses Option B (new filename): write to new filename instead; do not delete old
    file (keep as redirect stub with a single note pointing to new file)
  - If `measurement-agent-setup-prompt.md` already has content: read first, then overwrite
    completely (the existing file is the thin template this task replaces)
  - Ensure `{{PLACEHOLDER}}` variables do not accidentally include brik-specific values
    (`G-2ZSYXG8R7T`, `474488225`, `hostel-positano.com`) — all must be genericised
- **What would make this >=90%:**
  - Verification by applying the template to a second business (beyond brik) and confirming Phase 0
    is achievable in <60 min for a non-engineer
- **Rollout / rollback:**
  - Rollout: file replaces existing thin S1B template; startup loop uses it at next S1B run
  - Rollback: restore old file from git history (`git show HEAD~1:path/to/file`)
- **Documentation impact:** Template file itself; referenced by TASK-04 (loop-spec), TASK-05 (README), TASK-06 (SKILL.md)
- **Notes / references:** Fact-find Phase 0 table, Phase 1 tables, Phase 2 table, Derived Policies
  section, IDs Glossary section, C-02 known-good snippet — all are the authoritative sources
- **Build evidence (2026-02-17):**
  - Decision: TASK-D1 resolved Option A (in-place expansion, same filename) — Pete confirmed.
    No loop-spec.yaml filename change; no spec_version bump required on this basis alone.
    TASK-04 will note the expansion date in loop-spec.yaml comment only.
  - Red: file existed (thin S1B template, 72 lines). VC-01 through VC-05 all failed on content —
    old template had no Phase 0 table, no Phase 1 steps, no IDs glossary, no Consent Mode v2 snippet,
    no Derived Policies.
  - Green: overwrote file with comprehensive Phase 0-2 content (~360 lines in template block).
    Phase 0: P0-01 through P0-12 (12 main items) + P0-11a/P0-11b (deferred). All items in strict
    dependency order (P0-04b after P0-04, P0-05b after P0-05, P0-11 creates GSC but defers verify
    to P0-11a after SC-01). Phase 1: G-01 through G-09, SC-01/02/03a/03b/03c, D-01 through D-04,
    GH-01 through GH-04, C-01 through C-07. Phase 2: V-01 through V-06.
  - Refactor: VC-01 PASS (file exists, non-empty). VC-02 PASS (all 14 Phase 0 IDs present, each
    with >=3 occurrences). VC-03 PASS (all 7 consent signals including security_storage: granted,
    wait_for_update, url_passthrough). VC-04 PASS (D-01, D-02 have DNS_EDIT on same line; SC-01
    DNS_EDIT within 3-line context). VC-05 PASS (V-05 contains "different ID" and "different property").
    G-08 classified (H) only with explicit note no GA4 Admin API endpoint exists. SC-03b states
    no bulk API exists. V-02 uses Tag Assistant / debug_mode:true with explicit ?gtag_debug=1
    warning. Brik-specific ID 474488225 replaced with "123456789 (example)" in IDs glossary.
    7 Derived Policies all present and referenced in relevant steps. Deployment model section present.

---

### TASK-02: Write measurement quality audit prompt (website-live businesses)

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/workflow-prompts/_templates/measurement-quality-audit-prompt.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Used by startup loop S1B conditional path for `website-live` businesses
  as a configuration audit — distinct from the provisioning template (TASK-01)
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms template covers brik's actual gap set
- **Measurement-Readiness:** Applied when a website-live business enters S1B; produces a gap manifest
- **Affects:** `docs/business-os/workflow-prompts/_templates/measurement-quality-audit-prompt.md`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 80% — the gap patterns are documented in fact-find (staging isolation,
    filter state, consent mode, cross-domain linking, redirect architecture); audit-first structure
    is defined; but this template has no brik baseline to verify against since brik discovered
    these gaps during execution, not via a formal audit run
  - Approach: 83% — two-template split (provisioning vs audit) is correctly motivated by brik evidence;
    audit-first (gap list before changes) is the right pattern for existing live sites
  - Impact: 80% — prevents brik-class regressions for future website-live businesses entering the loop
- **Acceptance:**
  - [ ] File exists at output path
  - [ ] Template is audit-first: produces a gap manifest (per-policy gap: present/absent) before
    proposing any changes
  - [ ] Covers all 7 Derived Policies in audit format (check current state vs required state)
  - [ ] Explicitly idempotent: running twice produces same gap manifest; no state changes from audit
  - [ ] Output section: gap manifest with each policy, current state, required state, owner, action
  - [ ] Contains `{{PLACEHOLDER}}` variables for business name, domain, GA4 property IDs,
    Cloudflare zone, GSC property
  - [ ] Contains note: "if no gaps found, this template produces a pass confirmation; no changes needed"
- **Validation contract (VC):**
  - VC-01: File exists -> pass when `test -f <path>` exits 0; else write incomplete
  - VC-02: Audit-first structure -> pass when file contains a "gap manifest" or equivalent output
    section that lists policies before any remediation section within same execution; else reorder
  - VC-03: All 7 policies covered -> pass when Policy-01 through Policy-07 are each referenced in
    the audit checklist within same execution; else add missing policies
- **Execution plan:** Red -> Green -> Refactor
  - Red: VC-01 through VC-03 fail until file exists with correct structure
  - Green: write file using fact-find Derived Policies as the audit checklist source
  - Refactor: ensure audit output section is unambiguous; gap manifest column headers are concrete
- **Planning validation:** None: new file, no existing content to validate against
- **Scouts:** None: policy set is complete in fact-find
- **Edge Cases & Hardening:**
  - If a website-live business has no GA4 property at all: template should detect this and route
    to TASK-01 template instead (add explicit "if no GA4 property exists, use infra bootstrap
    template" note)
- **What would make this >=90%:** Run against brik's actual setup and verify all 7 policy gaps
  are correctly detected by the template's checks
- **Rollout / rollback:**
  - Rollout: new file; no existing content replaced
  - Rollback: delete file (net-new, no prior version)
- **Documentation impact:** Template file; referenced by TASK-05 (README)
- **Notes / references:** Fact-find Derived Policies section; brik gap evidence in sources 4 and 7
- **Build evidence (2026-02-17):**
  - Red: file ABSENT at `docs/business-os/workflow-prompts/_templates/measurement-quality-audit-prompt.md` (VC-01 fail confirmed)
  - Green: file written; all 7 policies present (VC-03 pass); gap manifest section precedes action
    list section (VC-02 pass, gap manifest at line 178, action list at line 188); idempotency note
    present; no-GA4-property escape hatch present
  - Refactor: VC-01 through VC-03 all pass via automated grep checks; Policy-02 Allowed-B exception
    path included; SC-03 Coverage API no-bulk-API advisory included; cross-domain linking advisory
    included; Cloudflare 404 cron advisory included

---

### TASK-03: Write post-deploy measurement verification prompt (Phase 3)

- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/workflow-prompts/_templates/post-deploy-measurement-verification-prompt.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Used immediately after first production deploy (S9B gate, or standalone
  operator handoff)
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms immediate/delayed split matches operational reality
- **Measurement-Readiness:** Produces pass/fail output per check at launch time
- **Affects:** `docs/business-os/workflow-prompts/_templates/post-deploy-measurement-verification-prompt.md`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-07
- **Confidence:** 85%
  - Implementation: 85% — Phase 3 content (PV-01 through PV-08, DV-01 through DV-05) is fully
    defined in fact-find with explicit timing and pass criteria
  - Approach: 88% — immediate/delayed split is justified by GA4 and GSC latency realities (confirmed
    by brik investigation); DebugView for T+0, Data API for T+24h+
  - Impact: 83% — prevents false-negative launch failures caused by checking Data API too early
- **Acceptance:**
  - [ ] File exists at output path
  - [ ] Two explicit sections: "Immediate (T+0)" and "Delayed (T+1 / T+7)"
  - [ ] Immediate section contains PV-01 through PV-08 with correct tool per check
    (DebugView/Realtime for events; curl/Playwright for redirect and source checks)
  - [ ] Immediate section contains NO GA4 Data API or Search Console Coverage checks (those are
    Delayed only)
  - [ ] Delayed section contains DV-01 through DV-05 with correct timing labels
  - [ ] DV-03 (cross-domain linking) explicitly marked `(H)` with note it cannot be automated
  - [ ] PV-06 (internal traffic filter) explicitly reads filter state (confirm, not set); notes
    that Phase 1 / G-07 is the setter
  - [ ] Contains baseline cadence: T+0 tag snapshot, T+1 first-day Data API extract, T+7 week-1
    baseline, then S10 weekly readouts
  - [ ] Contains `{{PLACEHOLDER}}` variables for business name, domain, GA4 property ID, Cloudflare
    zone ID
- **Validation contract (VC):**
  - VC-01: File exists -> pass when readable and non-empty within same execution
  - VC-02: Immediate/delayed split explicit -> pass when file contains both "T+0" or "Immediate"
    and "T+1" or "Delayed" section headers within same execution; else add missing section
  - VC-03: No Data API in immediate section -> pass when no reference to `analyticsdata` or
    "Data API" appears before the delayed section boundary within same execution; else move check
  - VC-04: Baseline cadence present -> pass when T+0, T+1, T+7 all appear in file; else add cadence
- **Execution plan:** Red -> Green -> Refactor
  - Red: VC-01 through VC-04 fail until file written with correct split
  - Green: write file from fact-find Phase 3 tables (immediate/delayed already split)
  - Refactor: ensure pass criteria are all concrete (no "confirm it looks right" language); check
    every `(H)` step has a named human owner label
- **Planning validation:** None: new file
- **Scouts:** None: content fully defined in fact-find
- **Edge Cases & Hardening:**
  - Operator may run the template before GA4 DebugView is accessible (no GA4 login). Add note: if
    DebugView is inaccessible, use Chrome DevTools network panel for collect endpoint inspection as
    an equivalent immediate check.
- **What would make this >=90%:** Run against brik's actual launch day and verify the immediate
  checks all resolve within 5 minutes of deploy
- **Rollout / rollback:**
  - Rollout: new file
  - Rollback: delete file (net-new)
- **Documentation impact:** Template file; referenced by TASK-05 (README), TASK-07 (lp-launch-qa)
- **Notes / references:** Fact-find Phase 3 tables; `ga4-handoff-capture-investigation.md` (latency)
- **Build evidence (2026-02-17):**
  - Red: file absent — VC-01 through VC-04 all failed as expected.
  - Green: wrote `docs/business-os/workflow-prompts/_templates/post-deploy-measurement-verification-prompt.md`
    from fact-find Phase 3 tables. Two explicit sections: SECTION 1 (IMMEDIATE CHECKS T+0) and
    SECTION 2 (DELAYED CHECKS T+1/T+7). PV-01 through PV-08 all in Section 1; DV-01 through DV-05
    all in Section 2. PV-06 reads filter state with note that G-07 is the setter. DV-03 marked `(H)`
    with explicit note it cannot be automated. Baseline cadence table included.
  - Refactor: VC-01 PASS (file exists). VC-02 PASS (both Immediate T+0 and Delayed T+1 headers
    present). VC-03 PASS on intent — only references to analyticsdata before Section 2 boundary are
    prohibition rule language ("Do NOT call..."); no actual analyticsdata API call appears in Section 1;
    PV-06 uses analyticsadmin.googleapis.com (Admin API, not Data API). VC-04 PASS (T+0, T+1, T+7
    all present, 9/6/17 occurrences respectively). Every `(H)` step has named human owner label.
    Consent interaction note added to PV-02 (must accept analytics before DebugView shows events).
    DebugView fallback added per edge case (DevTools network panel as alternative if GA4 UI inaccessible).
    {{PLACEHOLDER}} variables for business name, domain, GA4 property ID, Cloudflare zone ID all present.

---

### TASK-04: Update loop-spec.yaml and spec_version (if filename changed)

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Runtime authority for startup loop stage graph; consumed by startup-loop
  SKILL.md, all stage skill operators
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms spec_version bump decision aligns with TASK-D1 outcome
- **Measurement-Readiness:** Next `/startup-loop start` run will reference updated S1B spec
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-D1, TASK-01
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 82%
  - Implementation: 84% — the specific field to update (`prompt_template` in the S1B stage entry)
    is identified; the mechanics of the YAML edit are trivial
  - Approach: 82% — approach depends on TASK-D1 option: Option A = no filename change = no
    spec_version bump needed for this reason alone; Option B = filename update + version bump;
    both paths are documented
  - Impact: 85% — without this update, startup-loop SKILL.md Gate A still references the old
    prompt; new template content is unreachable by the loop operator
- **Acceptance:**
  - [ ] If TASK-D1 chose Option A: `loop-spec.yaml` S1B `prompt_template` field is unchanged;
    comment added noting expansion date; no spec_version bump for this change alone
  - [ ] If TASK-D1 chose Option B: `loop-spec.yaml` S1B `prompt_template` updated to new filename;
    spec_version bumped to `"1.2.0"`; `decision_reference` updated to point to this plan
  - [ ] `loop-spec.yaml` is valid YAML after edit (verify with `python3 -c "import yaml; yaml.safe_load(open(...))"`)
  - [ ] If spec_version bumped: downstream alignment check (VC-02) run and documented
- **Validation contract (VC):**
  - VC-01: YAML valid -> pass when `python3 -c "import yaml; yaml.safe_load(open('loop-spec.yaml'))"` exits 0
    within same execution; else fix syntax error
  - VC-02 (Option B only): downstream alignment -> pass when `startup-loop/SKILL.md` Stage Model
    section references correct spec_version and prompt template filename within 1 task execution
    after this task; else update SKILL.md in TASK-06
- **Execution plan:**
  - Red: loop-spec.yaml contains old S1B entry (or old filename if Option B)
  - Green: edit S1B entry per TASK-D1 decision; validate YAML
  - Refactor: add `# expanded YYYY-MM-DD` comment to S1B entry regardless of option
- **Planning validation:**
  - Checks run: `loop-spec.yaml` read; S1B entry identified at line ~36-39; `prompt_template` field
    currently = `measurement-agent-setup-prompt.md`; spec_version currently `"1.1.0"`
  - Validation artifacts: `docs/business-os/startup-loop/loop-spec.yaml` (read during planning)
  - Unexpected findings: None
- **Scouts:** None: YAML edit is mechanical; no unknowns
- **Edge Cases & Hardening:**
  - If Option B: check all references to `measurement-agent-setup-prompt.md` across the
    repo (`rg "pre-website-measurement-bootstrap-prompt"`) and update each; do not leave stale refs
- **What would make this >=90%:** Perform a full downstream reference check regardless of option
  (not just loop-spec.yaml) and confirm no stale references exist
- **Rollout / rollback:**
  - Rollout: YAML edit; takes effect on next `/startup-loop start` run
  - Rollback: `git revert` the loop-spec edit
- **Documentation impact:** loop-spec.yaml; potentially SKILL.md if spec_version bumped (TASK-06 covers that)
- **Build evidence (2026-02-17):**
  - Red: S1B entry in loop-spec.yaml had no expansion date comment (as expected). TASK-D1 resolved
    Option A: no filename change, no spec_version bump. Current spec_version is 1.3.0 (higher than
    1.1.0 expected at plan time — other plans bumped it since; not relevant to this task).
  - Green: added 6-line comment block after `prompt_template:` in S1B entry noting expansion date,
    Phase 0-2 scope, Option A decision, and reference to infra-measurement-bootstrap plan.
    Also noted that website-live businesses use measurement-quality-audit-prompt.md via S2A.
    No spec_version bump performed (Option A confirmed).
  - Refactor: VC-01 PASS — `python3 -c "import yaml; yaml.safe_load(open(...))"` exits 0.
    VC-02 not applicable (Option B only).

---

### TASK-05: Update workflow-prompts README.user.md

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/workflow-prompts/README.user.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Prompt index used by startup loop operators to discover available templates
- **Reviewer:** None: mechanical registry update
- **Approval-Evidence:** None: self-evident from file content
- **Measurement-Readiness:** Discoverability improvement; no metric
- **Affects:** `docs/business-os/workflow-prompts/README.user.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 92% — trivial doc update; read existing file, add rows for new templates
  - Approach: 85% — README format is established; just needs new entries
  - Impact: 80% — without this, new templates are undiscoverable by operators looking at the prompt index
- **Acceptance:**
  - [ ] README contains entries for all templates produced by TASK-01, TASK-02, TASK-03
  - [ ] Each entry includes: filename, stage association, launch-surface condition (pre-website /
    website-live / post-deploy), brief description
- **Validation contract (VC):**
  - VC-01: All three template filenames present in README -> pass when all three appear in file
    within same execution; else add missing entries
- **Execution plan:**
  - Red: new template filenames absent from README
  - Green: read README format; add rows for TASK-01, TASK-02, TASK-03 templates
  - Refactor: confirm consistent column format across all entries
- **Planning validation:** Requires reading README.user.md first to confirm format; treat as read-first
- **Scouts:** None: mechanical
- **Edge Cases & Hardening:** None: additive change only
- **What would make this >=90%:** Confirm README is actually read by startup-loop operator flow
  (check if SKILL.md references it; it does — startup-loop SKILL.md references workflow-prompts)
- **Rollout / rollback:**
  - Rollout: additive edit
  - Rollback: remove added lines (no destructive change)
- **Documentation impact:** README.user.md only
- **Build evidence (2026-02-17):**
  - Red: `measurement-quality-audit-prompt.md` and `post-deploy-measurement-verification-prompt.md`
    absent from README; S1B row used old 3-column format; spec_version reference was stale (1.0.0).
  - Green: updated frontmatter (Updated/Last-reviewed to 2026-02-17); updated spec_version ref to
    1.3.0; expanded stage table to 4 columns (Stage, Prompt template, Launch-surface, Notes); updated
    S1B row notes to describe Phase 0-2 scope; added measurement-quality-audit row for S1B/S2A
    website-live path; added post-deploy-measurement-verification row for S9B with two-phase note;
    reformatted all existing rows to consistent 4-column format.
  - Refactor: VC-01 PASS — all three template filenames present. Format check — all rows have 4
    columns (consistent across stage prompts, operator prompts). Standing refresh + adjacent prompts
    tables not reformatted (3-column; different schema; intentional).

---

### TASK-06: Update startup-loop SKILL.md — Gate A section

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/startup-loop/SKILL.md` Gate A section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** Startup loop operator gate enforcement; every `/startup-loop start` run
  for pre-website businesses hits Gate A
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms Gate A text matches the updated S1B prompt expectation
- **Measurement-Readiness:** Gate enforcement at S1B; no separate metric
- **Affects:** `.claude/skills/startup-loop/SKILL.md`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 83%
  - Implementation: 85% — Gate A section is clearly identified in SKILL.md; it references
    `measurement-agent-setup-prompt.md` by name; the edit is targeted
  - Approach: 83% — update Gate A to describe what the expanded template covers; add reference
    to cross-domain linking (DV-03) as a named human-gated delayed deliverable at S9B
  - Impact: 85% — without this, the SKILL.md description of Gate A still describes the old thin
    template, creating a mismatch between what the prompt contains and what the gate enforces
- **Acceptance:**
  - [ ] Gate A in SKILL.md references correct S1B prompt template filename (per TASK-D1 outcome)
  - [ ] Gate A description accurately summarises Phase 0 (access bundle), Phase 1 (agent config),
    Phase 2 (staging verification) — not just "GA4 + GSC setup"
  - [ ] A note is added that DV-03 (cross-domain linking acceptance) is a named delayed human action
    tracked in S9B, not in S1B
  - [ ] If TASK-D1 chose Option B (new filename): spec_version reference in Stage Model section is
    updated to `"1.2.0"`
- **Validation contract (VC):**
  - VC-01: Correct prompt filename in Gate A -> pass when SKILL.md Gate A section contains the
    filename chosen by TASK-D1 within same execution; else update reference
  - VC-02: Phase 0/1/2 summary present -> pass when Gate A contains references to all three phases
    (access bundle, agent config, staging verification) within same execution; else add missing phase
- **Execution plan:**
  - Red: Gate A section describes old thin template scope
  - Green: read SKILL.md Gate A; update description and filename reference
  - Refactor: ensure Gate A remains concise (the SKILL.md is a runtime operator doc — keep additions
    short; details live in the prompt template, not the SKILL)
- **Planning validation:**
  - Checks run: SKILL.md read during planning; Gate A section is at line ~136-148; prompt_file
    path is the template filename
  - Validation artifacts: `.claude/skills/startup-loop/SKILL.md`
  - Unexpected findings: SKILL.md Gate A currently reads the template via `prompt_file` field;
    the stage model section at line ~64 also shows S1B — both will need updating if filename changes
- **Scouts:** None: targeted YAML + Markdown edit
- **Edge Cases & Hardening:**
  - SKILL.md references the S1B `prompt_template` field by name in two places: the Stage Model
    list (~line 70) and Gate A (~line 143). Update both if filename changed.
- **What would make this >=90%:** Run `/startup-loop status --business <new_biz>` against the
  updated SKILL and verify Gate A is triggered correctly
- **Rollout / rollback:**
  - Rollout: skill file edit; takes effect on next agent run
  - Rollback: `git revert` the SKILL.md edit
- **Documentation impact:** SKILL.md only
- **Build evidence (2026-02-17):**
  - Red: Gate A had only rule + prompt_file path; no Phase 0/1/2 scope description; no DV-03 note.
  - Green: replaced Gate A with expanded version: Phase 0 (access bundle), Phase 1 (agent config),
    Phase 2 (staging verification) all described concisely; DV-03 named as S9B delayed human action;
    website-live businesses redirected to measurement-quality-audit-prompt.md; post-deploy verification
    template reference added for S9B. Filename unchanged (Option A — measurement-agent-setup-prompt.md).
    No spec_version reference update needed (Option A).
  - Refactor: VC-01 PASS (correct filename present, 1 occurrence). VC-02 PASS (Phase 0: 3 occurrences,
    Phase 1: 3 occurrences, Phase 2: 1 occurrence). DV-03 note PASS.

---

### TASK-07: Update lp-launch-qa SKILL.md — 7 new measurement verification checks

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-launch-qa/SKILL.md` with 7 new measurement checks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-17)
- **Artifact-Destination:** S9B QA gate; every pre-launch `lp-launch-qa` run; also applied
  retroactively when brik runs its next lp-launch-qa pass
- **Reviewer:** Pete
- **Approval-Evidence:** Pete confirms no lp-launch-qa check creates a false-negative at launch time
- **Measurement-Readiness:** Pass/fail output per check at each QA run
- **Affects:** `.claude/skills/lp-launch-qa/SKILL.md`
- **Depends on:** TASK-01 (for exact token names and V-05 pass criteria), TASK-03 (for
  immediate/delayed classification boundaries)
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% — the 7 checks are explicitly enumerated in fact-find; the correct
    classification (automated vs manual) is defined for each
  - Approach: 80% — lp-launch-qa SKILL.md structure is known; the checks are additive; the
    immediate/delayed split must be reflected in how lp-launch-qa reports results (no fail on
    delayed checks at T+0)
  - Impact: 88% — these are the exact checks that would have caught the brik internal traffic
    filter, staging contamination, and consent mode problems before production
- **Acceptance:**
  - [ ] `.claude/skills/lp-launch-qa/SKILL.md` contains all 7 new checks:
    1. Staging measurement ID ≠ production measurement ID (necessary but not sufficient alone)
    2. Staging measurement ID belongs to different GA4 property than production (V-05 full check)
    3. GA4 internal traffic filter status = `Active` (not `Testing`) — confirm-read only; G-07 is
       the setter; this check must not attempt to set it (read-not-write rule)
    4. Consent banner state verification — two-phase check:
       - Before user accepts: `analytics_storage` signal is `denied` AND no `_ga` cookie is set
       - After user accepts analytics: `analytics_storage` signal is `granted` AND `_ga` cookie
         is set AND DebugView events become visible (QA session must have analytics consent granted
         before checking DebugView — denied state correctly produces empty DebugView)
    5. Cross-domain linking advisory: lists domains that should be configured in GA4 Tag Settings;
       marks as non-blocking `(H)` advisory (no Admin API for this; human action required post-launch)
    6. SC-03 Coverage API guard: lp-launch-qa must NOT call GSC API for index coverage totals —
       Coverage/Pages report has no bulk API; agents that attempt this will fail; use SC-03b manual
       UI export note instead
    7. DNS redirect health: apex, www, and booking path resolve correctly (curl/Playwright)
  - [ ] Each check has an explicit pass/fail criterion
  - [ ] Check 4b DebugView step explicitly states: "accept analytics cookies in test session before
    checking DebugView; empty DebugView with denied consent is correct behaviour, not a GA4 bug"
  - [ ] Check 5 (cross-domain linking) is explicitly `advisory` / non-blocking with `(H)` label
  - [ ] Check 6 (SC-03 guard) is a lp-launch-qa internal constraint — it prevents agents from
    attempting the Coverage API call, not a user-facing check
  - [ ] Checks that are `(H)` (manual) are labelled as requiring human verification; not auto-pass
  - [ ] A note in the skill states: "Do not fail launch on Delayed checks (DV-01 through DV-05);
    log as warnings only"
  - [ ] Immediate vs Delayed boundary is explicit: no check before the boundary may reference
    GA4 Data API, GSC Coverage, or Search Analytics; these are Delayed only
- **Validation contract (VC):**
  - VC-01: All 7 checks present -> pass when all 7 check descriptions are present in SKILL.md
    (searchable by keyword) within same execution; else add missing checks
  - VC-02: V-05 both conditions enforced -> pass when check 2 (different property) is distinct from
    check 1 (different ID) and both are present; else add missing condition
  - VC-03: PV-06 is read-not-write -> pass when check 3 description contains "confirm" or "read"
    and does not contain "set" or "activate" language within same execution; else fix wording
  - VC-04: Delayed check non-blocking -> pass when SKILL.md contains a note that DV-series checks
    are warnings only at launch time within same execution; else add note
  - VC-05: Consent check two-phase -> pass when check 4 contains both "before accept" and "after
    accept" states with explicit cookie (`_ga`) and consent signal criteria; else add missing phase
  - VC-06: SC-03 Coverage API guard present -> pass when SKILL.md contains an explicit statement
    that agents must not call GSC API for coverage totals within same execution; else add guard
- **Execution plan:**
  - Red: SKILL.md missing all 7 checks; V-05 single-condition only; no immediate/delayed split
  - Green: read SKILL.md; identify existing QA sections; add 7 checks in appropriate section
  - Refactor: ensure check language is concrete pass/fail (no vague "validate" language); ensure
    advisory checks are clearly marked non-blocking
- **Planning validation:**
  - Checks run: lp-launch-qa SKILL.md read during planning; existing structure observed; checks are
    additive to the current four domains (conversion, SEO, performance, legal)
  - Validation artifacts: `.claude/skills/lp-launch-qa/SKILL.md`
  - Unexpected findings: lp-launch-qa SKILL.md has a "legal compliance" domain that covers cookie
    consent; the new consent banner check (check 4) should be added there. The other 6 checks form
    a new "Measurement & Analytics" domain.
- **Scouts:** None: check content fully defined in fact-find and TASK-03
- **Edge Cases & Hardening:**
  - If lp-launch-qa is run against a website-live business that never ran S1B (e.g. brik retroactive
    run): checks 1 and 2 may fail because staging property was not set up. Add a note: "if staging
    property was not provisioned in S1B, checks 1-2 produce a gap advisory and route to TASK-02
    (measurement quality audit) rather than a hard fail."
- **What would make this >=90%:** Run updated lp-launch-qa against a live business and verify
  all 7 checks produce correct pass/fail/advisory output with no false negatives
- **Rollout / rollback:**
  - Rollout: skill file edit; takes effect on next lp-launch-qa run
  - Rollback: `git revert` the SKILL.md edit
- **Documentation impact:** lp-launch-qa SKILL.md only
- **Build evidence (2026-02-17):**
  - Red: SKILL.md had 4 domains (conversion/SEO/performance/legal); no measurement domain; no L1b
    two-phase consent check; invocation signature listed 4 domains only; `for --domain all, run all four
    domains` (not five).
  - Green: (1) Invocation signature updated from `conversion|seo|performance|legal|all` to include
    `measurement`. (2) Step 1a validation updated to accept `measurement`. (3) L1b (two-phase consent)
    added to Domain 4 Legal after L1: before-accept (`analytics_storage: denied`, no `_ga` cookie,
    no beacons) and after-accept (`analytics_storage: granted`, `_ga` cookie set, DebugView events
    visible); explicit note that empty DebugView with denied consent is correct behaviour. (4) New
    Domain 6: Measurement & Analytics added after Domain 5 with 6 checks: M1 (staging ID ≠ prod ID),
    M2 (different property — V-05 full check), M3 (internal traffic filter read-only confirm; do NOT
    set), M5 (cross-domain advisory H non-blocking), M6 (SC-03 Coverage API guard — internal
    constraint), M7 (DNS redirect health curl automated). (5) Delayed checks pre-flight note added
    (DV-series = warnings only, deferred to post-deploy). (6) Aggregate 3a updated to include
    Measurement line. (7) 3b severity updated: M1/M2/M7 = Blockers; M3/M5/M6/DV-series = Warnings;
    existing-site gap advisory non-blocking. (8) Report structure template expanded with Domain 6
    section (M1-M7 with status/evidence/notes fields). (9) Purpose section updated to list five
    domains. (10) "run all five domains" in workflow. (11) Executive Summary Results updated.
    (12) Commit template domains updated.
  - Refactor: VC-01 PASS (Domain 6 + all 7 checks present). VC-02 PASS (M1 different ID, M2 different
    property — both present as distinct checks). VC-03 PASS (M3 says "read-only confirm", "Do NOT
    activate", no set/activate language in check body). VC-04 PASS (DV-series delayed non-blocking note
    present in 4 locations). VC-05 PASS (L1b has both "before accept" and "after accept" phases with
    explicit `_ga` cookie and `analytics_storage` signal criteria). VC-06 PASS (M6 explicitly states
    agents must NOT call GSC API for coverage totals). SKILL.md line count grew from ~662 to ~760;
    within expected range for a 6-check new domain + L1b addition.

---

## Risks & Mitigations

- **TASK-D1 left unresolved** — TASK-01 proceeds with Option A default; if Pete later overrides to
  Option B, TASK-01 output must be renamed and TASK-04 must bump spec_version. Mitigated by: noting
  this dependency explicitly and checking the Decision Log before closing TASK-04.
- **Consent Mode v2 snippet diverges from Google spec** — snippet in fact-find may lag Google API
  changes. Mitigated by: TASK-01 executor verifies snippet against current Google Consent Mode v2
  docs before embedding; flags any divergence as a finding.
- **Phase 0 ordering error in template** — if service account grants (P0-04b, P0-05b) are written
  before property creation steps (P0-04, P0-05), operator will attempt to grant access to a
  non-existent property. Mitigated by: TASK-01 VC-02 checks P0-04b comes after P0-04 and P0-05b
  after P0-05; refactor step explicitly checks ordering.
- **Agent calls SC-03 Coverage API and fails** — GSC Coverage/Pages totals have no bulk API.
  Any agent following a template that instructs `searchAnalytics.query` for coverage counts will
  get malformed results or errors. Mitigated by: SC-03 split (SC-03a/SC-03b/SC-03c) with explicit
  `(H)` label on SC-03b; TASK-07 VC-06 adds a guard to lp-launch-qa SKILL.md.
- **DebugView appears empty because analytics consent is denied** — operator thinks GA4 is broken.
  Mitigated by: V-02 and PV-02 explicitly state consent must be granted in test session before
  checking DebugView; added as check 4b in TASK-07 lp-launch-qa checks.
- **lp-launch-qa SKILL.md structure incompatible with additive checks** — existing structure may
  not have a natural insertion point for a "Measurement & Analytics" domain. Mitigated by: TASK-07
  executor reads SKILL.md fully before editing; adds a new domain section if no natural fit exists.
- **Stale filename references if Option B chosen** — multiple files may reference the old template
  filename. Mitigated by: TASK-04 includes explicit `rg` check for all references.

## Acceptance Criteria (overall)

- [ ] All 7 tasks complete (D1 through TASK-07)
- [ ] Three prompt templates exist at their output paths (TASK-01, TASK-02, TASK-03)
- [ ] `loop-spec.yaml` is valid YAML post-edit (TASK-04 VC-01 passes)
- [ ] `workflow-prompts/README.user.md` lists all three new templates (TASK-05 VC-01 passes)
- [ ] `startup-loop/SKILL.md` Gate A accurately describes Phase 0/1/2 scope (TASK-06 VC-02 passes)
- [ ] `lp-launch-qa/SKILL.md` contains all 7 new measurement checks (TASK-07 VC-01 passes)
- [ ] No brik-specific IDs (`G-2ZSYXG8R7T`, `474488225`, `hostel-positano.com`) appear in any
  new template file (all have been replaced with `{{PLACEHOLDER}}` form)

## Decision Log

- 2026-02-17: Fact-find complete. Default approach is Option A (S1B in-place expansion). Awaiting
  Pete's confirmation via TASK-D1 before TASK-04 executes.
- 2026-02-17: TASK-D1 resolved. Pete confirmed **Option A** — in-place expansion, same filename
  (`measurement-agent-setup-prompt.md`). No loop-spec.yaml filename change. TASK-04 will
  add a comment noting expansion date and plan reference; no spec_version bump on this basis.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight |
|---|---:|---|---:|
| TASK-D1 | 80% | S | 1 |
| TASK-01 | 85% | L | 3 |
| TASK-02 | 80% | M | 2 |
| TASK-03 | 85% | M | 2 |
| TASK-04 | 82% | S | 1 |
| TASK-05 | 80% | S | 1 |
| TASK-06 | 83% | S | 1 |
| TASK-07 | 80% | M | 2 |

Weighted sum: (80×1 + 85×3 + 80×2 + 85×2 + 82×1 + 80×1 + 83×1 + 80×2) / (1+3+2+2+1+1+1+2) = 1070 / 13 = **82%**
