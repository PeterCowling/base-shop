---
Type: Site-Upgrade-Artifact
Status: Active
Business: HBAG
Created: 2026-02-23
Updated: 2026-02-23
Last-reviewed: 2026-02-23
Owner: Pete
Reviewer: Pete
Relates-to:
  - docs/business-os/site-upgrades/HBAG/2026-02-23-upgrade-brief.user.md
  - docs/plans/hbag-website-02-image-first-upgrade/plan.md
---

# HBAG Launch Media Production & QA Contract

## Purpose

This artifact is the operating gate for launch SKU media readiness in WEBSITE-02 L1 Build 2.
No SKU is launch-ready unless all mandatory shot slots are present and validated.

## Contract Defaults (TASK-01 Decision Lock)

- Mandatory slot pack: 6 images per SKU (`hero`, `angle`, `detail`, `on_body`, `scale`, `alternate`)
- Optional slot: `video_optional` (not required for launch)
- Launch family anchors: `Top Handle`, `Shoulder`, `Mini`
- Campaign video policy: deferred; static-image-first at launch

## Mandatory Shot Checklist (per SKU)

| Slot | Description | Required quality check |
|---|---|---|
| `hero` | Primary product framing | Product silhouette fully visible and centered |
| `angle` | Alternate viewing angle | Distinct from hero framing |
| `detail` | Hardware/craft macro | Hardware or stitch proof clearly visible |
| `on_body` | Worn/in-hand context | Scale and styling context obvious |
| `scale` | Reference scaling cue | Relative size is legible |
| `alternate` | Supplemental alternate | Adds distinct confidence view |

## Gate Command

```bash
pnpm --filter @apps/caryina validate:launch-media
```

Gate rule:
- Pass: `PASS launch-media-contract: ...`
- Fail: any `FAIL launch-media-contract` output blocks launch packaging for impacted SKUs.

## Rehearsal Evidence (VC-05)

### VC-05-01 Deterministic Pass (Active Catalog)

DO:
1. Run validator against active catalog:
   - `pnpm --filter @apps/caryina validate:launch-media`
2. Confirm all active SKUs pass.

SAVE:
- Validator output summary in `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`

DONE WHEN:
- Command exits `0`
- Report contains `PASS launch-media-contract`

IF BLOCKED:
- Re-run with `pnpm --filter @apps/caryina validate:launch-media -- --all-statuses` and inspect whether inactive records are misconfigured.

### VC-05-02 Deterministic Fail + Fallback Path

DO:
1. Run validator on fail fixture:
   - `pnpm --filter @apps/caryina validate:launch-media -- --file ../../docs/plans/hbag-website-02-image-first-upgrade/artifacts/fixtures/launch-media-missing-on-body.json`
2. Confirm missing slot is explicitly reported.

SAVE:
- Fixture result summary in `docs/plans/hbag-website-02-image-first-upgrade/build-record.user.md`

DONE WHEN:
- Command exits `1`
- Output includes `missing required slot \`on_body\``

IF BLOCKED:
- Verify fixture path and JSON structure, then rerun with `--file` absolute path.

## Fallback SLA for Failed SKUs

When validator fails for a launch SKU:
1. Mark SKU as `hold-media` in launch tracker.
2. Owner assigns reshoot to media producer within 1 business day.
3. Updated media is ingested with slot tags.
4. Validator is rerun; SKU is released only after pass.

Ownership:
- Gate owner: Pete
- Media fulfillment owner: HBAG production lane
- Validation runner: build operator

## Sign-off

- Reviewer: Pete
- Review date: 2026-02-23
- Verdict: Approved as launch gate for WEBSITE-02 L1 Build 2
