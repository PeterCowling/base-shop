---
Type: Investigation-Artifact
Status: Complete
Domain: Venture-Studio
Created: 2026-02-17
Plan: startup-loop-marketing-sales-capability-gap-audit
Task: TASK-20
---

# Lint Execution Environment — Investigation Artifact

Answers the unresolved TASK-12 scout: "Confirm whether lint runs in existing `validate-changes.sh`
flow or separate command."

## Q1: `check-startup-loop-contracts.sh` status

**File:** `scripts/check-startup-loop-contracts.sh`

**Exists:** Yes. Feature-complete. 15 drift checks (SQ-01 through SQ-15) covering:
- Stage graph consistency (SQ-01)
- Skill route resolution (SQ-02)
- Artifact path consistency (SQ-03)
- Repo topology (SQ-04)
- Fact-find handoff filename (SQ-05)
- BOS persistence discipline (SQ-06)
- Stage-doc key consistency (SQ-07 / SQ-13)
- Launch gate dependency (SQ-08)
- Prompt-pack coverage (SQ-09)
- Path topology (SQ-10)
- Stale skill slug references (SQ-11)
- Stage number assignments (SQ-12)
- Decision reference targets (SQ-14)
- Legacy stage-doc filename allowlist (SQ-15)
- Root policy checks (autonomy policy + spec_version field)

**Output format:** Plain text. Failures → stderr (`FAIL: <message>`). Warnings → stderr (`WARN: <message>`). Summary line → stdout (`N checks, N warnings`). Final result: `RESULT: PASS` or `RESULT: FAIL`.

**Exit code behavior:** `exit 0` = PASS, `exit 1` = FAIL, `exit 2` = unknown argument.

**`--self-test` mode:** Validates internal regex patterns. Separate from main checks.

**CI wiring status: UNWIRED.**
- Not registered as npm script in `scripts/package.json` or root `package.json`
- Not called by any `.github/workflows/*.yml` file
- Not a Turborepo task in `turbo.json`
- The script exists but is never invoked in any automated flow

## Q2: Test runner + fixture pattern

**Test runner:** Jest.

Evidence:
- `scripts/jest.config.cjs` uses `@acme/config/jest.preset.cjs`
- `scripts/package.json` line 7: `"test": "cross-env JEST_FORCE_CJS=1 bash tests/run-governed-test.sh -- jest -- --config ./jest.config.cjs"`
- Test files use Jest `describe()` / `it()` / `expect()` API

**Closest analogue for TASK-12:**
`scripts/src/startup-loop/__tests__/market-intelligence-pack-lint.test.ts` — a lint function test that passes structured content and asserts on issue codes. This is the exact shape a contract lint test would take.

**Fixture patterns:**

| Pattern | Files | Use case |
|---|---|---|
| Static JSON file | `fixtures/growth-ledger-head.json` | Shared realistic data structure |
| `fs.mkdtemp` inline | `s2-market-intelligence-handoff.test.ts` (lines 92, 371, 466, 554) | Isolated temp repo root with controlled file tree |

The `fs.mkdtemp` pattern creates an isolated temp directory, populates it with controlled files via a `writeFile()` helper, then runs the function under test. This is the correct approach for gate simulation tests that check file presence and content.

No snapshot files (`.snap`) in `__tests__/`.

## Q3: CI wiring

**`check-startup-loop-contracts.sh`:** Not wired to CI. Confirmed via:
- No match in `.github/workflows/*.yml` for `check-startup-loop-contracts`
- No match in any `package.json` for the script name
- No match in `turbo.json`

**Jest tests:** Automatically wired to CI.
- `ci.yml` line 310: `pnpm test:affected` → `CI=true pnpm run test:governed -- turbo -- --affected --concurrency=2`
- Turborepo includes `scripts` workspace when affected files change
- Nightly `test.yml` matrix sweeps all workspaces including `scripts`
- Any new `.test.ts` in `scripts/src/startup-loop/__tests__/` is picked up with zero CI config changes

## Recommendation

**Ship TASK-12 as Jest test files in `scripts/src/startup-loop/__tests__/`.**

Rationale:

1. **Shell script is feature-complete but unwired** — adding more checks to it doesn't solve the CI integration problem. It would remain unwired.

2. **Jest is already CI-wired** — new `.test.ts` files are automatically included in `test:affected` and nightly runs. Zero CI config changes required.

3. **Exact analogue exists** — `market-intelligence-pack-lint.test.ts` demonstrates the contract lint test pattern. TASK-12 can follow this pattern for path-contract violation checks.

4. **`fs.mkdtemp` handles gate simulation** — tests can spin up a controlled repo root with or without DEP artifact, with or without measurement-verification doc, and assert on gate outcomes. This is proven in `s2-market-intelligence-handoff.test.ts`.

5. **Standalone script (option c) repeats the wiring problem** — a new shell script would also sit unwired without additional CI config changes.

### Implementation notes for TASK-12

- **Contract lint tests:** Follow `market-intelligence-pack-lint.test.ts` pattern. Call TypeScript lint functions (not shell); assert on issue codes/messages.
- **Gate simulation tests (VC-02 4 scenarios):** Use `fs.mkdtemp` to create temp repo with controlled presence/absence of:
  - `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md` (GATE-S6B-STRAT-01)
  - `docs/business-os/strategy/<BIZ>/*measurement-verification*.user.md` with `Status: Active` (GATE-S6B-ACT-01 check 1)
  - Measurement risks in `plan.user.md` (check 2)
  - Conversion event non-zero markers (check 3)
- **Test file names:** `contract-lint.test.ts` and `gate-simulation.test.ts` (or combined `s6b-gate-simulation.test.ts`)
- **Seeded violations:** For VC-01, add a compliant fixture and an intentional path-contract violating fixture; assert lint returns deterministic failure reason on the violating one.
