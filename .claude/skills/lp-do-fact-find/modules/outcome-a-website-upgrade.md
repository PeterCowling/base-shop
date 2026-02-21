# Outcome A Module: Website Upgrade Backlog

Use this module only when:
- `Outcome: planning`
- `Startup-Deliverable-Alias: website-upgrade-backlog`

This is a dedicated branch. Do not run generic code/business checklist text first.

## Objective

Generate a planning-ready website-upgrade backlog grounded in platform fit and business outcomes.

## Prerequisite Checks

1. Platform capability baseline pointer:
- `docs/business-os/platform-capability/latest.user.md`

2. Business upgrade brief pointer:
- `docs/business-os/site-upgrades/<BIZ>/latest.user.md`

If either is missing, inactive, or stale, stop and present filled Deep Research prompts from:
- `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md`
- `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`

Include exact save paths for expected outputs.

## Required Output Slices

1. Website upgrade inputs
- Active baseline pointer
- Active business brief pointer
- Existing site baseline notes
- Reference-site decomposition evidence

2. Best-of synthesis matrix
- Pattern
- Source reference
- User value
- Commercial impact
- Platform fit
- Effort/risk
- Classification (`Adopt/Adapt/Defer/Reject`) with rationale

3. Prioritized backlog candidates
- Priority, item, rationale, acceptance criteria, dependencies, evidence refs

4. Risks and unknowns
- Call out unresolved dependencies and decision owners

## Hand-off Rule

If baseline/brief prerequisites are stale and require refresh, recommend running `/lp-site-upgrade` first, then resume `/lp-do-fact-find`.
