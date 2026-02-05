---
Type: Plan
Status: Historical
Domain: Platform/Infra
Last-reviewed: 2026-01-21
Relates-to charter: none
Created: 2026-01-20
Created-by: Claude Opus 4.5
Last-updated: 2026-01-21
Last-updated-by: Claude Opus 4.5
Archived: 2026-01-21
Archived-by: Claude Opus 4.5
---

# @acme/lib Consolidation Plan

## Summary

Consolidated `@acme/shared-utils` into `@acme/lib` with organized subfolders. The `@acme/shared-utils` package has been **fully removed** from the monorepo.

## Motivation

Currently shared utilities are split across two packages:
- `@acme/lib` — Algorithmic utilities (math, search, forecasting)
- `@acme/shared-utils` — Simple helpers (format, http, security, logging)

This split is artificial. Consolidating into one package with clear folder structure:
- Reduces package management overhead
- Simplifies imports (`@acme/lib/format` vs remembering which package)
- Enables consistent patterns (runtime boundaries, exports)

## Goals

1. **Migrate all `@acme/shared-utils` exports to `@acme/lib`** — Complete mapping of all 30 exports
2. **Organize by domain** — Clear folder structure with runtime boundaries
3. **Preserve backwards compatibility** — Deprecation shim for existing imports
4. **No breaking changes** — Existing runtime behavior preserved

## Non-Goals

- Adding new utilities (retry, cache, debounce, etc.) — separate future plan
- Changing any utility implementations
- Breaking existing imports immediately
- Migrating `money.ts` (not currently exported from shared-utils)
- Changing runtime boundaries of existing code

---

## Current State

### `@acme/shared-utils` Exports (30 total)

From `packages/shared-utils/src/index.ts`:

```
HTTP (4):           buildResponse, fetchJson, parseJsonBody, parseLimit
Format (3):         formatCurrency, formatNumber, formatPrice
Security (2):       genSecret, getCsrfToken
String (1):         slugify
Shop/Path (2):      getShopFromPath, replaceShopInPath
JSON (2):           jsonFieldHandler, ErrorSetter (type)
Logger (2):         logger, LogMeta (type)
Context (5):        getRequestContext, setRequestContext, withRequestContext,
                    EnvLabel (type), RequestContext (type)
Shop Headers (7):   getOrCreateRequestId, getRequestIdFromHeaders, getShopIdFromHeaders,
                    requireShopIdFromHeaders, stripSpoofableShopHeaders,
                    REQUEST_ID_HEADER, SHOP_ID_HEADER
Shop Context (1):   ShopContext (type) — exported from shopContext.ts
Array (1):          toggleItem
```

**Subpath exports**: `@acme/shared-utils/logger`

**Dependencies**: `pino ^9.9.0`

**Test files** (19 total):
```
formatCurrency.test.ts, formatPrice.test.ts, buildResponse.test.ts,
fetchJson.test.ts, parseJsonBody.test.ts, http-utils.test.ts,
getCsrfToken.test.ts, getCsrfToken.node.test.ts, genSecret.test.ts, security-utils.test.ts,
slugify.test.ts, getShopFromPath.test.ts, replaceShopInPath.test.ts,
jsonFieldHandler.test.ts, logger.test.ts, logger.levels.test.ts,
toggleItem.test.ts, money.test.ts, utils.error.test.ts
```

### `@acme/lib` Current Structure

```
src/
├── math/
│   ├── probabilistic/    # HyperLogLog, BloomFilter, CountMinSketch, TDigest
│   ├── search/           # BM25, edit-distance, BKTree
│   ├── forecasting/      # EWMA, Holt smoothing
│   ├── rate-limit/       # TokenBucket
│   ├── animation/        # Bezier easing
│   └── color/            # OKLCH conversions
├── tryon/                # Virtual try-on (kvGet, kvPut, getProvider, renderShadow)
├── generateMeta.ts       # SEO meta generation
├── seoAudit.ts           # SEO audit (runSeoAudit)
├── validateShopName.ts
├── checkShopExists.server.ts
└── index.ts
```

**Runtime**: Node-only (`"types": ["node"]` in tsconfig.json)

**Current consumers** (existing subpath imports that must keep working):
- `@acme/lib/generateMeta` — scripts/generate-meta.ts
- `@acme/lib/seoAudit` — scripts/seo-audit.ts, functions/src/seoAudit.ts
- `@acme/lib/tryon` — cover-me-pretty API routes
- `@acme/lib/tryon/kv` — cover-me-pretty API routes
- `@acme/lib/tryon/fallback/shadow` — PreviewUtils.ts

### `@acme/shared-utils` Not Exported (internal only)

- `money.ts` — 6 functions (`normalizeCurrencyCode`, `getCurrencyFractionDigits`, `assertMinorInt`, `toMinor`, `fromMinor`, `formatMinor`)
- Has test file `money.test.ts` but not exported from index

---

## Runtime Boundaries

### Current Runtime Analysis

After code review, the actual runtime requirements are:

| Module | Current Runtime | Evidence |
|--------|-----------------|----------|
| `fetchJson` | **Universal** | Uses standard `fetch()` API, works in browser |
| `getCsrfToken` | **Universal** | Has browser code path (`getTokenFromDocument`), used in client forms |
| `genSecret` | **Universal** | Uses `crypto.randomUUID()` / `crypto.getRandomValues()` — available in browsers |
| `buildResponse` | Server | Creates `Response` objects for API routes |
| `parseJsonBody` | Server | Parses request bodies |
| `logger` | Server | Uses Pino (Node streams) |
| `requestContext` | Server | Uses AsyncLocalStorage |
| `shopContext` | **Mixed** | Header functions need `Headers` API (universal), but typically used server-side |

### Runtime Classification (Corrected)

| Folder | Runtime | Reason |
|--------|---------|--------|
| `format/` | Universal | Pure Intl formatting |
| `string/` | Universal | Pure string manipulation |
| `array/` | Universal | Pure array utilities |
| `json/` | Universal | Pure JSON handling |
| `shop/path.ts` | Universal | Pure path parsing |
| `math/` | Universal | Pure algorithms |
| `http/fetch.ts` | Universal | Standard fetch API |
| `http/response.ts` | Server | Request/Response handling for API routes |
| `security/csrf.ts` | Universal | Has browser code path |
| `security/secret.ts` | Universal | Web Crypto API |
| `context/` | Server | AsyncLocalStorage |
| `shop/headers.ts` | Universal | Headers API available everywhere |
| `logger/` | Server | Pino (Node streams) |

**Key insight**: Only `logger/`, `context/`, and `http/response.ts` are truly server-only.

---

## Target Structure

```
packages/lib/src/
├── index.ts                    # Barrel exports (all universal)
├── server.ts                   # Barrel exports (server-only additions)
│
├── math/                       # (existing, unchanged)
├── tryon/                      # (existing, unchanged)
├── generateMeta.ts             # (existing, unchanged)
├── seoAudit.ts                 # (existing, unchanged)
├── validateShopName.ts         # (existing, unchanged)
├── checkShopExists.server.ts   # (existing, unchanged)
│
├── format/                     # FROM shared-utils (UNIVERSAL)
│   ├── index.ts
│   ├── currency.ts             # formatCurrency
│   ├── number.ts               # formatNumber
│   └── price.ts                # formatPrice
│
├── string/                     # FROM shared-utils (UNIVERSAL)
│   ├── index.ts
│   └── slugify.ts
│
├── array/                      # FROM shared-utils (UNIVERSAL)
│   ├── index.ts
│   └── toggle.ts               # toggleItem
│
├── json/                       # FROM shared-utils (UNIVERSAL)
│   ├── index.ts
│   └── field-handler.ts        # jsonFieldHandler, ErrorSetter
│
├── http/                       # FROM shared-utils (MIXED)
│   ├── index.ts                # Re-exports fetch (universal)
│   ├── index.server.ts         # Re-exports all including response (server)
│   ├── fetch.ts                # fetchJson (UNIVERSAL)
│   └── response.server.ts      # buildResponse, parseJsonBody, parseLimit (SERVER)
│
├── security/                   # FROM shared-utils (UNIVERSAL)
│   ├── index.ts
│   ├── csrf.ts                 # getCsrfToken (UNIVERSAL - has browser path)
│   └── secret.ts               # genSecret (UNIVERSAL - Web Crypto)
│
├── context/                    # FROM shared-utils (SERVER)
│   ├── index.server.ts         # imports server-only
│   └── request.server.ts       # getRequestContext, setRequestContext, withRequestContext, types
│
├── shop/                       # FROM shared-utils (UNIVERSAL)
│   ├── index.ts                # Re-exports path + headers
│   ├── path.ts                 # getShopFromPath, replaceShopInPath
│   └── headers.ts              # getOrCreateRequestId, etc. (uses Headers API)
│
└── logger/                     # FROM shared-utils (SERVER)
    └── index.server.ts         # logger, LogMeta; imports server-only, pino
```

---

## Export Strategy

### Subpath Exports

`packages/lib/package.json` — **full exports map** including existing subpaths:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./server": {
      "types": "./dist/server.d.ts",
      "import": "./dist/server.js"
    },
    "./format": {
      "types": "./dist/format/index.d.ts",
      "import": "./dist/format/index.js"
    },
    "./string": {
      "types": "./dist/string/index.d.ts",
      "import": "./dist/string/index.js"
    },
    "./array": {
      "types": "./dist/array/index.d.ts",
      "import": "./dist/array/index.js"
    },
    "./json": {
      "types": "./dist/json/index.d.ts",
      "import": "./dist/json/index.js"
    },
    "./http": {
      "types": "./dist/http/index.d.ts",
      "import": "./dist/http/index.js"
    },
    "./http/server": {
      "types": "./dist/http/index.server.d.ts",
      "import": "./dist/http/index.server.js"
    },
    "./security": {
      "types": "./dist/security/index.d.ts",
      "import": "./dist/security/index.js"
    },
    "./context": {
      "types": "./dist/context/index.server.d.ts",
      "import": "./dist/context/index.server.js"
    },
    "./shop": {
      "types": "./dist/shop/index.d.ts",
      "import": "./dist/shop/index.js"
    },
    "./logger": {
      "types": "./dist/logger/index.server.d.ts",
      "import": "./dist/logger/index.server.js"
    },
    "./math": {
      "types": "./dist/math/index.d.ts",
      "import": "./dist/math/index.js"
    },
    "./math/*": {
      "types": "./dist/math/*/index.d.ts",
      "import": "./dist/math/*/index.js"
    },
    "./generateMeta": {
      "types": "./dist/generateMeta.d.ts",
      "import": "./dist/generateMeta.js"
    },
    "./seoAudit": {
      "types": "./dist/seoAudit.d.ts",
      "import": "./dist/seoAudit.js"
    },
    "./tryon": {
      "types": "./dist/tryon/index.d.ts",
      "import": "./dist/tryon/index.js"
    },
    "./tryon/*": {
      "types": "./dist/tryon/*.d.ts",
      "import": "./dist/tryon/*.js"
    },
    "./validateShopName": {
      "types": "./dist/validateShopName.d.ts",
      "import": "./dist/validateShopName.js"
    },
    "./checkShopExists": {
      "types": "./dist/checkShopExists.server.d.ts",
      "import": "./dist/checkShopExists.server.js"
    }
  }
}
```

### Import Patterns

```typescript
// Universal (works everywhere including browser)
import { formatPrice } from '@acme/lib/format'
import { slugify } from '@acme/lib/string'
import { fetchJson } from '@acme/lib/http'
import { getCsrfToken, genSecret } from '@acme/lib/security'
import { getShopFromPath, getShopIdFromHeaders } from '@acme/lib/shop'

// Server-only (will error on client due to server-only import)
import { logger } from '@acme/lib/logger'
import { getRequestContext } from '@acme/lib/context'
import { buildResponse, parseJsonBody } from '@acme/lib/http/server'

// Existing subpaths (must keep working)
import { generateMeta } from '@acme/lib/generateMeta'
import { runSeoAudit } from '@acme/lib/seoAudit'
import { getProvider } from '@acme/lib/tryon'
import { kvGet } from '@acme/lib/tryon/kv'
```

### Barrel Export Strategy

**`index.ts`** (universal):
```typescript
export * from './format'
export * from './string'
export * from './array'
export * from './json'
export * from './http'        // fetch only (universal)
export * from './security'    // csrf + secret (universal)
export * from './shop'        // path + headers (universal)
export * from './math'
```

**`server.ts`** (server additions):
```typescript
export * from './index'                // universal
export * from './http/index.server'    // adds buildResponse, parseJsonBody
export * from './context'              // server-only
export * from './logger'               // server-only
```

---

## Active Tasks

### Phase 1: Setup & Universal Modules

Tasks LIB-02 through LIB-06 can run **in parallel** after LIB-01.

- [x] **LIB-01**: Create folder structure and add `server-only` dependency
  - **Scope**:
    - Create folders: `format/`, `string/`, `array/`, `json/`, `http/`, `security/`, `context/`, `shop/`, `logger/`
    - Add `server-only` to `@acme/lib` dependencies
  - **DoD**: Folders exist with stub index files; `server-only` in package.json
  - **Affects**: `packages/lib/src/`, `packages/lib/package.json`

- [x] **LIB-02**: Migrate `format/` (universal)
  - **Scope**: Move `formatCurrency.ts`, `formatNumber.ts`, `formatPrice.ts` + tests (`formatCurrency.test.ts`, `formatPrice.test.ts`)
  - **Test migration**: Copy tests, update imports to `../format/...`
  - **DoD**: Files in `format/`, tests pass, exports work
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-03, LIB-04, LIB-05, LIB-06

- [x] **LIB-03**: Migrate `string/` (universal)
  - **Scope**: Move `slugify.ts` + `slugify.test.ts`
  - **DoD**: Files in `string/`, tests pass, exports work
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-02, LIB-04, LIB-05, LIB-06

- [x] **LIB-04**: Migrate `array/` (universal)
  - **Scope**: Move `toggleItem.ts` + `toggleItem.test.ts`
  - **DoD**: Files in `array/`, tests pass, exports work
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-02, LIB-03, LIB-05, LIB-06

- [x] **LIB-05**: Migrate `json/` (universal)
  - **Scope**: Move `jsonFieldHandler.ts` + `jsonFieldHandler.test.ts`
  - **DoD**: Files in `json/`, tests pass, exports work
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-02, LIB-03, LIB-04, LIB-06

- [x] **LIB-06**: Migrate `shop/` (universal)
  - **Scope**:
    - Move `getShopFromPath.ts`, `replaceShopInPath.ts` → `shop/path.ts`
    - Move `shopContext.ts` → `shop/headers.ts` (no `.server.ts` — Headers API is universal)
    - Move tests: `getShopFromPath.test.ts`, `replaceShopInPath.test.ts`
  - **DoD**: Files in `shop/`, tests pass, exports from `@acme/lib/shop`
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-02, LIB-03, LIB-04, LIB-05

### Phase 2: Mixed & Server-Only Modules

- [x] **LIB-07**: Migrate `http/` (mixed)
  - **Scope**:
    - Move `fetchJson.ts` → `http/fetch.ts` (universal, no `.server.ts`)
    - Move `buildResponse.ts`, `parseJsonBody.ts` → `http/response.server.ts` (server-only)
    - Create `http/index.ts` exporting fetch only
    - Create `http/index.server.ts` exporting all, with `import 'server-only'`
    - Move tests: `fetchJson.test.ts`, `buildResponse.test.ts`, `parseJsonBody.test.ts`, `http-utils.test.ts`, `utils.error.test.ts` (covers parseJsonBody)
  - **DoD**: `fetch.ts` is universal, `response.server.ts` has `server-only` import, tests pass
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-08, LIB-09, LIB-11

- [x] **LIB-08**: Migrate `security/` (universal)
  - **Scope**:
    - Move `getCsrfToken.ts` → `security/csrf.ts` (NO `.server.ts` — has browser code path)
    - Move `genSecret.ts` → `security/secret.ts` (NO `.server.ts` — uses Web Crypto)
    - Move tests: `getCsrfToken.test.ts`, `getCsrfToken.node.test.ts`, `genSecret.test.ts`, `security-utils.test.ts`, `utils.error.test.ts` (covers getCsrfToken)
  - **DoD**: Files are universal `.ts` (not `.server.ts`), tests pass
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-07, LIB-09, LIB-11

- [x] **LIB-09**: Migrate `context/` (server)
  - **Scope**:
    - Move `requestContext.ts` → `context/request.server.ts`
    - Create `context/index.server.ts` with `import 'server-only'`
  - **DoD**: Files use `.server.ts`, have `server-only` import, types exported
  - **Depends on**: LIB-01
  - **Parallel with**: LIB-07, LIB-08, LIB-11

- [x] **LIB-11**: Migrate `logger/` (server)
  - **Scope**:
    - Move `logger.ts` → `logger/index.server.ts`
    - Move tests: `logger.test.ts`, `logger.levels.test.ts`
    - Add `pino` to `@acme/lib` dependencies
    - Add `import 'server-only'` at top
  - **DoD**: `pino` in dependencies, `server-only` import, tests pass
  - **Depends on**: LIB-01
  - **Affects**: `packages/lib/package.json`
  - **Parallel with**: LIB-07, LIB-08, LIB-09

### Phase 3: Package Configuration

- [x] **LIB-12**: Update `@acme/lib/package.json` exports
  - **Scope**: Add all subpath exports per Export Strategy section (including existing `generateMeta`, `seoAudit`, `tryon/*`)
  - **DoD**: All subpaths resolve correctly; `pnpm --filter @acme/lib build` succeeds
  - **Depends on**: LIB-02 through LIB-11

- [x] **LIB-13**: Create barrel exports
  - **Scope**:
    - `index.ts` — universal exports (format, string, array, json, http, security, shop, math)
    - `server.ts` — adds server-only (context, logger, http/server)
  - **DoD**:
    - `import { formatPrice } from '@acme/lib'` works
    - `import { logger } from '@acme/lib/server'` works
    - `import { getCsrfToken } from '@acme/lib/security'` works in browser
  - **Depends on**: LIB-12

- [x] **LIB-13b**: Verify existing `@acme/lib` consumers still work
  - **Scope**: Ensure existing subpath imports compile:
    - `@acme/lib/generateMeta`
    - `@acme/lib/seoAudit`
    - `@acme/lib/tryon`, `@acme/lib/tryon/kv`, `@acme/lib/tryon/fallback/shadow`
  - **DoD**: `pnpm typecheck` passes; no import errors
  - **Depends on**: LIB-12

### Phase 4: Deprecation Shim

- [x] **LIB-14**: Create `@acme/shared-utils` deprecation shim
  - **Scope**:
    - Update `index.ts` to re-export from `@acme/lib` subpaths
    - Update `./logger` subpath to re-export from `@acme/lib/logger`
    - Add `@acme/lib` as dependency
    - Add deprecation notice to package.json `"description"`
  - **DoD**:
    - All 30 exports work via `@acme/shared-utils`
    - `@acme/shared-utils/logger` works
    - `pnpm build` succeeds
  - **Depends on**: LIB-13

- [x] **LIB-15**: Migrate one app as proof
  - **Scope**: Update `@apps/brikette` to import from `@acme/lib/*` instead of `@acme/shared-utils`
  - **DoD**: App builds and tests pass with new imports
  - **Depends on**: LIB-14

---

## Rollback Plan

If migration breaks mid-way:

1. **Per-task rollback**: Each task is atomic. If LIB-07 fails, revert only LIB-07 changes.
2. **Phase rollback**: If Phase 2 has issues, Phase 1 modules already work independently.
3. **Full rollback**: Git revert to pre-migration commit. Shim (LIB-14) ensures no downstream breaks until we're confident.

Key principle: **Never delete from `@acme/shared-utils` until shim is working** (LIB-14 complete).

---

## CI Considerations

1. **Build order**: `@acme/lib` must build before `@acme/shared-utils` (shim depends on lib)
2. **Test filters**: No changes needed; existing `--filter` patterns work
3. **Turborepo**: May need to update `turbo.json` if build dependencies change

---

## Verification

**Per-task**:
- Tests pass for migrated module
- TypeScript compiles without errors

**Phase 1-2 complete**:
```bash
pnpm --filter @acme/lib test
pnpm --filter @acme/lib build
```

**Phase 3 complete**:
```bash
pnpm typecheck  # All existing consumers still work
pnpm build
```

**Phase 4 complete** (final):
```bash
pnpm --filter @acme/shared-utils test  # Shim works
pnpm build                              # Full monorepo
```

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Target package | `@acme/lib` | Already has algorithmic utils; better name |
| `getCsrfToken` runtime | Universal (`.ts`) | Has browser code path (`getTokenFromDocument`) |
| `genSecret` runtime | Universal (`.ts`) | Uses Web Crypto API (browser-compatible) |
| `fetchJson` runtime | Universal (`.ts`) | Standard fetch API |
| `shopContext` runtime | Universal (`.ts`) | Headers API available everywhere |
| Server-only modules | `logger/`, `context/`, `http/response` only | Only these truly require Node |
| Logger strategy | Move with `pino` dependency | Logger is used widely; keep together |
| Barrel exports | Universal in `index.ts`, server additions in `server.ts` | Prevents breaking client code |
| Deprecation shim | Re-export from `@acme/lib` | `@acme/shared-utils` depends on `@acme/lib` (not circular) |
| Scope | Migration only | New utilities (retry, cache, etc.) are separate plan |
| `money.ts` | Not migrated | Not exported from shared-utils currently |

---

## Completion Summary

**Completed: 2026-01-21**

All tasks (LIB-01 through LIB-15) were completed successfully. After the migration:

1. **All imports migrated** — Every `@acme/shared-utils` import across the monorepo was updated to use `@acme/lib/*` subpaths
2. **Package removed** — The `packages/shared-utils` directory was deleted
3. **Dependencies cleaned** — All `package.json` files updated to remove `@acme/shared-utils` dependency
4. **Config files cleaned** — All `tsconfig*.json` and `jest.moduleMapper.cjs` path mappings removed
5. **Lockfile updated** — `pnpm install` completed successfully

### Final Import Patterns

```typescript
// Format utilities
import { formatPrice, formatCurrency, formatNumber } from '@acme/lib/format'

// HTTP utilities
import { fetchJson } from '@acme/lib/http'
import { parseJsonBody, buildResponse } from '@acme/lib/http/server'

// Security utilities
import { getCsrfToken, genSecret } from '@acme/lib/security'

// Shop utilities
import { getShopFromPath, replaceShopInPath, requireShopIdFromHeaders } from '@acme/lib/shop'

// Other utilities
import { slugify } from '@acme/lib/string'
import { toggleItem } from '@acme/lib/array'
import { jsonFieldHandler } from '@acme/lib/json'
import { logger } from '@acme/lib/logger'
import { withRequestContext } from '@acme/lib/context'
```

### Files Affected

- **Source files**: ~50 files updated with new imports
- **Test files**: ~40 files updated (both imports and `jest.mock()` calls)
- **Config files**: 15+ tsconfig files, jest.moduleMapper.cjs, multiple package.json files
