# TASK-01a — Cloudflare Bulk Redirects (www -> apex)

Date: 2026-02-22  
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`  
Task ID: `TASK-01a`

## Objective

Configure host-level redirect normalization so all `www.hostel-positano.com/*` traffic permanently redirects to `https://hostel-positano.com/*`, preserving path and query string.

## Configuration Contract

Create a Bulk Redirect List entry:

- Source URL: `www.hostel-positano.com/`
- Target URL: `https://hostel-positano.com`
- `SUBPATH_MATCHING=TRUE`
- `PRESERVE_PATH_SUFFIX=TRUE`
- `PRESERVE_QUERY_STRING=TRUE`

Create/enable a Bulk Redirect Rule that references this list with permanent redirect status.

## Execution Status

- `TASK-01c` preflight is complete and found no Brikette Pages Functions shadowing risk in the repo-managed deployment path.
- `TASK-01b` root redirect normalization is complete in source (`/  /en  301`).
- Bulk Redirect configuration is still pending operator Cloudflare access.

## Validation Commands (post-change)

Run after enabling the rule:

```bash
curl -IL https://www.hostel-positano.com/
curl -IL https://www.hostel-positano.com/en
curl -IL https://www.hostel-positano.com/en/rooms
curl -IL 'http://www.hostel-positano.com/en/rooms?ref=test'
```

Expected:

- first hop is permanent host normalization to apex
- path/query are preserved
- no `302` in the chain
- with TASK-01b live, `/` end-to-end resolves to `https://hostel-positano.com/en` in <=2 permanent hops and final `200`

## Evidence to Attach

- screenshot of Bulk Redirect List entry
- screenshot of enabled Bulk Redirect Rule
- command output excerpts for the four validation probes above

## Notes

- This task is dashboard/API-driven and cannot be completed from repository edits alone.
- `wrangler whoami` did not return a usable authenticated result in this runtime, so dashboard execution remains operator-side.
