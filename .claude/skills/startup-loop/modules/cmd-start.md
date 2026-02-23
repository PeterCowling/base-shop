# cmd-start — `/startup-loop start`

## Inputs

- `--business <BIZ>` required
- `--mode <dry|live>` required
- `--launch-surface <pre-website|website-live>` required
- `--start-point <problem|product>` optional, default: `product`

## Steps

1. Resolve business context from canonical artifacts under `docs/business-os/`.
2. Determine highest completed stage and next required stage.
3. Apply hard gates below (Gate D, Gate A, Gate B, Gate C) in order.
4. Return run packet with exact next action.

---

## Gate D: Problem-first pre-intake (ASSESSMENT-01–ASSESSMENT-08)

**Condition**: `--start-point = problem`

**Rule**: Route through ASSESSMENT-01 → ASSESSMENT-02 → ASSESSMENT-03 → ASSESSMENT-04 → ASSESSMENT-06 → ASSESSMENT-07 → ASSESSMENT-08 in sequence before ASSESSMENT-09 Intake contract. Skip Gate D entirely when `--start-point product` or flag absent (pass-through directly to ASSESSMENT-09).

**Backward compatibility**: Absent `--start-point` flag is treated as `product` — no behavior change for existing operators.

**ASSESSMENT-01 — Problem framing:**
- `prompt_file`: `.claude/skills/lp-do-assessment-01-problem-statement/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
- **Re-entry**: If `problem-statement.user.md` exists for this business → ASSESSMENT-01 complete; skip to ASSESSMENT-02.

**ASSESSMENT-02 — Solution-profiling scan (two-tier):**
- Tier 1 — prompt written (started): `docs/business-os/strategy/<BIZ>/solution-profiling-prompt.md`
- Tier 2 — results returned (complete): `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md`
- `prompt_file`: `.claude/skills/lp-do-assessment-02-solution-profiling/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md`
- **Re-entry**: If any `*-solution-profile-results.user.md` exists → ASSESSMENT-02 complete; skip to ASSESSMENT-03. If only `solution-profiling-prompt.md` exists → ASSESSMENT-02 started; hand off prompt to operator.

**ASSESSMENT-03 — Solution selection:**
- `prompt_file`: `.claude/skills/lp-do-assessment-03-solution-selection/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/solution-select.user.md`
- **Re-entry**: If `solution-select.user.md` exists → ASSESSMENT-03 complete; skip to ASSESSMENT-04.

**ASSESSMENT-04 — Candidate names (two-tier):**
- Tier 1 — prompt written (started): `docs/business-os/strategy/<BIZ>/candidate-names-prompt.md`
- Tier 2 — shortlist returned (complete): `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-candidate-names.user.md`
- `prompt_file`: `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-candidate-names.user.md`
- **Re-entry**: If any `*-candidate-names.user.md` exists → ASSESSMENT-04 complete. If only `candidate-names-prompt.md` exists → ASSESSMENT-04 started; hand off prompt to operator.

**ASSESSMENT-06 — Distribution profiling:**
- `prompt_file`: `.claude/skills/lp-do-assessment-06-distribution-profiling/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/distribution-profiling.user.md`
- **Re-entry**: If `distribution-profiling.user.md` exists with ≥2 channels → ASSESSMENT-06 complete; skip to ASSESSMENT-07.

**ASSESSMENT-07 — Measurement profiling:**
- `prompt_file`: `.claude/skills/lp-do-assessment-07-measurement-profiling/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/measurement-profiling.user.md`
- **Re-entry**: If `measurement-profiling.user.md` exists with tracking method + ≥2 metrics → ASSESSMENT-07 complete; skip to ASSESSMENT-08.

**ASSESSMENT-08 — Current situation:**
- `prompt_file`: `.claude/skills/lp-do-assessment-08-current-situation/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/current-situation.user.md`
- **Re-entry**: If `current-situation.user.md` exists → ASSESSMENT-08 complete; continue to ASSESSMENT-09 Intake contract.

**ASSESSMENT-09 — Intake contract (validate + produce intake packet):**
When all seven completion artifacts exist:
1. `problem-statement.user.md`
2. Any `*-solution-profile-results.user.md`
3. `solution-select.user.md`
4. Any `*-candidate-names.user.md`
5. `distribution-profiling.user.md`
6. `measurement-profiling.user.md`
7. `current-situation.user.md`

→ Gate D is satisfied. Run ASSESSMENT intake sync (the intake packet production step) — apply `modules/assessment-intake-sync.md` (first-run or drift check) before continuing to Gate E (ASSESSMENT brand routing).

**ASSESSMENT-09 output (canonical):**
- `required_output_path`: `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md`
- Advance rule: ASSESSMENT-09 completes only when precursor validation passes and the intake sync runs successfully (or is no-op up-to-date), then routing may continue to ASSESSMENT-10.

---

## Gate E: ASSESSMENT brand routing (ASSESSMENT-10 → ASSESSMENT-11)

**Condition**: After ASSESSMENT-09 Intake contract completes (all start-points).

**Rule**: Check for ASSESSMENT brand artifact completion in sequence:

**ASSESSMENT-10 — Brand profiling:**
- `prompt_file`: `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/brand-profiling.user.md`
- **Re-entry**: If `brand-profiling.user.md` exists → ASSESSMENT-10 complete; skip to ASSESSMENT-11.

**ASSESSMENT-11 — Brand identity:**
- `prompt_file`: `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/brand-identity.user.md`
- **Re-entry**: If `brand-identity.user.md` exists → ASSESSMENT-11 complete; proceed to `MEASURE-01`.

**ASSESSMENT pass-through (both artifacts complete):**
When both completion artifacts exist:
1. `brand-profiling.user.md`
2. `brand-identity.user.md`

→ Gate E is satisfied. Continue to Gate A (`MEASURE-01`), then Gate B (`MEASURE-02`).

---

## Gate A: Agent setup stage (MEASURE-01)

**Condition**: unconditional

**Rule**: Do not progress beyond ASSESSMENT without MEASURE-01 artifact.

**Scope** (details live in prompt template):
- **Phase 0 — Access bundle (Human, ~30-60 min):** One-session credential creation (GCP project,
  service account, GA4 production + staging properties, Cloudflare API tokens split by capability,
  Cloudflare Pages project, GitHub Environments + env vars, GSC property). Front-loads all access
  so agents run Phase 1 unattended. Steps are strictly ordered (service account grants after
  property creation; GSC verification deferred until after Phase 1 SC-01 DNS step).
- **Phase 1 — Agent config (Agent, after Phase 0):** GA4 data streams, key events, custom
  dimensions, internal traffic filter (must be Active — Policy-05), Search Console sitemap
  submission, DNS records (Cloudflare DNS-Edit token only), GitHub environment variable
  confirmation, code integration (gtag.js + Consent Mode v2 snippet C-02).
- **Phase 2 — Staging verification (Agent + Human, before production):** Tag presence, DebugView
  events (requires analytics consent granted in test session), CTA event firing, redirect health,
  staging GA4 property isolation (different ID AND different property — Policy-02), lp-launch-qa pre-flight.
- **DV-03 (delayed, human, S9B):** GA4 cross-domain linking is a human-only UI action with no
  GA4 Admin API equivalent. It is NOT a Phase 0-2 blocker. Track it as a named S9B delayed
  deliverable: within first week of production deploy.
- **All launch surfaces:** MEASURE-02 is the follow-on Results baseline stage after MEASURE-01.

**Prompt handoff**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-agent-setup.user.md`

**Post-deploy verification (S9B, all launch surfaces)**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/post-deploy-measurement-verification-prompt.md`
- Run immediately after first production deploy. Two sections: Immediate (T+0) and Delayed (T+1/T+7).

---

## Gate B: Results baseline (MEASURE-02)

**Condition**: unconditional

**Rule**: MARKET deep research + WEBSITE blocked until MEASURE-02 results artifact exists with `Status: Active`.

**If baseline blocked by missing data**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/historical-data-request-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-data-request-prompt.user.md`

**If data pack exists but baseline not consolidated**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/existing-business-historical-baseline-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance.user.md`

---

## Gate C: MARKET deep research + WEBSITE completion

**Rule**:
- For `launch-surface=pre-website` (WEBSITE-01): if `site-v1-builder-prompt.user.md` is missing, stale, or `Status: Draft`, stop and hand WEBSITE-01 prompt.
- For `launch-surface=pre-website` (WEBSITE-01): once `site-v1-builder-prompt.user.md` is `Status: Active`, auto-handover to DO using mandatory sequence `lp-do-fact-find -> lp-do-plan -> lp-do-build`.
- For `launch-surface=website-live` (WEBSITE-02): if `latest.user.md` is missing, stale, or points to `Status: Draft`, stop and hand WEBSITE-02 prompt.

**S2 handoff**:
- `prompt_file`: `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- `required_output_path`: `docs/business-os/market-research/<BIZ>/<YYYY-MM-DD>-market-intelligence.user.md`

**WEBSITE-01 handoff** (`launch-surface=pre-website`):
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`

**WEBSITE-02 handoff** (`launch-surface=website-live`):
- `prompt_file`: `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`
- `required_output_path`: `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md`

**WEBSITE-01 -> DO auto-handover** (`launch-surface=pre-website`, WEBSITE-01 is `Status: Active`):
- `next_action_1`: `Run /lp-do-fact-find --website-first-build-backlog --biz <BIZ> --feature-slug <biz>-website-v1-first-build --source docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`
- `required_output_path_1`: `docs/plans/<biz>-website-v1-first-build/fact-find.md` (`Status: Ready-for-planning`)
- `next_action_2`: `Run /lp-do-plan docs/plans/<biz>-website-v1-first-build/fact-find.md`
- `required_output_path_2`: `docs/plans/<biz>-website-v1-first-build/plan.md` (`Status: Active`)
- `next_action_3`: `Run /lp-do-build <biz>-website-v1-first-build` (only after `plan.md` is `Status: Active`)
