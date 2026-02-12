---
name: site-upgrade
description: "Build website-upgrade strategy in three layers: (1) periodic platform capability baseline, (2) per-business upgrade brief from reference sites, and (3) wf-fact-find handoff packet for prioritized implementation backlog. Use when upgrading an existing site by synthesizing best-of patterns with platform-fit constraints."
---

# Site Upgrade Best Of

Use this skill when you want to upgrade an existing site using reference websites while staying grounded in current platform capability and business outcomes.

## Invocation

```bash
/site-upgrade --mode=platform-baseline
/site-upgrade --mode=platform-baseline --baseline-max-age-days=30
/site-upgrade --biz=HEAD --existing-site=https://example.com --reference-sites="siteA.com,siteB.com"
/site-upgrade --biz=PET --launch-surface=pre-website --brief-max-age-days=21
```

Defaults:
- `mode=business-brief` unless explicitly set to `platform-baseline`
- `baseline-max-age-days=30`
- `brief-max-age-days=21`
- `launch-surface=website-live` unless site is not launch-ready

## Canonical Artifacts

Platform baseline:
- `docs/business-os/platform-capability/latest.user.md`
- `docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md`
- `docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.html`
- template:
  - `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md`
  - `docs/business-os/platform-capability/_templates/platform-capability-baseline-template.user.md`

Business upgrade brief:
- `docs/business-os/site-upgrades/<BIZ>/latest.user.md`
- `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md`
- `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.html`
- template:
  - `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`
  - `docs/business-os/site-upgrades/_templates/site-upgrade-brief-template.user.md`

## Workflow

### Stage 1: Select Mode

- `platform-baseline`: periodic platform capability refresh.
- `business-brief`: per-business best-of synthesis for website upgrade.

### Stage 2A: Platform Baseline Mode

1. Check `docs/business-os/platform-capability/latest.user.md`.
2. Treat baseline as stale if:
   - file missing,
   - `Status` is not `Active`, or
   - `Last-reviewed` older than `baseline-max-age-days`.
3. If stale, present a fully filled Deep Research prompt using:
   - `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md`
4. Pause until Deep Research output is provided.
5. Save baseline doc to:
   - `docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md`
6. Update `latest.user.md` to point to the new baseline and set `Status: Active`.
7. Render HTML companions (required):
   - `pnpm docs:render-user-html -- docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md docs/business-os/platform-capability/latest.user.md`

### Stage 2B: Business Brief Mode

1. Require active platform baseline first.
2. Check business brief pointer at:
   - `docs/business-os/site-upgrades/<BIZ>/latest.user.md`
3. Treat brief as stale if:
   - file missing,
   - `Status` is not `Active`, or
   - `Last-reviewed` older than `brief-max-age-days`, or
   - reference-site list changed materially.
4. If stale/missing, present a fully filled Deep Research prompt using:
   - `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md`
5. Pause until Deep Research output is provided.
6. Save output to:
   - `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md`
7. Update `docs/business-os/site-upgrades/<BIZ>/latest.user.md` to `Status: Active`.
8. Render HTML companions (required):
   - `pnpm docs:render-user-html -- docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md docs/business-os/site-upgrades/<BIZ>/latest.user.md`

### Stage 3: Build Fact-Find Handoff Packet

From the business brief, produce a wf-fact-find-ready packet in the same brief (or a linked addendum) containing:
- outcome frame and decision links
- best-of synthesis matrix (`Adopt/Adapt/Defer/Reject`)
- prioritized backlog candidates with acceptance criteria
- dependencies and open questions
- source evidence pointers

Then hand off to `/wf-fact-find` for formal planning brief generation and task seeding.

## Prompt Presentation Rules (Required)

When baseline/brief is stale or missing, output must include:
1. exact reason for block
2. exact template path
3. fully filled copy-paste prompt block for Deep Research
4. exact save path for returned output

## Quality Rules

1. Never jump straight from reference site names to build tasks without platform baseline and business brief.
2. Do not copy proprietary creative/assets from reference sites.
3. Every backlog candidate must map to a business outcome.
4. Each P1/P2 candidate must include acceptance criteria and evidence refs.
5. If confidence is low on a claim, mark it explicitly and attach a validation test.

## Output Contract

### Platform baseline output

Must include:
- capability matrix
- delivery constraints
- gaps register
- preferred patterns and anti-patterns
- adopt/adapt/defer/reject scoring rubric
- freshness contract

### Business brief output

Must include:
- existing site baseline
- reference-site pattern decomposition
- best-of synthesis matrix
- website and technical implications
- prioritized backlog candidates
- open questions
- source list

### Fact-find handoff packet

Must include:
- candidate backlog table with priority, rationale, acceptance criteria, dependencies
- mapping from each item to outcome and decision link
- unresolved decisions requiring user input

## Red Flags (Invalid Run)

1. Marks brief ready without active platform baseline.
2. Produces build backlog without best-of synthesis matrix.
3. Lacks acceptance criteria on prioritized items.
4. Omits source evidence for competitor/reference claims.
5. Continues despite stale prerequisites without presenting Deep Research prompt.
6. Writes/updates `.user.md` artifacts but does not render matching `.user.html` companions.
