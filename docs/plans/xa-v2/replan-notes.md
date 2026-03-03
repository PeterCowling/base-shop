---
Created: 2026-02-28
Reason: Build gate failure — key precondition false
Task: XA-V2-01
Replan-round: 1
---

# XA-V2 Replan Notes

## Blocking Discovery for XA-V2-01

### What changed since the plan was written (2026-02-14)

**`apps/xa` was deleted in commit `2e5319f15e` (2026-02-23).**

The entire `apps/xa` directory (main XA member rewards storefront) was removed as part of a
checkpoint commit "chore: checkpoint outstanding updates and relax affected-test timeout".
This was 9 days after the plan was last updated.

The plan's fix (add `healthcheck-base-url: ${{ inputs.environment-url }}` to `.github/workflows/xa.yml`)
targeted the deploy job for `apps/xa`. That job no longer exists. The current `xa.yml` covers only:

- `apps/xa-b` — static export → Cloudflare Pages (`xa-b-site`)
- `apps/xa-uploader` — OpenNext Worker (staging deploy exists)
- `apps/xa-drop-worker` — Worker (preview deploy exists)

None of these apps have a failing `healthcheck-base-url` parameter issue.

### Decision required

**What is the current target for "XA launch"?**

Options:
A. `apps/xa-b` is the new primary app — update plan scope to target xa-b's Pages deployment
B. `apps/xa` should be restored from git history — recover the deleted app and resume plan as written
C. XA launch is on hold — archive this plan and revisit later

The current `xa.yml` deploys `xa-b` to Pages successfully (last CI run with no structural errors).
If option A, the blocking task may already be resolved and the plan needs a different gap analysis.

## Decision (2026-02-28)

**Option A selected by operator.**

`apps/xa-b` is now the primary XA app. Rescope all plan tasks to target xa-b.
XA-V2-01 task description is obsolete — replan required to identify actual launch blockers for xa-b.
