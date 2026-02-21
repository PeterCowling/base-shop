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

## Gate D: Problem-first pre-intake (DISCOVERY-01–DISCOVERY-07)

**Condition**: `--start-point = problem`

**Rule**: Route through DISCOVERY-01 → DISCOVERY-02 → DISCOVERY-03 → DISCOVERY-04 → DISCOVERY-05 → DISCOVERY-06 → DISCOVERY-07 in sequence before DISCOVERY intake. Skip Gate D entirely when `--start-point product` or flag absent (pass-through directly to DISCOVERY).

**Backward compatibility**: Absent `--start-point` flag is treated as `product` — no behavior change for existing operators.

**DISCOVERY-01 — Problem framing:**
- `prompt_file`: `.claude/skills/lp-do-discovery-01-problem-framing/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
- **Re-entry**: If `problem-statement.user.md` exists for this business → DISCOVERY-01 complete; skip to DISCOVERY-02.

**DISCOVERY-02 — Solution-space scan (two-tier):**
- Tier 1 — prompt written (started): `docs/business-os/strategy/<BIZ>/solution-space-prompt.md`
- Tier 2 — results returned (complete): `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-space-results.user.md`
- `prompt_file`: `.claude/skills/lp-do-discovery-02-solution-space-scan/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-space-results.user.md`
- **Re-entry**: If any `*-solution-space-results.user.md` exists → DISCOVERY-02 complete; skip to DISCOVERY-03. If only `solution-space-prompt.md` exists → DISCOVERY-02 started; hand off prompt to operator.

**DISCOVERY-03 — Option selection:**
- `prompt_file`: `.claude/skills/lp-do-discovery-03-option-picking/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md`
- **Re-entry**: If `s0c-option-select.user.md` exists → DISCOVERY-03 complete; skip to DISCOVERY-04.

**DISCOVERY-04 — Naming handoff (two-tier):**
- Tier 1 — prompt written (started): `docs/business-os/strategy/<BIZ>/naming-research-prompt.md`
- Tier 2 — shortlist returned (complete): `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-shortlist.user.md`
- `prompt_file`: `.claude/skills/lp-do-discovery-04-business-name-options/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-shortlist.user.md`
- **Re-entry**: If any `*-naming-shortlist.user.md` exists → DISCOVERY-04 complete. If only `naming-research-prompt.md` exists → DISCOVERY-04 started; hand off prompt to operator.

**DISCOVERY-05 — Distribution planning:**
- `prompt_file`: `.claude/skills/lp-do-discovery-05-distribution-planning/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/distribution-plan.user.md`
- **Re-entry**: If `distribution-plan.user.md` exists with ≥2 channels → DISCOVERY-05 complete; skip to DISCOVERY-06.

**DISCOVERY-06 — Measurement plan:**
- `prompt_file`: `.claude/skills/lp-do-discovery-06-measurement-plan/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/measurement-plan.user.md`
- **Re-entry**: If `measurement-plan.user.md` exists with tracking method + ≥2 metrics → DISCOVERY-06 complete; skip to DISCOVERY-07.

**DISCOVERY-07 — Operator evidence capture:**
- `prompt_file`: `.claude/skills/lp-do-discovery-07-our-stance/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md`
- **Re-entry**: If `s0e-operator-evidence.user.md` exists → DISCOVERY-07 complete; continue to DISCOVERY pass-through.

**DISCOVERY pass-through (all sub-stages complete):**
When all seven completion artifacts exist:
1. `problem-statement.user.md`
2. Any `*-solution-space-results.user.md`
3. `s0c-option-select.user.md`
4. Any `*-naming-shortlist.user.md`
5. `distribution-plan.user.md`
6. `measurement-plan.user.md`
7. `s0e-operator-evidence.user.md`

→ Gate D is satisfied. Run DISCOVERY intake sync — apply `modules/discovery-intake-sync.md` (first-run or drift check) before continuing to Gate E (BRAND routing).

---

## Gate E: BRAND stage routing (BRAND-01 → BRAND-02)

**Condition**: After DISCOVERY pass-through completes (all start-points).

**Rule**: Check for BRAND artifact completion in sequence:

**BRAND-01 — Brand strategy:**
- `prompt_file`: `.claude/skills/lp-do-brand-01-brand-strategy/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`
- **Re-entry**: If `brand-strategy.user.md` exists → BRAND-01 complete; skip to BRAND-02.

**BRAND-02 — Brand identity:**
- `prompt_file`: `.claude/skills/lp-do-brand-02-brand-identity/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/brand-dossier.user.md`
- **Re-entry**: If `brand-dossier.user.md` exists → BRAND-02 complete; proceed to S1.

**BRAND pass-through (both artifacts complete):**
When both completion artifacts exist:
1. `brand-strategy.user.md`
2. `brand-dossier.user.md`

→ Gate E is satisfied. Continue to Gate A (S1 intake).

---

## Gate A: Pre-website Measure stage (S1B)

**Condition**: `launch-surface = pre-website`

**Rule**: Do not progress beyond S1 without S1B artifact.

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
- **website-live businesses:** Use `measurement-quality-audit-prompt.md` (S1B/S2A) instead.

**Prompt handoff**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-pre-website-measurement-setup.user.md`

**Post-deploy verification (S9B, all launch surfaces)**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/post-deploy-measurement-verification-prompt.md`
- Run immediately after first production deploy. Two sections: Immediate (T+0) and Delayed (T+1/T+7).

---

## Gate B: Existing-business Results (S2A)

**Condition**: `launch-surface = website-live`

**Rule**: S2/S6 blocked until S2A Results baseline exists with `Status: Active`.

**If baseline blocked by missing data**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/historical-data-request-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-data-request-prompt.user.md`

**If data pack exists but baseline not consolidated**:
- `prompt_file`: `docs/business-os/workflow-prompts/_templates/existing-business-historical-baseline-prompt.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance-baseline.user.md`

---

## Gate C: S2/S6 deep research completion

**Rule**: If `latest.user.md` is missing, stale, or points to `Status: Draft`, stop and hand prompt.

**S2 handoff**:
- `prompt_file`: `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md`
- `required_output_path`: `docs/business-os/market-research/<BIZ>/<YYYY-MM-DD>-market-intelligence.user.md`

**S6 handoff**:
- `prompt_file`: `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`
- `required_output_path`: `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md`
