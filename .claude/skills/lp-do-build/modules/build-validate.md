# Build Validator: Post-Build Validation

## Purpose

After existing gates (tests/typecheck/lint/VC checks) pass, run a type-adaptive walkthrough to confirm the built item works from the outside — rendering correctly, returning correct data, or reading correctly as its intended audience. Task completion is gated on a passing walkthrough result.

**Scope:** IMPLEMENT tasks only. SPIKE, INVESTIGATE, and CHECKPOINT tasks have no shippable deliverable and do not run this module.

---

## Mode Selection Rule

Key on the task's `Deliverable-Type` field (not `Affects` paths) to select the validation mode.

| `Deliverable-Type` value | Mode |
|---|---|
| `code-change` — AND acceptance criteria reference rendered UI elements (screenshot, DOM element, visible component) | **Mode 1** (Visual Walkthrough) |
| `code-change` — AND no rendered UI in acceptance criteria | **Mode 2** (Data Simulation) |
| `multi-deliverable` — produces both UI and API/service | **Mode 1 AND Mode 2** (run both) |
| `email-message` | **Mode 3** (Document Review) |
| `product-brief` | **Mode 3** |
| `marketing-asset` | **Mode 3** |
| `spreadsheet` | **Mode 3** |
| `whatsapp-message` | **Mode 3** |
| `skill-update` | **Mode 3** |
| Any other business-artifact `Deliverable-Type` | **Mode 3** |

**Mixed deliverables:** When `Deliverable-Type` is `multi-deliverable`, run both Mode 1 and Mode 2. The overhead is acceptable for mixed-deliverable IMPLEMENT tasks; both walkthroughs must pass before task completion.

---

## Mode 1: Visual Walkthrough

**Applies when:** `Execution-Track: code | mixed` AND deliverable produces a rendered UI (component, page, form, modal).

### Procedure

1. Open target URL/route using the active browser session-open tool.
2. Take a screenshot using the active browser observe tool.
3. Walk through the primary user action for this task (e.g. click the button, submit the form, open the modal) using the active browser act tool.
4. Take a final screenshot of the result state.
5. Assess: does the UI render correctly? Does the action produce the expected outcome? Are there visible errors or broken states?
6. Run scoped UI audit skills on changed routes/components only:
   - `/lp-design-qa` (design-system/spec alignment)
   - `/tools-ui-contrast-sweep` (contrast/uniformity)
   - `/tools-ui-breakpoint-sweep` (responsive behavior)
7. Merge findings from walkthrough + scoped audits and classify severity.
8. Auto-create a fix list for every Critical/Major finding and execute fixes in the same task cycle.
9. Re-run Mode 1 procedure after fixes.
10. **Pass:** screenshots and scoped audits show no Critical/Major issues. Record evidence (session ID, URL, audit scope, findings summary) in build notes. Proceed to task completion.
11. **Fail:** any Critical/Major issue remains after a run. Describe defects clearly. Enter the Fix+Retry Loop below. Max 3 attempts.

### Scoped Audit Rule (Mode 1)

- Do not run full-app sweeps by default.
- Set each audit scope to the exact routes/components changed by the task (`Affects` + acceptance criteria surface).
- If a shared layout/token change can impact outside the changed route, expand scope minimally and document why.
- Critical/Major findings are never defer-only in build mode; they must be fixed and re-verified in the same task cycle.
- Minor-only findings may be deferred, but each deferral must include rationale and a follow-up task/reference.

### Browser Tool Binding (Provider-Agnostic)

Use the browser tooling namespace configured for the current project/session.
Do not hardcode one tenant namespace.

Examples:
- Base Shop: `mcp__base-shop__browser_session_open`, `mcp__base-shop__browser_observe`, `mcp__base-shop__browser_act`
- Brikette legacy: `mcp__brikette__browser_session_open`, `mcp__brikette__browser_observe`, `mcp__brikette__browser_act`

### Degraded Mode (browser tools unavailable or dev server unreachable)

Use when the active browser session-open tool is unavailable or the dev/staging server cannot be reached.

1. Locate the nearest test snapshot or rendered HTML file for the component/page (e.g. `__snapshots__/*.snap`, `out/<route>/index.html`).
2. Read the snapshot/HTML linearly; check that the key DOM elements from the acceptance criteria are present (correct class names, expected text, required attributes).
3. Reason explicitly about the primary user action (e.g. "button with `data-cy=submit` is present and not `disabled`").
4. Record in build notes: degraded mode used, snapshot path, elements checked, and conclusion.

**Degraded mode limitation:** Cannot catch runtime behaviour (JS errors, network calls, animation states). Flag any acceptance criteria that require live execution as "not verifiable in degraded mode" and record this in build notes. These items remain at-risk until a live verification is performed.

---

## Mode 2: Data Simulation

**Applies when:** `Execution-Track: code | mixed` AND deliverable is a function, API endpoint, service, or data transformation (not a rendered UI).

### Procedure

1. Identify the entry point: function signature, route, CLI command, or service call.
2. Construct representative inputs — at minimum: one happy-path input, one edge-case input if the acceptance criteria reference edge cases.
3. Execute the entry point directly using the Bash tool (`curl`, test runner with specific input, or inline call).
4. Capture actual output.
5. Assess: does the output match the expected contract? Are error states handled correctly?
6. **Pass:** output matches contract. Record the execution trace (command, input, output) in build notes. Proceed to task completion.
7. **Fail:** describe the gap between actual and expected output. Enter the Fix+Retry Loop below. Max 3 attempts.

---

## Mode 3: Document Review

**Applies when:** `Execution-Track: business-artifact` (any `Deliverable-Type` in the business-artifact set).

### Procedure

1. Read the completed artifact linearly from top to bottom, as its intended audience would receive it.
2. Check for:
   - Broken or placeholder references (e.g. `[TBD]`, `<INSERT LINK>`, orphaned anchors).
   - Internal inconsistencies (e.g. conflicting mode numbers, contradictory definitions, dates that do not match plan frontmatter).
   - Missing required sections (check against the task's acceptance criteria and VC contracts).
   - Calls-to-action that reference non-existent items (links, file paths, commands).
   - Pricing, date, or quantity errors if the artifact contains numeric claims.
3. For HTML or web artifacts: check that all internal links and anchor targets exist within the document.
4. Assess: does the artifact deliver its stated intended outcome as described in the task?
5. **Pass:** no blockers found. Record a one-paragraph review summary in build notes. Proceed to approval capture (or task completion if no approval required).
6. **Fail:** list each specific issue found. Enter the Fix+Retry Loop below. Max 3 attempts.

---

## Fix+Retry Loop

Applies to all three modes when a walkthrough fails.

1. **Describe the failure** clearly in build notes: what was found, what the expected state was, which acceptance criterion is not satisfied.
2. **Convert findings to actions**: list each unresolved Critical/Major issue as a concrete autofix action and apply it in this task cycle. Do not leave a Critical/Major issue as report-only output.
3. **Identify root cause** before applying any fix. A fix that re-passes the walkthrough without addressing the root cause must be flagged as "symptom patch" in build notes. Symptom patches count toward the 3-attempt cap and are surfaced to the operator in build notes regardless of whether the walkthrough ultimately passes.
4. **Apply the minimum fix set** that addresses the identified root causes.
5. **Re-run validation** — not the full task, only the walkthrough from step 1 of the applicable mode.
6. **If pass:** record pass evidence in build notes. Continue to task completion.
7. **If fail again and attempt count < 3:** increment attempt counter, return to step 1 of the Fix+Retry Loop (re-describe the new failure state).
8. **If fail after 3 attempts:** mark task `Blocked` with reason `Validation failed after 3 attempts — operator escalation required`. Surface the full failure history and retry log to the operator. Do not mark task complete. Route to `/lp-do-replan` if the failure indicates an architectural or planning issue. Do not attempt a fourth retry.

**Attempt counting:** each full execution of the applicable mode procedure counts as one attempt (Mode 1 steps 1–11, Mode 2 steps 1–7, Mode 3 steps 1–6). The initial walkthrough is attempt 1. Each fix+re-run is attempts 2 and 3.

---

## Build Notes Template

Record the following in the task's build evidence block in the plan file after validation completes:

```
Post-build validation:
  Mode: [1 | 2 | 3] ([Visual | Data | Document])
  Attempt: [1 | 2 | 3]
  Result: [Pass | Fail | Blocked]
  Evidence: [screenshot session ID and URL / execution trace / review summary paragraph]
  Scoped audits (Mode 1): [scope + lp-design-qa result + contrast-sweep result + breakpoint-sweep result]
  Autofix actions (Mode 1): [None | list of Critical/Major findings and applied fixes]
  Symptom patches: [None | describe each]
  Deferred findings: [None | Minor finding + rationale + follow-up reference]
  Degraded mode: [No | Yes — reason: <reason>, flagged items: <list>]
```
