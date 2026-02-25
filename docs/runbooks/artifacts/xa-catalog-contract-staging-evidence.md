---
Type: Runbook-Artifact
Status: Draft
Last-updated: 2026-02-24
Relates-to: docs/runbooks/xa-catalog-contract-staging-checklist.md
---

# XA Catalog Contract Staging Evidence

## Recorded Values
- `XA_CATALOG_CONTRACT_BASE_URL`:
- `Worker URL`:
- `Checked storefront`:
- `Operator`:
- `Date (UTC)`:

## Step Results

### Step 1
- Captured base URL:
- Secret manager entry updated:

### Step 2
- Worker variables/secrets configured at:
- Notes:

### Step 3
- `/health` response:
- Notes:

### Step 4
- Uploader sync status:
- Notes:

### Step 5
- First `GET /catalog/xa-b` status + ETag:
- Second `GET /catalog/xa-b` status with `If-None-Match`:

### Step 6
- XA-B build status:
- Sync log line captured:

### Step 7
- `/api/search/sync` status:
- `version` value:
- Product count:

## Verdict
- Contract publish/read verified: `yes` / `no`
- XA-B consumption verified: `yes` / `no`
- Follow-up actions:
