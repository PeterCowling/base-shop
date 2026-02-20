# TASK-03 Investigation: Browser-Safe `guides-core` Export Seam

Date: 2026-02-19  
Plan: `docs/plans/archive/turbopack-post-migration-hardening-archived-2026-02-20/plan.md`  
Task: `TASK-03`  

## Scope Question
- Which export contract is safest for browser-side consumption of `createGuideUrlHelpers`?
- What `package.json` export changes are required?
- Can Brikette consume the shared path without reintroducing Node built-in resolution risk?

## Evidence Summary
- `packages/guides-core/src/index.ts` currently exports Node-facing helpers from `./fsContent` (`listJsonFiles`, `readJson`).
- `packages/guides-core/src/fsContent.ts` imports `node:fs/promises` and `node:path` (Node-only).
- Brikette currently imports `createGuideUrlHelpers` from local file `./url-helpers` (`apps/brikette/src/guides/slugs/urls.ts`), not from shared package.
- Brikette `tsconfig` already maps subpaths (`@acme/guides-core/*`), which makes subpath adoption straightforward once package exports are added.

## Command Evidence
### 1. `guides-core` helper tests (required by task contract)
Command:
```bash
pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts
```
Result:
- `PASS __tests__/createGuideUrlHelpers.test.ts`
- `2 passed, 0 failed`

### 2. Brikette Turbopack probe (required by task contract)
Primary live probe command:
```bash
curl -fsS "http://127.0.0.1:3012/en/apartment" > /tmp/apartment.html
curl -fsS "http://127.0.0.1:3012/en/help" > /tmp/help.html
rg -o "application/ld\\+json" /tmp/apartment.html | wc -l
rg -io "positano" /tmp/help.html | wc -l
```
Result:
- `APARTMENT_JSONLD_COUNT=1`
- `HELP_POSITANO_COUNT=549`

Probe caveat:
- Starting a second isolated `next dev` instance under `apps/brikette` failed because a dev lock already existed:
  - `Unable to acquire lock at .../apps/brikette/.next/dev/lock`
- This indicates another local Brikette dev instance was active during investigation.

### 3. Root-index Node-leak risk evidence
Command:
```bash
diff -u apps/brikette/src/guides/slugs/url-helpers.ts packages/guides-core/src/index.ts | sed -n '1,120p'
```
Result:
- Main delta is extra root exports in `index.ts`, including re-export from `./fsContent`.
- `./fsContent` imports `node:fs/promises` and `node:path`.

## Option Matrix
| Option | Import Path | Browser Safety | Required Changes | Risk |
|---|---|---|---|---|
| A. Use root index export | `@acme/guides-core` | Low | None initially | High: root index also exports Node-only surfaces, increasing client bundling risk |
| B. Add browser-safe subpath export | `@acme/guides-core/url-helpers` | High | Add dedicated module + `exports` subpath + types entry | Low/Medium: bounded package export work |
| C. Keep app-local copy | `./url-helpers` in Brikette | Medium (short-term) | No package changes | Medium/High long-term: duplication and drift debt persists |

## Recommendation
- **Recommended option: B (browser-safe subpath export).**
- **Chosen import specifier for TASK-04:** `@acme/guides-core/url-helpers`.

Rationale:
- Avoids importing Node-only root-index surfaces into client-compilable code.
- Preserves shared ownership of helper logic (removes duplication).
- Aligns with existing Brikette path mapping (`@acme/guides-core/*`) and is package-contract explicit.

## TASK-04 Input Contract (from this investigation)
1. Add a dedicated browser-safe module in `guides-core` (for example `src/url-helpers.ts`) that exports:
   - `createGuideUrlHelpers`
   - `GuidesCoreConfig`
   - `GuideUrlHelpers`
   - `SlugsByKey`
2. Update `packages/guides-core/package.json` `exports` with `./url-helpers` (`import`, `default`, `types`).
3. Keep Node-only utilities (`readJson`, `listJsonFiles`) reachable from root/index for script callers.
4. Migrate Brikette `urls.ts` to import from `@acme/guides-core/url-helpers` and delete local duplicate file.
