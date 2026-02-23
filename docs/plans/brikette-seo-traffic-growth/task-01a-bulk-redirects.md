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

- `TASK-01a` completed on 2026-02-22 via Cloudflare API (account-level Bulk Redirects).
- Redirect List created:
  - `list_name=brikette_www_to_apex`
  - `list_id=a0ea9ccf37284ee1923a6121922af712`
  - `kind=redirect`
- Redirect List item configured:
  - `source_url=www.hostel-positano.com/`
  - `target_url=https://hostel-positano.com`
  - `status_code=301`
  - `include_subdomains=false`
  - `subpath_matching=true`
  - `preserve_path_suffix=true`
  - `preserve_query_string=true`
- Redirect entrypoint rule created and enabled:
  - `ruleset_id=418b67f09e0340dbb49919915e2cf175`
  - `rule_id=54a6c9f6fc5d4f9ea7f7be4c4d514b8f`
  - `rule_ref=brikette_www_to_apex`
  - `expression=http.request.full_uri in $brikette_www_to_apex`
  - `action_parameters.from_list={name: brikette_www_to_apex, key: http.request.full_uri}`
- Task-level outcome: www host normalization is live.
- TASK-01 atomicity status: satisfied in production after TASK-01b deployment; root chain now has no `302`.

## Validation Commands (post-change)

```bash
curl -IL https://www.hostel-positano.com/
curl -IL https://www.hostel-positano.com/en
curl -IL https://www.hostel-positano.com/en/rooms
curl -IL 'http://www.hostel-positano.com/en/rooms?ref=test'
```

## Validation Output Excerpts (2026-02-22)

```text
=== https://www.hostel-positano.com/ ===
HTTP/2 301
location: https://hostel-positano.com/
HTTP/2 301
location: /en
HTTP/2 200
```

```text
=== https://www.hostel-positano.com/en ===
HTTP/2 301
location: https://hostel-positano.com/en
HTTP/2 200
```

```text
=== https://www.hostel-positano.com/en/rooms ===
HTTP/2 301
location: https://hostel-positano.com/en/rooms
HTTP/2 200
```

```text
=== http://www.hostel-positano.com/en/rooms?ref=test ===
HTTP/1.1 301 Moved Permanently
Location: https://hostel-positano.com/en/rooms?ref=test
HTTP/2 200
```

## Evidence to Attach

- Cloudflare API evidence (list ID, list item values, ruleset ID, rule ID, enabled state)
- command output excerpts for the four validation probes above

## Notes

- This task is dashboard/API-driven and cannot be completed from repository edits alone.
- `wrangler whoami` is authenticated, but OAuth scopes did not include account ruleset/list write; execution used the account token that had required permissions.
