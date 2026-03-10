---
Type: Artifact
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-updated: 2026-03-10
Relates-to: docs/plans/startup-loop-learned-prescription-system/plan.md
Task-ID: TASK-05
---

# Milestone Root Producer Map (TASK-05)

## Purpose
Define the contract-backed milestone roots that the learned-prescription system may use, identify which roots have a real producer seam in the repo today, and reduce the current activation-threshold conflicts to one bounded precedence model for later runtime work.

This artifact is intentionally hard-faced: a milestone root is only acceptable for runtime work if it is either backed by a concrete producer seam in the current repo or explicitly deferred.

## Audit Scope

Reviewed contract and registry sources:
- `docs/business-os/startup-loop/schemas/sales-ops-schema.md`
- `docs/business-os/startup-loop/schemas/retention-schema.md`
- `docs/business-os/startup-loop/process-registry-v2.md`
- `docs/business-os/startup-loop/specifications/process-assignment-v2.yaml`
- `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md`
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- `docs/business-os/startup-loop/contracts/s10-weekly-orchestration-contract-v1.md`

Reviewed runtime and producer-adjacent code:
- `scripts/src/startup-loop/diagnostics/growth-metrics-adapter.ts`
- `scripts/src/startup-loop/s10/s10-growth-accounting.ts`
- `scripts/src/startup-loop/diagnostics/funnel-metrics-extractor.ts`
- repo-wide searches under `scripts/src/startup-loop` for `sales-ops.user.md`, `retention.user.md`, `qualified lead`, `repeat signal`, `wholesale_accounts`, and weekly-packet producer seams

## Summary Decision

The repo currently supports five milestone/root concepts relevant to this feature:

1. `qualified_lead_or_enquiry_flow_present`
2. `wholesale_accounts_positive`
3. `transaction_data_available`
4. `repeat_signal_present`
5. `weekly_cycles_post_launch_gte_4`

Only one of those has a real code-backed numeric seam today: `transaction_data_available`, via S10 growth metrics and growth accounting.

The others are still contract-only:
- `qualified_lead_or_enquiry_flow_present` is defined in CAP-05 docs, but no runtime reader exists.
- `wholesale_accounts_positive` exists only as prose in the process registry and assignment spec; there is no current structured source field.
- `repeat_signal_present` is defined in CAP-06 docs, but no runtime reader or metric adapter exists.
- `weekly_cycles_post_launch_gte_4` is a contract backstop only; there is no machine-readable launch anchor or script-side weekly-packet writer in `scripts/src/startup-loop`.

That means the initial milestone runtime must not pretend all roots are equally ready.

## Canonical Root Map

| Root ID | Contract truth | System role | Current producer status | Preferred producer seam for runtime | Initial TASK-06 posture |
|---|---|---|---|---|---|
| `qualified_lead_or_enquiry_flow_present` | CAP-05 activation gate activates when at least one channel is producing qualified leads/enquiries; capability contract shortens this to first qualified lead | Capability activation root | No runtime producer today | Add a canonical artifact adapter over `docs/business-os/strategy/<BIZ>/sales-ops.user.md`; optional S10 memo fallback only after a primary parser exists | Implement in TASK-06 as an artifact-backed producer, not from free text |
| `wholesale_accounts_positive` | GTM-3 is mandatory when `wholesale_accounts > 0` | Branch selector, not a capability root | No runtime producer and no canonical source field today | No current machine source. Requires a bounded new structured field in a canonical artifact or explicit deferral | Do not emit in runtime unless TASK-06 also adds a bounded structured source |
| `transaction_data_available` | GTM-4 activates when first transaction data is available; process entry criteria require first non-zero transaction data available | Process prerequisite root | Partial: real metric seam exists, but no milestone emitter yet | Use `growth-metrics-adapter.ts` and `s10-growth-accounting.ts`; derive truth from `activation.orders_count` / `revenue.orders_count` > 0 | Implement first in TASK-06 |
| `repeat_signal_present` | CAP-06 activates at first non-zero repeat/re-booking signal; CX-3 entry criteria require first non-zero repeat signal | Capability activation root and CX-3 prerequisite | No runtime producer today | Add a canonical artifact adapter over `docs/business-os/strategy/<BIZ>/retention.user.md`; optional future numeric seam only if actuals later include repeat/re-booking counts | Implement in TASK-06 as an artifact-backed producer |
| `weekly_cycles_post_launch_gte_4` | CAP-06 backstop after 4 consecutive weekly cycles post-launch | Capability backstop root only | No runtime producer today | Future adapter over machine-written weekly packets or equivalent, but only after a launch-start anchor exists in code | Explicitly defer from initial runtime implementation |

## Current Runtime Truth By Root

### 1. `qualified_lead_or_enquiry_flow_present`

**Contract truth**
- `sales-ops-schema.md`: CAP-05 activates when at least one channel is producing qualified leads/enquiries.
- `marketing-sales-capability-contract.md`: short form is "first qualified lead".

**Runtime truth**
- No file in `scripts/src/startup-loop` currently reads `sales-ops.user.md`.
- No startup-loop script currently emits "qualified lead", "enquiry", or CAP-05 activation as machine state.
- No `sales-ops.user.md` artifacts are present under `docs/business-os/strategy`.

**Decision**
- Keep this root.
- Treat it as contract-backed but producer-missing.
- TASK-06 should add an adapter over the canonical sales-ops artifact path instead of inventing a new event source.

### 2. `wholesale_accounts_positive`

**Contract truth**
- `process-registry-v2.md` and `process-assignment-v2.yaml` state GTM-3 is mandatory when `wholesale_accounts > 0`.

**Runtime truth**
- Repo-wide search shows `wholesale_accounts` exists only in docs and archived planning material.
- There is no current runtime field, artifact parser, queue packet, or startup-loop data model that exposes `wholesale_accounts` as machine-readable state.

**Decision**
- Keep this as a valid contract root, but classify it as a branch selector rather than a capability root.
- Do not claim it is runtime-ready.
- TASK-06 must either add one bounded structured source field or explicitly defer runtime emission of this root.

### 3. `transaction_data_available`

**Contract truth**
- `process-registry-v2.md` says GTM-4 activates when first transaction data is available.
- GTM-4 entry criteria require first non-zero transaction data available.

**Runtime truth**
- `growth-metrics-adapter.ts` already derives and emits:
  - `activation.orders_count`
  - `revenue.orders_count`
- `s10-growth-accounting.ts` already evaluates and persists the resulting weekly growth ledger.
- This is the only audited milestone root with a concrete numeric seam in code today.

**Decision**
- This is the first milestone root that should be implemented in runtime.
- TASK-06 should derive it from the existing metrics path instead of adding another source system.

### 4. `repeat_signal_present`

**Contract truth**
- `retention-schema.md`: CAP-06 activates at first non-zero repeat/re-booking signal.
- `process-registry-v2.md`: CX-3 entry criteria require first non-zero repeat signal.

**Runtime truth**
- No startup-loop script reads `retention.user.md`.
- `growth-metrics-adapter.ts` currently exposes return-rate and referral metrics, not repeat/re-booking counts.
- No repeat/re-booking milestone emitter exists.
- No `retention.user.md` artifacts are present under `docs/business-os/strategy`.

**Decision**
- Keep this root.
- Treat it as contract-backed but producer-missing.
- TASK-06 should add a retention-artifact adapter first; numeric readout support is future optional work, not a prerequisite for the first milestone tranche.

### 5. `weekly_cycles_post_launch_gte_4`

**Contract truth**
- `retention-schema.md` and the capability contract use this as the CAP-06 backstop.

**Runtime truth**
- There is no machine-readable launch-start field in `scripts/src/startup-loop`.
- Weekly packet paths and semantics exist in contracts and `.claude/skills/lp-weekly`, but there is no writer implementation under `scripts/src/startup-loop`.
- No `s10-weekly-packet-*.md` or `s10-weekly-packet-latest.md` artifacts are present under `docs/business-os/strategy`.

**Decision**
- This root is not implementable honestly in the first runtime tranche.
- It must remain contract-only until a launch anchor plus packet/history producer exists in code.
- TASK-06 should explicitly defer it instead of fabricating a proxy.

## Unified Activation Precedence

The current contract conflict is mostly a type confusion problem. The fix is to separate capability roots, branch selectors, and process prerequisites.

### Rule 1: capability roots are not branch selectors

- `qualified_lead_or_enquiry_flow_present` activates CAP-05.
- `wholesale_accounts_positive` does not activate CAP-05.
- `wholesale_accounts_positive` only affects whether GTM-3 becomes mandatory once CAP-05 context exists.

### Rule 2: `transaction_data_available` and `repeat_signal_present` are different roots

- `transaction_data_available` is a GTM-4 prerequisite.
- `repeat_signal_present` is a CAP-06 and CX-3 root.
- They must not be treated as aliases of one another.

### Rule 3: CAP-06 and its child processes need separate activation logic

- **CAP-06 active** when:
  - `repeat_signal_present = true`, or
  - `weekly_cycles_post_launch_gte_4 = true` (contract backstop; deferred in first runtime tranche)

- **GTM-4 active** when:
  - business is post-launch, and
  - `transaction_data_available = true`, and
  - CAP-06 is active

- **CX-3 active** when:
  - business is PMF+, and
  - `repeat_signal_present = true`, and
  - CAP-06 is active

This resolves the apparent CAP-06 / GTM-4 conflict without collapsing the roots together.

### Rule 4: the four-week backstop is capability-only

The `weekly_cycles_post_launch_gte_4` backstop may activate CAP-06 in contract space, but it must not directly activate CX-3 or GTM-4 by itself.

### Rule 5: deferred roots stay deferred

If a root has no producer seam, runtime must mark it as deferred or unavailable. It must not silently fall back to prose interpretation.

## Alias Policy

### Canonical runtime IDs for this feature
- `qualified_lead_or_enquiry_flow_present`
- `wholesale_accounts_positive`
- `transaction_data_available`
- `repeat_signal_present`
- `weekly_cycles_post_launch_gte_4`

### Allowed documentation aliases
- `first qualified lead` -> `qualified_lead_or_enquiry_flow_present`
- `first transaction data available` -> `transaction_data_available`
- `first non-zero repeat/re-booking signal` -> `repeat_signal_present`

### Disallowed as source-of-truth aliases in the first runtime tranche
- `first_sale`
- `first_stockist_live`

These may become higher-level derived names later, but they are not current contract truth and should not be used as root IDs in TASK-06.

## TASK-06 Implementation Boundary

TASK-06 can now proceed without a second discovery pass if it follows this boundary:

1. Implement `transaction_data_available` first from the existing S10 metric seam.
2. Add artifact-backed producer adapters for:
   - `qualified_lead_or_enquiry_flow_present`
   - `repeat_signal_present`
3. Do not emit `wholesale_accounts_positive` unless the task also introduces one bounded structured source field.
4. Explicitly defer `weekly_cycles_post_launch_gte_4` until a launch anchor and machine-written weekly history exist in `scripts/src/startup-loop`.
5. Keep all milestone emission shadow/advisory in the first runtime tranche.

## Opportunities Exposed By This Audit

1. The repo already has enough code to support a real `transaction_data_available` producer without inventing new infrastructure.
2. CAP-05 and CAP-06 already have canonical artifact paths, so artifact-backed producer adapters are the cleanest next seam.
3. The audit exposed one genuine contract design hole: `wholesale_accounts > 0` has no structured source field anywhere in the current runtime.
4. The CAP-06 four-week backstop is currently only prose. That is acceptable as a contract, but not acceptable as a claimed runtime trigger.

## Hard Conclusion

The milestone design is usable, but only if the runtime admits that most roots are still producer-missing. The first implementation wave should be asymmetric:
- one metric-backed root (`transaction_data_available`)
- two artifact-backed roots (`qualified_lead_or_enquiry_flow_present`, `repeat_signal_present`)
- one branch selector that still needs a source (`wholesale_accounts_positive`)
- one explicit defer (`weekly_cycles_post_launch_gte_4`)

Anything broader would optimize on invented state.
