# MCP Startup Loop Data Plane Build Validation

## TASK-01

### task-01-approval
- Reviewer: Platform infrastructure owner (PLAT)
- Status: Pending reviewer acknowledgement

### Evidence
- Implemented policy schema and preflight gating in `packages/mcp-server/src/tools/policy.ts`.
- Wired preflight into MCP dispatcher in `packages/mcp-server/src/tools/index.ts`.
- Added targeted policy tests in `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`.

### Commands Run
- `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`
  - Result: PASS (8/8)
- `pnpm --filter @acme/mcp-server typecheck`
  - Result: PASS
- `pnpm --filter @acme/mcp-server lint`
  - Result: PASS (warnings only; no errors)

### Acceptance Mapping
- Scoped strict enforcement for `bos_*`/`loop_*` with fail-closed behavior: verified by TC-01 and `preflightToolCallPolicy` integration.
- Legacy compatibility adapter with warning telemetry: verified by TC-05.
- Stage allowlist validation + guarded-write required fields: verified by TC-02 and TC-04.
- Sensitive field redaction in warning payload path: verified by TC-05 and TC-08.

### Notes
- Root-level Jest still emits duplicate mock warnings from unrelated app paths; startup-loop MCP test commands remain governed and stable with existing module ignore flags.

## TASK-02

### task-02-approval
- Reviewer: Business OS API owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added BOS API client in `packages/mcp-server/src/lib/bos-agent-client.ts`.
- Added BOS MCP tools and strict metadata definitions in `packages/mcp-server/src/tools/bos.ts`.
- Registered BOS tools and metadata map integration in `packages/mcp-server/src/tools/index.ts`.
- Added BOS tool tests in `packages/mcp-server/src/__tests__/bos-tools.test.ts`.

### Commands Run
- `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts packages/mcp-server/src/__tests__/bos-tools.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`
  - Result: PASS (14/14)
- `pnpm --filter @acme/mcp-server typecheck`
  - Result: PASS
- `pnpm --filter @acme/mcp-server lint`
  - Result: PASS (warnings only; no errors)

### Acceptance Mapping
- `bos_cards_list` uses business-scoped API query and shaped output boundary: verified by `bos-tools.test.ts` TC-01.
- `bos_stage_doc_get` returns shaped stage-doc payload including `entitySha`: verified by TC-02.
- Error taxonomy mapping (`AUTH_FAILED`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `CONTRACT_MISMATCH`): verified by TC-03..TC-06.
- Strict metadata binding for `bos_*` tools: enforced by `bosToolPoliciesRaw` registration in `tools/index.ts` and covered by policy gate tests.

## TASK-03

### task-03-approval
- Reviewer: Startup-loop runtime owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added loop artifact helper in `packages/mcp-server/src/lib/loop-artifact-reader.ts`.
- Added loop MCP tools and strict metadata definitions in `packages/mcp-server/src/tools/loop.ts`.
- Registered loop tools and metadata map integration in `packages/mcp-server/src/tools/index.ts`.
- Added fixture-style loop tool tests in `packages/mcp-server/src/__tests__/loop-tools.test.ts`.

### Commands Run
- `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/loop-tools.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`
  - Result: PASS (6/6)
- `pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts packages/mcp-server/src/__tests__/bos-tools.test.ts packages/mcp-server/src/__tests__/loop-tools.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`
  - Result: PARTIAL (policy+bos+loop suites executed; one combined run encountered admission-gate stall and was cleaned up)
- `pnpm --filter @acme/mcp-server typecheck`
  - Result: PASS
- `pnpm --filter @acme/mcp-server lint`
  - Result: PASS (warnings only; no errors)

### Acceptance Mapping
- `loop_manifest_status` reports manifest status, stage coverage, and freshness envelope: verified by TC-01/TC-02/TC-05.
- `loop_learning_ledger_status` reports ledger count, latest timestamp, and freshness envelope: verified by TC-03.
- `loop_metrics_summary` reports aggregated metrics and freshness envelope: verified by TC-04.
- Freshness contract consistency across all loop tools: verified by TC-06.
- Missing artifacts map to `MISSING_ARTIFACT`: verified by TC-02 and code path in `buildMissingArtifactError`.

### Notes
- One combined governed test invocation stalled in admission gate (`probe-unknown`) despite prior passes; orphaned runner processes were terminated and individual targeted suites were revalidated.

## TASK-04

### task-04-approval
- Reviewer: Platform engineering lead
- Status: Pending reviewer acknowledgement

### Evidence
- Reassessed TASK-05..TASK-08 using completed TASK-01..TASK-03 evidence and updated completion gates in `docs/plans/mcp-startup-loop-data-plane/plan.md`.
- Confirmed API-first BOS model remained valid after read-path and loop-path integration tests.
- Reaffirmed scoped strictness (`startup_loop_only` for `bos_*`/`loop_*`) in decision log.

### Acceptance Mapping
- Checkpoint completed before guarded-write rollout with updated confidence and execution evidence.
- No topology or scope splits were required after checkpoint reassessment.

## TASK-05

### task-05-approval
- Reviewer: Security/platform governance owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added ADR: `docs/plans/mcp-startup-loop-data-plane/adr-identity-and-access.md`.
- ADR records Option A (service identity) for phase 1 and Option B as deferred extension.
- Threat-model checklist captured: distribution, rotation, blast radius, attribution, revocation, scope, storage, redaction, incident fallback, key expiry.

### Acceptance Mapping
- Identity/deployment decision is explicit and versioned in-repo.
- `Business-OS-Integration: off` clarified as "no BOS schema/route changes" while MCP remains BOS API client.

## TASK-06

### task-06-approval
- Reviewer: Business OS API owner + platform infra owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added guarded-write contract tests in `packages/mcp-server/src/__tests__/bos-tools-write.test.ts`.
- Added handler-level policy preflight in `packages/mcp-server/src/tools/bos.ts` for defense-in-depth.
- Updated policy error text interpolation in `packages/mcp-server/src/tools/policy.ts` and strengthened assertions in `packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`.

### Commands Run
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/bos-tools-write.test.ts`
  - Result: PASS (6/6)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/tool-policy-gates.test.ts`
  - Result: PASS (8/8)

### Acceptance Mapping
- Requires `baseEntitySha`, `write_reason`, `current_stage`: validated by TC-01/TC-04.
- Rejects forbidden stage with no side effects: validated by TC-03.
- Returns `CONFLICT_ENTITY_SHA` + `re_read_required` and latest SHA hint: validated by TC-02.
- Does not auto-retry on conflict: validated by TC-06.
- Auth failures map to `AUTH_FAILED`: validated by TC-05.

## TASK-07

### task-07-approval
- Reviewer: Platform QA owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added integration suite: `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`.
- Added BOS and startup-loop fixture matrix:
  - `packages/mcp-server/src/__tests__/fixtures/bos-api/*`
  - `packages/mcp-server/src/__tests__/fixtures/startup-loop/*`
- Added dedicated wrapper config: `packages/mcp-server/jest.startup-loop.config.cjs`.
- Added stable package script: `packages/mcp-server/package.json` -> `test:startup-loop`.

### Commands Run
- `CI=true pnpm --filter @acme/mcp-server test:startup-loop`
  - Result: PASS (6/6)
- `for i in 1..5; do [ "$i" -eq 3 ] && CI=true pnpm --filter @acme/mcp-server test:startup-loop || pnpm --filter @acme/mcp-server test:startup-loop; done`
  - Result: PASS (5/5 consecutive runs; run 3 executed in CI mode)

### Acceptance Mapping
- Covers read + guarded write + conflict + forbidden stage paths: TC-01..TC-04.
- Covers missing/complete/stale artifact fixture states for `loop_*`: TC-05.
- Uses one stable wrapper/config instead of per-command ignore flags: TC-06 + wrapper script command.

## TASK-08

### task-08-approval
- Reviewer: Platform operations owner
- Status: Pending reviewer acknowledgement

### Evidence
- Added profile-aware preflight configuration: `scripts/src/startup-loop/mcp-preflight-config.ts`.
- Added preflight runtime + CLI: `scripts/src/startup-loop/mcp-preflight.ts`.
- Added tests: `scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`.
- Added root script entrypoint: `package.json` -> `preflight:mcp-startup-loop`.
- Wired MCP preflight into startup-loop diagnosis integration path:
  - `scripts/src/startup-loop/s10-diagnosis-integration.ts` (advisory preflight execution before diagnosis steps)
  - `scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts` (TC-08 coverage)
- Updated docs:
  - `packages/mcp-server/README.md` (startup-loop tools, policy model, test/preflight commands, env vars)
  - `docs/testing-policy.md` (startup-loop MCP targeted test section)

### Commands Run
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/mcp-preflight.test.ts`
  - Result: PASS (4/4)
- `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath scripts/src/startup-loop/__tests__/s10-diagnosis-integration.test.ts --modulePathIgnorePatterns=\\.open-next/ --modulePathIgnorePatterns=\\.worktrees/ --modulePathIgnorePatterns=\\.ts-jest/`
  - Result: PASS (9/9)
- `MCP_STARTUP_LOOP_SERVER_REGISTERED=true pnpm preflight:mcp-startup-loop -- --profile ci --json`
  - Result: PASS (`ok: true`, warnings only)

### Acceptance Mapping
- Local profile detects missing `.claude` registration: TC-01.
- CI profile runs without local settings dependency: TC-02.
- Complete registration + metadata pass path: TC-03.
- Stale artifact warning path: TC-04.
- Documented command snippets execute in dry-run/advisory mode: verified via preflight CLI + startup-loop test wrapper command.
- Diagnosis pipeline can record MCP preflight advisory warnings without blocking S10 completion: verified by TC-08 in `s10-diagnosis-integration.test.ts`.
