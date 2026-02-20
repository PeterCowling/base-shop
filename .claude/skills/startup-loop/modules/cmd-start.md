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

## Gate D: Problem-first pre-intake (S0A–S0D)

**Condition**: `--start-point = problem`

**Rule**: Route to S0A Problem framing. Skip Gate D entirely when `--start-point product` or flag absent (pass-through directly to S0).

**Prompt handoff**:
- `prompt_file`: `.claude/skills/lp-problem-frame/SKILL.md`
- `required_output_path`: `docs/business-os/strategy/<BIZ>/problem-statement.user.md`

**Backward compatibility**: Absent `--start-point` flag is treated as `product` — no behavior change for existing operators.

**Re-entry**: If S0A–S0D were completed on a prior run for this business, they are skippable on re-entry with `--start-point problem` (check for existing `problem-statement.user.md` artifact under the business strategy path).

---

## Gate A: Pre-website measurement bootstrap (S1B)

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

## Gate B: Existing-business historical baseline (S2A)

**Condition**: `launch-surface = website-live`

**Rule**: S2/S6 blocked until S2A baseline exists with `Status: Active`.

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
