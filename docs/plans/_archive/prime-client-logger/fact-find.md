---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-client-logger
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-client-logger/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309120000-0001
artifact: fact-find
---

# Prime Client Logger Fact-Find Brief

## Scope

### Summary

The prime app (a browser PWA) maintains a hand-rolled 72-line logger at `apps/prime/src/utils/logger.ts` with env-var reading, log-level filtering, and ZodError handling. The shared `@acme/lib/logger` entry point delegates to `logger.server.ts`, which uses `pino` behind `import "server-only"` and calls `getRequestContext()` — neither of which can run in a browser. The question is whether to: (a) add a `./logger/client` entry to `@acme/lib`, (b) create a dedicated `@acme/logger` package with separate server/client exports, or (c) keep prime-local but improve it.

### Goals
- Identify the correct home for a client-compatible logger utility
- Enumerate all prime files that must be updated if the logger moves
- Determine whether other apps share the same gap
- Establish what the prime logger does that must be preserved
- Estimate scope

### Non-goals
- Building or migrating anything during this fact-find
- Modifying the existing server logger

### Constraints & Assumptions
- Constraints:
  - `packages/lib/src/logger/logger.server.ts` uses `import "server-only"` — cannot be tree-shaken away in a client bundle; any client logger must live in a separate file that does NOT import `server-only` or pino
  - Prime uses Turbopack (default Next.js dev bundler, no `--webpack` flag in `package.json`)
  - `@acme/lib` `tsconfig.json` has `"types": ["node"]` — adding a browser-targeted entry does not break this, but the entry itself must not import Node-only types
  - `@acme/lib` uses `tsc -b` for builds; adding a new entry requires only a new `.ts` file + new export in `package.json`
  - Prime does NOT list `@acme/lib` in its `package.json` `dependencies`, yet it already imports `@acme/lib` directly in 5 production files (`owner/page.tsx`, `businessScorecard.ts`, `kpiAggregator.ts`, `rateLimiter.ts`, `firebaseMetrics.ts`). The dependency resolves today via pnpm hoisting. Adding `"@acme/lib": "workspace:*"` formalizes an existing undeclared direct dependency — this is a correctness fix, not merely a cosmetic touch
- Assumptions:
  - `zodErrorToString` in prime (`apps/prime/src/utils/zodErrorToString.ts`) is prime-local and not yet in any shared package — moving it would be a separate task; the shared logger should accept `unknown[]` args and let callers handle ZodError formatting
  - No other *app* currently has a hand-rolled client logger — confirmed by search (only prime has a complete local logger with `LogLevel` / `setLogLevel` / `shouldLog` at the app level). Note: `packages/platform-core/src/logging/safeLogger.ts` also defines a `LogLevel` type and structured log filtering, but it is a package-level utility with a different API (structured `LogEntry` + redaction) and is not used in prime.
  - brikette and reception use bare `console.*` calls (46 files in brikette, 75 in reception) rather than a structured logger — they are not blocked on this work

## Outcome Contract

- **Why:** Prime duplicates logger infrastructure that should be shared. The right solution depends on how many other apps need a client logger and whether `@acme/lib` is the right home — that's a scoping decision that needs fact-finding before building.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app `logger.ts` is replaced by a shared client-compatible logger utility, eliminating duplicate env-var reading and log-level logic.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/utils/logger.ts` — the hand-rolled logger being replaced; 72 lines; exports `default logger`, `LogLevel`, `setLogLevel`, `getLogLevel`
- `packages/lib/src/logger/logger.server.ts` — the existing shared server logger; pino-backed, `server-only` import, depends on `getRequestContext()`
- `packages/lib/src/logger/index.server.ts` — re-exports `logger` and `LogMeta` from `logger.server.ts`

### Key Modules / Files

- `packages/lib/package.json` — exports map; `"./logger"` currently maps to `./dist/logger/index.server.js` (server-only); no `./logger/client` entry exists
- `packages/lib/tsconfig.json` — `tsc -b`, `rootDir: src`, `outDir: dist`; single-pass compile of all `.ts` in `src/**`; adding `src/logger/client.ts` is picked up automatically
- `packages/lib/src/http/fetchJson.ts` — precedent: a client-safe file in the same package sitting alongside `buildResponse.server.ts` and `index.server.ts`; confirms the `server/client pair within one package` pattern already in use
- `packages/lib/src/context/requestContext.server.ts` — server-only; uses `import "server-only"` plus a module-level mutable variable; the client logger must NOT import this
- `apps/prime/src/utils/zodErrorToString.ts` — 56-line prime-local utility; the existing prime logger imports it; a shared client logger should NOT take this dependency (keep it prime-local for now)
- `apps/prime/package.json` — prime depends on `@acme/date-utils`, `@acme/design-system`, etc. but not `@acme/lib` explicitly; live `@acme/lib/math/*` imports resolve via pnpm hoisting

### Patterns & Conventions Observed

- **`.server.ts` suffix = server-only** — convention confirmed across `lib`, `context`, `http` modules; anything without `.server` suffix is assumed safe for bundlers
- **`export { } from "./foo.server.js"` index re-export pattern** — the `index.server.ts` file re-exports from `logger.server.ts`; the new client entry will be a single self-contained `client.ts` file (no separate index re-export needed since the file name matches the import path via the catch-all mapper)
- **Prime logger API shape**: `logger.debug/info/warn/error(...args: unknown[])` — variadic, console-delegating; NOT the pino `(message: string, meta: LogMeta)` shape used by the server logger. A shared client logger must match the prime shape (variadic args), not the server shape.
- **Log level config**: reads `NEXT_PUBLIC_LOG_LEVEL` then `LOG_LEVEL`, maps `"silent"` → `"none"`, defaults to `"info"`; supports runtime `setLogLevel()` and `getLogLevel()`
- **ZodError special-case**: `logger.error` maps ZodError args through `zodErrorToString` before passing to `console.error`; this is the one prime-specific behaviour that should stay prime-local (or move to the shared logger as an optional plugin)

### Data & Contracts

- Types/schemas/events:
  - `LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'` — prime-local; should be exported from the shared package
  - `LogMeta` already exists in `@acme/lib` logger but is pino-shaped (`{[key:string]: unknown}`); the client logger does not need it (variadic API)
- Persistence: none — logger is stateless aside from the module-level `currentLevel` variable
- API/contracts: none — logger is pure browser-side

### Dependency & Impact Map

- Upstream dependencies of `apps/prime/src/utils/logger.ts`:
  - `apps/prime/src/utils/zodErrorToString.ts` (prime-local) — stays prime-local after migration
  - `process.env` / `globalThis` — both available in Next.js client bundles; must be preserved
- Downstream dependents: **31 references** in prime that need updating — 27 production import sites + 4 test files that `jest.mock('@/utils/logger')`; the 4 mock call sites need to update their mock path to `@acme/lib/logger/client`; the production imports need updating to `import logger from '@acme/lib/logger/client'`. (The logger.ts file itself will be deleted, accounting for the 32nd grep hit.)
- Likely blast radius: prime-only; no other app has client-logger imports to update; `@acme/lib` gains a new optional export but existing consumers are unaffected

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (jsdom environment), `@acme/config/jest.preset.cjs`
- Commands: CI-governed runner only (`pnpm -w run test:governed`) — do NOT run Jest locally per project policy; see `docs/testing-policy.md`
- CI integration: governed test runner — NEVER run locally

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Prime logger (production) | None | 0 | No tests for `apps/prime/src/utils/logger.ts` directly; 4 test files use `jest.mock('@/utils/logger')` to stub it |
| `@acme/lib` server logger | Unit (Jest/node env) | 1 | `packages/lib/src/logger/__tests__/logger.test.ts` — covers pino-backed server logger; mocks pino; will need a parallel client test file |

#### Coverage Gaps
- No tests cover the prime logger today; a shared implementation should add basic unit tests for level filtering and env-var initialisation

#### Testability Assessment
- Easy to test: level filtering (pure function), default level from env
- Hard to test: `globalThis` Wrangler injection (requires Miniflare)
- Test seams needed: injectable `readEnv` function for testability

## Confidence Inputs

| Dimension | Score | Rationale | Verification Path |
|---|---|---|---|
| Scope clarity | 0.90 | 31 references to update in prime (27 production + 4 test mocks), zero in other apps, single source file to create | Confirmed by grep |
| Technical feasibility | 0.92 | `@acme/lib` already has client-safe files alongside server-only; TSC single-pass picks up new file automatically | Confirmed by package structure |
| API compatibility | 0.85 | Prime logger API (variadic) differs from server logger (message+meta); must be careful not to merge APIs | Confirmed by reading both files |
| ZodError coupling | 0.80 | ZodError transform is prime-local; if moved to shared logger it adds a `zod` dep already present in `@acme/lib` — acceptable | `@acme/lib` already has `zod` as a dep |
| Package dep gap | 0.90 | Prime doesn't list `@acme/lib` explicitly; adding `"@acme/lib": "workspace:*"` to prime `package.json` is low-risk | Confirmed via prime `package.json` |

Overall pre-plan confidence: **0.87**

## Planning Readiness

**Go.**

Recommended deliverable type: `code-change`
Primary execution skill: `lp-do-build`

Recommended approach: **Option (a) — add `./logger/client` entry to `@acme/lib`**

Rationale:
- Option (b) (new `@acme/logger` package) is over-engineered: only one consumer exists today; creating a new workspace package requires new `package.json`, `tsconfig.json`, build plumbing, and CI registration
- Option (c) (keep prime-local) wastes the opportunity to standardise; the pattern of bare `console.*` calls in brikette/reception means a shared client logger would be immediately useful even if those apps don't adopt it immediately
- Option (a) matches the existing `http` module precedent: a `fetchJson.ts` (client-safe) sits alongside `buildResponse.server.ts` (server-only) within the same `@acme/lib` package; the exports map already has separate entries for `./http` and `./http/server`

Concrete plan:
1. Create `packages/lib/src/logger/client.ts` — extract prime's non-pino logic: `LogLevel`, `levelOrder`, `readEnv`, `setLogLevel`, `getLogLevel`, variadic `logger` default export (no ZodError transform — that stays prime-local or callers handle it). **Note on file naming:** the Jest catch-all mapper `"^@acme/lib/(.*)$" → "packages/lib/src/$1"` already resolves `@acme/lib/logger/client` → `packages/lib/src/logger/client.ts` when the file is named `client.ts`. No `jest.moduleMapper.cjs` change is required — the catch-all handles it. An explicit mapper entry for `@acme/lib/logger/client` is optional cleanup only.
2. Add `"./logger/client"` export entry to `packages/lib/package.json` pointing to `./dist/logger/client.js`
3. Add `"@acme/lib": "workspace:*"` to `apps/prime/package.json`
4. Delete `apps/prime/src/utils/logger.ts` and update all 31 consumer references: 27 production import sites to `import logger from '@acme/lib/logger/client'`, and 4 test `jest.mock('@/utils/logger', ...)` calls to mock `'@acme/lib/logger/client'` instead
5. Add unit tests in `packages/lib/src/logger/__tests__/logger.client.test.ts`
6. Verify with scoped commands: `pnpm --filter @acme/lib typecheck && pnpm --filter @acme/lib lint` then `pnpm --filter @apps/prime typecheck && pnpm --filter @apps/prime lint`

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Prime logger source code | Yes | None | No |
| Server logger `server-only` constraint | Yes | None — client file will not import server-only | No |
| `@acme/lib` exports map extensibility | Yes | None — adding a new export entry is additive | No |
| `@acme/lib` tsc build picks up new files | Yes | None — `include: src/**/*.ts` catches all `.ts` files | No |
| 31 prime logger references needing updates (27 production + 4 test mocks) | Yes | Moderate: all 31 references need updating; production imports and test mock paths differ; no automated codemod in the plan yet | No (advisory) |
| Jest module mapper compatibility for `@acme/lib/logger/client` | Yes | Resolved: `client.ts` file naming means the existing catch-all mapper resolves correctly — no mapper changes needed | No |
| ZodError coupling | Yes | Minor: `zodErrorToString` stays prime-local; shared logger must NOT import it; callers handle formatting | No |
| `@acme/lib` missing from prime `package.json` | Yes | Minor: must add explicit dep before imports are clean | No |
| Turbopack compatibility | Yes | None — new entry is a plain `.ts` file; no alias changes needed | No |
| Test coverage | Partial | Minor: no existing tests for prime logger; new shared file should include basic unit tests | No |

No Critical findings. Advisory items are all handled by the plan tasks above.

## Scope Signal

Signal: **right-sized**

Rationale: The work is a single new file in `@acme/lib` (~50 lines, named `client.ts`), one new `package.json` export entry, one explicit dep addition to prime, and 31 reference updates (27 production + 4 test mocks). No new package, no API design ambiguity, no schema changes, no jest.moduleMapper.cjs changes needed. The ZodError coupling is explicitly scoped out. Turbopack and tsc build patterns confirmed from existing precedents.

## Evidence Gap Review

### Gaps Addressed
- Confirmed `@acme/lib` build is `tsc -b` single-pass — new client file is automatically included
- Confirmed prime already has 5 undeclared direct `@acme/lib` imports (not just transitive hoisting); adding explicit dep is a correctness fix
- Confirmed no other app has a hand-rolled client logger needing migration
- Confirmed `./http` / `./http/server` pattern as direct precedent for `./logger/client` entry
- Confirmed `jest.moduleMapper.cjs` catch-all pattern `"^@acme/lib/(.*)$"` → `"packages/lib/src/$1"` resolves `@acme/lib/logger/client` → `packages/lib/src/logger/client.ts` automatically when the file is named `client.ts` — no explicit mapper entry required; file naming constraint identified and addressed
- Confirmed `packages/lib/src/logger/__tests__/logger.test.ts` exists (server logger tests); client logger test file must be added as a companion
- Confirmed total prime logger reference count is 31 (27 production + 4 test mocks); the logger.ts self-reference is the 32nd grep hit but will be deleted
- CASS retrieval returned 0 relevant hits (no prior art for this specific feature)

### Confidence Adjustments
- ZodError special-case: initially unclear whether it should live in shared logger; resolved as prime-local. No confidence reduction needed.
- Option ranking initially uncertain; resolved to option (a) based on precedent evidence.

### Remaining Assumptions
- `NEXT_PUBLIC_LOG_LEVEL` env var does not need to be added to any `.env.example` for prime — it is already understood as an optional override (no evidence it is missing from prime's env files, but not verified)
- Brikette and reception apps do not plan to adopt the client logger — this is a prime-only migration for now

## Open Questions

All questions resolved during investigation. No remaining open questions for operator.

1. **Resolved**: Which option — (a), (b), or (c)? → Option (a): add `./logger/client` entry to `@acme/lib`. Evidence: `http` module precedent, single consumer, low overhead.
2. **Resolved**: Does ZodError handling belong in the shared logger? → No. Keep prime-local. The prime logger's ZodError transform should stay in `zodErrorToString.ts` and be called by the consumer before passing to `logger.error`.
3. **Resolved**: Does prime need `@acme/lib` added to `package.json`? → Yes, as explicit dep. Currently resolves via hoisting which is fragile.
4. **Resolved**: Are any other apps affected? → No. Only prime has hand-rolled client logger patterns.

## Risk Inventory

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shared logger accidentally imports server-only module | Low | High — would break client bundle | Lint rule (`no-restricted-imports` on `server-only`) + manual review |
| 31 reference updates (27 production + 4 test mocks) introduce a typo | Low | Low — TypeScript would catch production import errors at typecheck; test mocks would fail at CI | Scoped typecheck gate + CI test run |
| `readEnv` fallback to `globalThis` breaks in some bundler | Low | Low — already works in prime today | No change to logic, just move file |
| Turbopack dual-module identity (src vs dist) | Low | Medium — seen with `@acme/design-system` in other apps | New export resolves via exports map to dist/ consistently; no resolveAlias change needed |
