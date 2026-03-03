# Simulation Protocol (Shared)

Used by `lp-do-plan` (Phase 7.5, plan simulation mode), `lp-do-fact-find` (Phase 5.5, scope simulation mode), and `lp-do-critique` (Step 5a, forward simulation trace mode).

## What Simulation Is

Simulation is a **structured forward trace** performed by the agent reading the proposed artifact (plan task sequence, fact-find scope, or critique target) and asking, at each step:

> If I were an agent executing this step, given only what is stated or discoverable in the repository at planning time, would this step succeed or fail? Why?

The agent does not run code. It reads file paths, interface signatures, config keys, API shapes, environment variable schemas, and task ordering — all from the repository — and reasons about whether each proposed step has what it needs to proceed.

The trace is:
- **Sequential:** each task or investigation step is visited in order.
- **Precondition-checking:** for each step, the agent verifies that all inputs required by that step are produced by a prior step or already exist in the repository.
- **Boundary-aware:** integration points (API calls, config lookups, type intersections, environment variables) are inspected for contract mismatches.
- **Structured:** output is a table per step, not prose narration.

Simulation is **not a replacement for tests.** It catches structural and contract issues visible at planning time. Tests enforce correctness after implementation. The correct framing: simulation raises the baseline quality floor before build begins.

## Issue Taxonomy

Issues are classified using the same severity labels as `lp-do-critique`: **Critical / Major / Moderate / Minor**.

### What Simulation Can Catch

| Category | Description | Example |
|---|---|---|
| Missing precondition | Task N requires an output from task M, but M is sequenced after N or not in the plan | Migration task runs before schema-definition task |
| Circular task dependency | Task A depends on output of task B, which depends on output of task A | Two IMPLEMENT tasks whose outputs feed each other's inputs |
| Undefined config key | A task references an environment variable or config key not present in any env schema or `.env.example` | Task calls `process.env.NEW_SECRET_KEY` but key is absent from all schema files |
| API signature mismatch | A task calls a function or endpoint with arguments that do not match the current signature in the repository | Plan calls `createOrder(shopId, sessionId)` but actual signature is `createOrder(sessionId, shopId, options)` |
| Type contract gap | A task produces a value of type A and passes it to a consumer expecting type B, with no conversion step in the plan | New field added as `string \| null` but consumed by a function typed for `string` only |
| Missing data dependency | A task needs a database record, a file, or an artifact that no prior task creates and that does not already exist | Task reads from a table that no migration creates |
| Integration boundary not handled | A task calls an external service but the plan has no step for error handling, retry, or fallback when that service fails | Payment gateway call with no fallback task |
| Scope gap in investigation | (lp-do-fact-find only) The proposed investigation scope does not cover a domain that is materially affected by the change | Fact-find on a new API route that does not investigate existing auth middleware |
| Execution path not traced | (lp-do-critique only) The critique asserts feasibility for a step without having checked whether the relevant code path actually exists | Critique approves a plan step referencing a module that does not exist |
| Ordering inversion | Steps are sequenced in an order that will produce a failure at runtime even if individually correct | Database seeded before schema migrated; component registered before its dependency is installed |

### What Simulation Cannot Catch (Limits)

| Limit | Why |
|---|---|
| Runtime-only failures | Race conditions, flaky network responses, memory pressure — require actual execution |
| Test assertion failures | Whether a test passes or fails against the implemented code — requires running the test suite |
| Business validation | Whether a hypothesis is true, whether users will adopt a feature — requires real-world signal |
| Compiler/bundler edge cases | Turbopack module identity conflicts, CSS layer cascade issues — require build execution |
| Dynamic config at runtime | Secrets injected by CI, feature flags evaluated at request time — not visible statically |
| Emergent integration behaviour | Two systems each correct individually but incorrect together — requires integration test execution |

## Tiered Gate Rules

Simulation findings are tiered: Critical findings are a hard gate; Major, Moderate, and Minor findings are advisory.

**Critical findings (hard gate):**
- Block the artifact from being emitted with a passing status (`Status: Active` for plans; `Status: Ready-for-planning` for fact-finds).
- The agent must either resolve the Critical issue before emitting the artifact, or write a `Simulation-Critical-Waiver` block (see Waiver Format below).
- Unresolved Critical findings with no waiver = artifact must not proceed.

**Major / Moderate / Minor findings (advisory):**
- Written into the `## Simulation Trace` section of the artifact.
- Do not block emission.
- Are visible to `lp-do-critique` in subsequent rounds; unresolved Major findings will degrade Evidence, Feasibility, and Risk-handling dimension scores.
- Operator and critique can accept, address, or override these findings without a formal waiver.

## Waiver Format

When a Critical simulation finding is a false positive — the agent has incorrectly identified something as missing that actually exists elsewhere or is provided implicitly — write a `Simulation-Critical-Waiver` block immediately below the `## Simulation Trace` section:

```
## Simulation-Critical-Waiver

- **Critical flag:** <describe the Critical finding being waived>
- **False-positive reason:** <explain why this finding is incorrect — what the simulation could not see>
- **Evidence of missing piece:** <cite the file, section, task, or implicit contract that provides the prerequisite the simulation thought was absent>
```

All three fields are required. A waiver with any field missing or vague is not a valid waiver — resolve the Critical issue instead.

The waiver is visible to `lp-do-critique`. Critique will evaluate whether the waiver reasoning is sound. An unconvincing waiver will be flagged as a Major finding.

## Simulation Trace Output Format

The trace is written as a `## Simulation Trace` section added to the artifact **before the persist step** (before `Status: Active` or `Status: Ready-for-planning` is set).

For **lp-do-plan** (plan trace — one row per task in the sequenced task list):

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: <short title> | Yes / Partial / No | None — or: [Category] [Severity]: <description> | Yes / No |

For **lp-do-fact-find** (scope trace — one row per scope area from the investigation):

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| <evidence domain or entry point> | Yes / Partial / No | None — or: [Category] [Severity]: <description> | Yes / No |

For **lp-do-critique**, findings are folded into Step 5 output inline — no separate `## Simulation Trace` section is produced. The forward trace reasoning is written as a sub-section within the Step 5 output block.

## Scope Simulation Checklist (lp-do-fact-find Phase 5.5)

For fact-find scope simulation, the agent walks through the investigation scope and checks these five categories. A finding in any category is classified using the issue taxonomy above.

1. **Concrete investigation path:** For each evidence area named in the scope, is there a concrete path to investigate it? (A file to read, a pattern to search, a boundary to inspect.) A named area with no investigation path is a scope gap.
2. **Investigation ordering:** Does any evidence area depend on findings from another area that has not been investigated first? (Example: auth middleware behaviour depends on reading the route definition — if the route is investigated after auth, the investigation order is inverted.)
3. **System boundary coverage:** Are all material system boundaries referenced in the scope (APIs, config schemas, auth layers, external services) covered by at least one evidence area? An uncovered boundary is a scope gap.
4. **Circular investigation dependency:** Does any scope area's conclusion depend on a finding from an area that itself depends on the first area's conclusion?
5. **Missing domain coverage:** Is there a domain that the proposed change is known to touch (from the area anchor or location anchors) that is absent from the investigation scope entirely?

## Forward Simulation Trace Instructions (lp-do-critique Step 5a)

Within Step 5 (Feasibility and Execution Reality), after completing the existing code-track and business-artifact checks, run a forward simulation trace of the target document:

1. Identify the proposed execution sequence (task order for plans; investigation order for fact-finds; proposed implementation steps for other artifacts).
2. For each step in the sequence, apply the issue taxonomy above: check for Missing preconditions, Circular dependencies, Undefined config keys, API signature mismatches, Type contract gaps, Missing data dependencies, Integration boundaries not handled, and Ordering inversions.
3. Classify each finding by severity (Critical / Major / Moderate / Minor) and state the specific issue category.
4. Record findings inline within Step 5 output. Use the label `[Simulation]` to distinguish these from standard feasibility findings.
5. If a Critical simulation finding is identified: flag it explicitly in the Top Issues section (Section 2) and in the Fix List (Section 10). Do not fold Critical simulation findings silently into Step 5 prose.

Simulation findings in critique are advisory to the critique score — they do not trigger a separate hard gate in critique mode. The hard gate lives in lp-do-plan (Phase 7.5) and lp-do-fact-find (Phase 5.5), before the artifact reaches critique.
