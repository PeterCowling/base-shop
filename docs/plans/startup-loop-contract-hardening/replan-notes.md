# startup-loop-contract-hardening: TASK-14 Stability Gate Evidence (2026-02-15)

Measured on:
- Date (UTC): 2026-02-15
- Repo: `/Users/petercowling/base-shop`
- Git HEAD: `9083e2a90764f214c70c858f47fab2fb62550f40`
- Note: working tree had unrelated local modifications at time of capture; evidence below is based on explicit commands and does not depend on unstaged changes.

## Cutoff Recap (Operational State)

- Contract migration cutoffs were set to `2026-02-14` in `docs/business-os/startup-loop/contract-migration.yaml`, meaning:
  - Alias stage keys are disabled starting `2026-02-15T00:00:00Z`.
  - Legacy filename dual-read is disabled starting `2026-02-15T00:00:00Z`.

## Telemetry Evidence Since 2026-02-15T00:00Z

Target events:
- `bos.stage_alias_used`
- `bos.stage_doc_filename_alias_used`

### Real-time tail (Cloudflare Workers)

Limitations:
- `wrangler tail` is real-time and does not provide historical aggregates; this only proves "no matching logs were observed during the capture window", not "count=0 since cutoff" as an absolute.

1) `bos.stage_alias_used`

Commands:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
cd apps/business-os
npx --yes wrangler tail business-os --format pretty --search bos.stage_alias_used
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Capture window:
- Start: `2026-02-15T20:03:35Z`
- End: `2026-02-15T20:04:24Z`

Result:
- Tail connected successfully and produced **no** `bos.stage_alias_used` log entries during the window.

2) `bos.stage_doc_filename_alias_used`

Commands:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
cd apps/business-os
npx --yes wrangler tail business-os --format pretty --search bos.stage_doc_filename_alias_used
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

Capture window:
- Start: `2026-02-15T20:04:28Z`
- End: `2026-02-15T20:05:15Z`

Result:
- Tail connected successfully and produced **no** `bos.stage_doc_filename_alias_used` log entries during the window.

## Repo Audit Evidence

1) Contract lint

```bash
bash scripts/check-startup-loop-contracts.sh
```

Output:
```text
Startup Loop contract lint: 18 checks, 0 warnings
RESULT: PASS — all contract checks passed
```

2) No stage-doc alias emissions from skills (API stage key mismatch)

```bash
rg -n '"stage"\\s*:\\s*"lp-fact-find"' .claude/skills
rg -n 'stage-docs/.*/lp-fact-find' .claude/skills
```

Result:
- No matches for either pattern.

3) No legacy filename references outside migration config (expected)

```bash
rg -n --fixed-strings 'fact-finding.user.md' docs
```

Result:
- Matches exist in archived plans and historical docs (expected).
- Migration config contains `fact-finding.user.md: fact-find.user.md` (expected).
- No evidence of active, non-archived canonical docs reintroducing legacy filenames was found by contract lint (PASS).

## Go / No-Go Decision For TASK-13 (Remove Compatibility Code Paths)

Decision: **NO-GO (default)**.

Rationale:
- Repo-side audits are clean (lint PASS; no alias emissions detected).
- Telemetry evidence collected is *real-time only* and limited to ~1 minute of observation; it is not a historical aggregate proving zero usage since `2026-02-15T00:00Z`.
- TASK-13 removes the rollback lever; per `plan.md`, this should be gated on stronger post-cutoff telemetry evidence (ideally an aggregate or a longer observation window).

What would upgrade this to GO:
- Provide an **aggregate** post-cutoff count for both events since `2026-02-15T00:00Z` (preferred), or
- Run an operator-observed tail during normal traffic for a materially longer window (e.g. several hours) and record “0 hits” for both event names.

## Deferred Execution Notes (Pick-Up Checklist)

Default stability window (recommended for caution):
- Window start: `2026-02-15T00:00:00Z` (aliases/dual-read disabled)
- Window end (earliest GO date): `2026-02-22T00:00:00Z` (7 days)

Evidence to capture before flipping GO for TASK-13:
1) Telemetry (preferred: aggregate)
- Goal: since `2026-02-15T00:00:00Z`, both are zero:
  - `bos.stage_alias_used`
  - `bos.stage_doc_filename_alias_used`
- If you have aggregate access (dashboard/logpush), record the query + result counts here.

2) Telemetry (fallback: long live tail during normal traffic)
- Run in `apps/business-os`:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
npx --yes wrangler tail business-os --format pretty --search bos.stage_alias_used
date -u +"%Y-%m-%dT%H:%M:%SZ"

date -u +"%Y-%m-%dT%H:%M:%SZ"
npx --yes wrangler tail business-os --format pretty --search bos.stage_doc_filename_alias_used
date -u +"%Y-%m-%dT%H:%M:%SZ"
```
- Target: multi-hour observation (not minutes). Record start/end timestamps and “0 hits observed”.

3) Repo audit (re-run on the day you flip GO)
```bash
bash scripts/check-startup-loop-contracts.sh
rg -n '\"stage\"\\s*:\\s*\"lp-fact-find\"' .claude/skills
rg -n 'stage-docs/.*/lp-fact-find' .claude/skills
rg -n --fixed-strings 'fact-finding.user.md' docs/business-os
```

Then update this memo with:
- The aggregate counts or the long-tail observation windows
- Explicit “GO” statement for TASK-13
