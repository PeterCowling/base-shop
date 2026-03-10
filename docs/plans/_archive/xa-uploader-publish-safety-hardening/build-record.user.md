# Build Record

## Outcome Contract
- **Why:** Hosted-only XA still had a publish side door that bypassed save/conflict safety and hid partial snapshot-write failures.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA publish now requires a saved hosted revision, publishes from the canonical snapshot rather than browser draft JSON, and reports partial-success warnings instead of silent success.
- **Source:** operator

## Delivered
- Client publish now blocks on dirty autosave and on drafts without a saved revision.
- Publish API now accepts `draftId` plus `ifMatch` and reloads the saved hosted draft before publishing.
- Publish and sync writeback now mint fresh revisions when publish state changes.
- Publish success feedback now includes localized warning text when snapshot promotion fails partially.

## Validation
- `pnpm --filter @apps/xa-uploader typecheck`
- `pnpm --filter @apps/xa-uploader lint`
- `bash scripts/validate-changes.sh` on a temporary index scoped to the XA change set

## Testing Notes
- Local Jest was not run, per repo policy.
