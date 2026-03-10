---
Type: Note
Status: Active
Domain: Platform
Last-reviewed: 2026-03-10
Relates-to:
  - /Users/petercowling/base-shop/docs/plans/_archive/startup-loop-results-review-queue-unification/plan.md
---

# Historical Carry-Over Audit

## Scope

This audit answers one narrow question:

- can the legacy archive-backed idea backlog be cut over inside the current thread without keeping a hidden second backlog rail alive

The live path is already in place:

- active build-origin ideas now enter `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- `docs/business-os/_data/process-improvements.json` now surfaces queue-backed build-origin items only
- the remaining gap is historical archive carry-over

## Method

### Archive inventory

- Archived `results-review.user.md` files: `214`
- Archived `results-review.signals.json` files: `65`
- Archived `pattern-reflection.entries.json` files: `63`

### Machine-readable idea surface

- Archived `results-review.signals.json` files with recognizable `items[]` idea rows: `8`
- Raw results-review idea rows: `12`
- Archived `pattern-reflection.entries.json` files contributing candidate rows: `6`
- Raw pattern-reflection candidate rows: `10`

### Current live-path sample

- Active queue-backed idea items in `process-improvements.json`: `22`
- Active queue-backed build-origin idea items in `process-improvements.json`: `3`

This matters because the current backlog path is no longer the problem. The remaining problem is legacy carry-over only.

## Structural Findings

### 1. Archive carry-over is not deterministic against the canonical contract

None of the archived candidate rows carry the canonical fields required by the new bridge:

- `build_signal_id`
- `recurrence_key`
- `build_origin_status`

The archived sidecars are still legacy-shape artifacts. A repo audit over the archived candidate set found `0` canonical `build_signal_id` values and `0` archive candidates that already satisfy the current bridge-ready contract.

### 2. Raw machine rows overstate the true candidate count

The archive produces `15` raw candidate rows once both sidecar types are read together, but that count is inflated by legacy cross-source title drift:

- `brikette-staging-upload-speed` contributes two ideas twice because `pattern-reflection` stores truncated summaries while `results-review.signals` stores full titles
- `reception-date-selector-unification` has the same split between truncated and full title forms

After human normalization of those source-level duplicates, the archive surface is `12` thematic candidates, not `15`.

### 3. Current live backlog does not preserve archive context automatically

None of the `12` normalized archive candidates has an exact current queue-title match, and none maps to a persisted canonical `build_origin.build_signal_id`.

That means carry-over is not a replay of the new bridge over old data. It is a fresh triage problem.

## Worthwhile-Item Criteria

An archived candidate is worth carrying forward only if all of the following are true:

1. The underlying problem is still unresolved in current code or standing process.
2. The candidate is still specific enough to become a real queue item without inventing missing evidence.
3. The candidate is not already superseded by a later plan, later automation, or an explicit “moot” outcome.
4. The candidate is not merely a restatement of the work already completed by this queue-unification thread.

If any of those fail, the item should not be carried into the queue.

## Candidate Audit

| Candidate | Source evidence | Current repo state | Classification | Deterministic carry-forward | Manual judgment required |
|---|---|---|---|---|---|
| Build artifact caching for staging | `docs/plans/_archive/brikette-staging-upload-speed/results-review.signals.json`, `docs/plans/_archive/brikette-staging-upload-speed/pattern-reflection.entries.json` | The archived build shows staging fell from `37m` to about `5m`, but no current queue item or follow-on plan exists for caching specifically. Repo search finds general GitHub caching use, but no carry-over mapping for this plan’s staging-specific observation. | Worthwhile candidate | No | Yes |
| Chunk count monitoring for Brikette staging | `docs/plans/_archive/brikette-staging-upload-speed/results-review.signals.json`, `docs/plans/_archive/brikette-staging-upload-speed/pattern-reflection.entries.json` | No current queue-backed follow-on exists. The idea is still plausible, but its value depends on whether the staging upload bottleneck is still strategically relevant after the earlier speed win. | Worthwhile candidate | No | Yes |
| Divergence detection for app-nav dual sources | `docs/plans/_archive/reception-appnav-dual-source/results-review.signals.json` | The source artifact itself says the divergence is “now moot since divergences are eliminated”. | Do not carry forward | No | No |
| Extract shared PIN digit colour array into a single constant | `docs/plans/_archive/reception-component-token-compliance/results-review.signals.json`, `docs/plans/_archive/reception-component-token-compliance/pattern-reflection.entries.json` | `apps/reception/src/components/common/PinInput.tsx` and `apps/reception/src/components/common/PinLoginInline.tsx` still each define `PIN_BG_CLASSES` separately. | Worthwhile candidate | No | Yes |
| Duplicate component detection before drift compounds | `docs/plans/_archive/reception-date-selector-unification/results-review.signals.json`, `docs/plans/_archive/reception-date-selector-unification/pattern-reflection.entries.json` | Current repo search finds the archived finding and later references to duplicate-component risk, but no actual detector or lint/analysis tool implementing it. | Worthwhile candidate | No | Yes |
| Schedule Gmail In-Progress reconciliation outside the agent loop | `docs/plans/_archive/reception-inbox-inprogress-recovery/results-review.signals.json`, `docs/plans/_archive/reception-inbox-inprogress-recovery/pattern-reflection.entries.json` | Later work in `docs/plans/gmail-guard-hardening/plan.md` wires `gmail_reconcile_in_progress` into ops-inbox preflight, which resolves the practical “operator must remember to run it” problem even though it is not a cron-only path. | Superseded by later work | No | No |
| Add a post-deploy recovery telemetry review checkpoint | `docs/plans/_archive/reception-inbox-inprogress-recovery/results-review.signals.json`, `docs/plans/_archive/reception-inbox-inprogress-recovery/pattern-reflection.entries.json` | `inbox_recovery` telemetry exists, but repo search finds no standing review checkpoint or standing artifact consumer for it. | Worthwhile candidate | No | Yes |
| Add a standing ops feed for inbox recovery outcomes | `docs/plans/_archive/reception-inbox-inprogress-recovery/results-review.signals.json`, `docs/plans/_archive/reception-inbox-inprogress-recovery/pattern-reflection.entries.json` | Recovery telemetry exists in code and build artifacts, but there is no standing feed artifact or queue-backed downstream consumer for those outcomes. | Worthwhile candidate | No | Yes |
| Mechanize contrast pre-verification before token edits | `docs/plans/_archive/reception-theme-dark-mode-base-tokens/results-review.signals.json` | `scripts/validate-changes.sh` now runs `pnpm run tokens:contrast:check` on relevant changes, so the main guardrail is already mechanized. | Resolved by later guardrail work | No | No |
| Build-record structured extraction | `docs/plans/_archive/startup-loop-structured-sidecar-introduction/results-review.signals.json`, `docs/plans/_archive/startup-loop-structured-sidecar-introduction/pattern-reflection.entries.json` | `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` and per-plan `build-event.json` now exist as the machine-readable build-record companion path. | Resolved by later build-event work | No | No |
| Post-authoring sidecar extraction as reusable loop process | `docs/plans/_archive/startup-loop-structured-sidecar-introduction/results-review.signals.json`, `docs/plans/_archive/startup-loop-structured-sidecar-introduction/pattern-reflection.entries.json` | The sidecar extraction pattern was already implemented and this current queue-unification thread is the direct downstream carry of that capability. | Resolved / superseded by current thread | No | No |
| Split parity-completion checkpoint from runtime-cleanup migration | `docs/plans/_archive/xa-uploader-cloud-parity-completion/results-review.signals.json`, `docs/plans/_archive/xa-uploader-cloud-parity-completion/pattern-reflection.entries.json` | The archived plan itself already narrowed parity to currency-rate persistence and explicitly recorded remaining local-FS branches as separate environment-support paths in `cloud-parity-matrix.md` and `build-record.user.md`. | Resolved by source plan | No | No |

## Carry-Forward Summary

### Raw archive surface

- Raw candidate rows across both sidecar types: `15`
- Human-normalized thematic candidates: `12`

### Worthwhile unresolved candidates

- Count: `6`
- Items:
  - Build artifact caching for staging
  - Chunk count monitoring for Brikette staging
  - Extract shared PIN digit colour array into a single constant
  - Duplicate component detection before drift compounds
  - Add a post-deploy recovery telemetry review checkpoint
  - Add a standing ops feed for inbox recovery outcomes

### Determinism and judgment load

- Deterministically mappable to the canonical build-origin contract: `0 / 6`
- Manual-judgment-required: `6 / 6`

Why manual judgment is unavoidable:

- archive rows do not carry canonical `build_signal_id`
- several rows are product- or workflow-specific and need new slugs, routing, and scope decisions
- at least two source pairs require human title normalization because the archived `pattern-reflection` summary is truncated

## Effort Estimate

If this were carried in-thread anyway, the work would not be a simple queue replay:

- audit-to-queue mapping for 6 worthwhile candidates
- deterministic-vs-manual intake decision per item
- new queue packet authoring and evidence stitching for each carried item
- explicit handling of 6 discarded/superseded candidates so the cutover remains auditable

That is a separate bounded project, not a tail-end cleanup step.

## Recommendation For TASK-09

Choose the split path.

Reason:

- the archive surface exceeds the in-thread deterministic threshold on raw thematic count (`12 > 10`)
- the worthwhile remainder still has `manual-judgment-required = 6`
- deterministic carry-forward to the canonical build-origin contract is `0`

So the honest end state for this thread is:

- keep the live backlog canonical on queue
- do not resurrect legacy reads
- emit a dedicated historical carry-over project for the six worthwhile unresolved items
