---
Type: Spike
Status: Complete
Domain: Platform
Created: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-app-native-inbox
Task: TASK-01
---

# Gmail Adapter Spike

## Verdict

Pass. Reception can authenticate to Gmail from the hosted runtime model using three Worker secrets and a direct refresh-token exchange.

## Implemented Surface

- `apps/reception/src/lib/gmail-client.ts`
- `apps/reception/src/app/api/mcp/gmail-adapter/route.ts`
- `apps/reception/src/app/api/mcp/__tests__/gmail-adapter.route.test.ts`
- `apps/reception/.env.example`

## Secret Contract

The adapter uses these server-only values:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`

All three are configured on the `reception` Worker.

## What Was Proven

Live validation on 2026-03-06 succeeded for:

1. refresh-token exchange against `https://oauth2.googleapis.com/token`
2. Gmail profile read
3. inbox thread listing
4. Gmail draft creation
5. draft visibility in Drafts before send
6. draft send
7. sent visibility in Sent after send

## Evidence Summary

### Validation run A

- Purpose: prove refresh/profile/list/create/send.
- Result: success.
- Observed outputs:
  - profile lookup succeeded
  - inbox list returned non-empty results
  - draft creation returned a draft id and message id
  - draft send returned a sent message id and thread id

### Validation run B

- Purpose: prove Drafts and Sent mailbox visibility explicitly.
- Result: success.
- Observed outputs:
  - subject was visible via `in:drafts`
  - after send, subject was visible via `in:sent`

## Route Contract

`POST /api/mcp/gmail-adapter`

Actions:

- `profile`
- `list_threads`
- `create_draft`
- `send_draft`

All requests are gated by `requireStaffAuth()`.

## Caveats

- Live validation exercised the new Gmail client module directly under server conditions; the route itself was not called end-to-end with a live Firebase bearer token in this session.
- Route auth and payload handling are covered by `gmail-adapter.route.test.ts`.
- Wrangler emits a harmless `custom_domains` warning when operating on this app's `wrangler.toml`.

## Decision

Proceed. The critical-path hosting unknown is resolved.
