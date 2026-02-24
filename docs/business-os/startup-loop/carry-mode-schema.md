---
Type: Architecture-Contract
Status: Active
Feature-Slug: startup-loop-standing-info-gap-analysis
Created: 2026-02-22
Last-updated: 2026-02-22
Owner: startup-loop maintainers
Related-plan: docs/plans/startup-loop-standing-info-gap-analysis/plan.md
Related-contract: docs/business-os/startup-loop/two-layer-model.md
Related-skill: .claude/skills/startup-loop/modules/assessment-intake-sync.md
---

# Carry-Mode Schema

This document defines the `link` and `revision` carry modes for startup loop standing fields, and provides a field-level classification table covering the intake packet sections that are populated and managed by the ASSESSMENT intake auto-sync process (Sections C through G). It is cross-referenced by `assessment-intake-sync.md` and by the two-layer architecture contract (`two-layer-model.md`).

---

## Mode Definitions

### `link` mode

A field in `link` mode holds a **pointer to a source artifact** (a file path, a decision reference ID, or a frontmatter key in another document). The field is populated once — at first-run or when the source artifact is formally committed — and is **never overwritten by a refresh cycle**.

Refresh cycles that touch `link`-mode fields must treat them as read-only. The only permitted write operation is a formal re-lock: when the operator explicitly updates the source artifact and wishes to update the pointer, the operator must manually amend the field and record a `Revised:` date alongside it. Automated intake sync must never overwrite a `link`-mode field.

Key characteristics:
- Points to, rather than duplicates, the source of truth.
- Stable across refresh cycles; versioned only by explicit operator action.
- Appropriate for fields whose values represent committed decisions, signed-off artifacts, or operator-confirmed positions that would be corrupted by automated overwrite.

### `revision` mode

A field in `revision` mode holds a **living value** that is updated on each applicable refresh cycle. When a precursor artifact (ASSESSMENT-01 through ASSESSMENT-08) is updated and drift is detected, all `revision`-mode fields derived from that precursor are recalculated and overwritten in the intake packet.

Key characteristics:
- Overwritten on every refresh cycle where the precursor date has advanced.
- Reflects the current state of the source artifact at sync time.
- Appropriate for fields that are expected to evolve as the business assessment matures (e.g. ICP description, channel list, evidence gaps).

---

## Lifecycle-Phase Transitions

Some fields begin their life in `revision` mode (during early ASSESSMENT stages) and transition to `link` mode after a formal gate. Once a field transitions to `link` mode it must not revert to `revision` mode unless the operator explicitly unlocks it.

The standard transition gate is **ASSESSMENT-09** (`GATE-ASSESSMENT-00`). When the intake packet is first written at ASSESSMENT-09, fields that have reached their final committed state are locked to `link` mode. Fields that are still expected to evolve into later stages remain in `revision` mode beyond ASSESSMENT-09.

Per-field transition notes are included in the classification table below.

---

## Field-Level Classification: Intake Packet Sections C–G

The following table covers all fields written or managed by `assessment-intake-sync.md`. Sections A and B are included for completeness as baseline context; Section C through G are the primary scope of this schema.

### Section A — Intake Summary (synthesized)

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| Business idea | revision | ASSESSMENT-01 Core Problem + ASSESSMENT-03 selected option | Transitions to `link` at ASSESSMENT-09 gate when product scope is committed |
| First product lane | revision | ASSESSMENT-03 selected option description | Transitions to `link` at ASSESSMENT-09 gate |
| 90-day extension lane | revision | ASSESSMENT-03 product scope (if present) | Transitions to `link` at ASSESSMENT-09 gate |
| Launch surface | revision | ASSESSMENT-08 Section A | Transitions to `link` after operator confirms hard stop conditions |
| Inventory status | revision | ASSESSMENT-08 Section B | Remains `revision` — stock status changes frequently |
| Execution posture | revision | ASSESSMENT-08 Section A | Transitions to `link` at ASSESSMENT-09 gate |
| Channel decision | link (after ASSESSMENT-08 Section D decision ref is written) | ASSESSMENT-06 Section C + ASSESSMENT-08 Section D | `revision` until ASSESSMENT-08 Section D decision reference (DEC-BIZ-CH-*) is recorded; `link` thereafter |
| Measurement method | revision | ASSESSMENT-07 Section A | Transitions to `link` at ASSESSMENT-09 gate |
| Naming status | revision | ASSESSMENT-04 shortlist status | Remains `revision` until name is confirmed; transitions to `link` on name confirmation |
| Open caveats | revision | ASSESSMENT-03 (regulatory, tether gate) | Remains `revision` until each caveat is resolved or accepted |

### Section B — Business and Product Packet

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| Business code | link | Assigned at business creation | Set once; never overwritten |
| Business name | revision | ASSESSMENT-04 top recommended name | Transitions to `link` when name is confirmed and domain is registered |
| Business name status | revision | ASSESSMENT-04 shortlist status | Remains `revision` until name is confirmed |
| Region | revision | ASSESSMENT-01 Problem Boundary | Transitions to `link` at ASSESSMENT-09 gate if region is committed |
| Product 1 | revision | ASSESSMENT-03 selected option name | Transitions to `link` at ASSESSMENT-09 gate |
| Product 1 status | revision | ASSESSMENT-08 Section B | Remains `revision` — stock dates and status change frequently |
| Product 2 | revision | ASSESSMENT-03 90-day extension scope | Transitions to `link` at ASSESSMENT-09 gate |
| Product constraints | revision | ASSESSMENT-01 Problem Boundary out-of-scope + ASSESSMENT-03 regulatory | Transitions to `link` at ASSESSMENT-09 gate for committed constraints |

### Section C — ICP and Channel Packet

Section C is the primary scope per TASK-05.

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| First-buyer ICP | revision | ASSESSMENT-01 Group 1 (primary) | Refreshed on each ASSESSMENT-01 update. Transitions to `link` at ASSESSMENT-09 gate when ICP definition is committed. Operator may lock early if ICP research is complete. |
| Secondary ICP | revision | ASSESSMENT-01 Group 2 (secondary) | Same transition policy as First-buyer ICP. |
| Planned channels | link (per decision ref) | ASSESSMENT-06 Section A + ASSESSMENT-08 Section D | Each channel entry is `revision` until ASSESSMENT-08 Section D records a decision reference (DEC-BIZ-CH-*). Once a decision ref is present, that channel row becomes `link`. New channels added by ASSESSMENT-08 refresh are appended; existing `link`-mode rows are never overwritten. |

**Rationale for Section C:** ICP descriptions are expected to be refined as assessment progresses, warranting `revision` mode during ASSESSMENT. Channel decisions are formally committed via decision references in ASSESSMENT-08, warranting `link` mode once recorded. The hybrid approach within Planned Channels (per-row mode based on decision-ref presence) prevents automated sync from overwriting operator-confirmed channel commitments while still allowing new channel rows to be appended.

### Section D — Constraints and Assumptions Register

Section D applies hybrid carry-mode rules per row, not per section.

| Row Type | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| Rows sourced from ASSESSMENT-01/03/06/08 | revision | ASSESSMENT artifacts | Refreshed when source precursor is updated. New rows appended; existing rows never removed, only amended if source artifact changes the underlying constraint. |
| Rows tagged `observed` with non-ASSESSMENT source | link | Operator direct knowledge (external observations, customer conversations, legal review, etc.) | These rows are operator-locked. Automated sync must never overwrite or remove them. The non-ASSESSMENT source tag is the carry-mode discriminator: presence of a non-ASSESSMENT source = `link` mode for that row. |

**Rationale for Section D:** The register accumulates constraints over time. ASSESSMENT-sourced rows are living values that update as artifacts evolve; they carry `revision` mode. Observed constraints represent operator knowledge that has no ASSESSMENT artifact backing; they carry `link` mode to prevent accidental loss during automated refresh.

### Section E — Outcome Contract Reference

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| All of Section E | link | Operator-authored; points to `docs/business-os/contracts/<BIZ>/outcome-contract.user.md` | Set as a placeholder pointer on first-run. Never overwritten by automated sync. Operator updates the contract document directly; the pointer remains stable. This section is fully `link` mode from first-run onward. |

**Rationale for Section E:** The outcome contract is a committed, operator-signed artifact. Automated sync has no basis for modifying contract references. The pointer is the reference; the contract content is managed in its own file.

### Section F — Missing-Data Checklist

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| Evidence gap items (from ASSESSMENT-08 Section E) | revision | ASSESSMENT-08 Section E open evidence gaps | New gaps appended on each sync; existing items never removed (they may be in progress). An item's status field (`open` / `in-progress` / `resolved`) is `link`-mode once set to `in-progress` or `resolved` — automated sync must not reset status. The gap description itself is `revision` (updated if the precursor artifact refines the gap statement). |
| Evidence gap items (from ASSESSMENT-01/03/07) | revision | ASSESSMENT-01 open questions, ASSESSMENT-03 caveats, ASSESSMENT-07 feasibility gaps | Same append-only, status-preserving policy as ASSESSMENT-08 items. |

**Rationale for Section F:** The missing-data checklist grows over time and must not shrink. Items are opened by automated sync (revision mode for gap creation) but their resolution lifecycle is operator-controlled (link mode for status fields once progressed). This dual treatment within Section F prevents sync from resurrecting resolved gaps or overwriting in-progress tracking.

### Section G — Priors (Machine)

| Field | Carry Mode | Source | Transition Notes |
|---|---|---|---|
| All of Section G (JSON block) | link | ASSESSMENT-01 ICP confidence tags + ASSESSMENT-03 caveats (first-run seed); subsequently machine-updated by loop runtime | Set on first-run from ASSESSMENT artifacts. After first-run, this block is maintained exclusively by machine processes (S10 weekly readout, loop runtime). Automated intake sync must preserve it exactly — neither merge nor overwrite. The block transitions to full `link` mode at first-run and remains so for the lifetime of the intake packet. |

**Rationale for Section G:** Priors are probabilistic estimates maintained by the loop runtime. Intake sync has no authority to overwrite machine-computed priors. Any automated overwrite risks corrupting experiment and decision baselines accumulated since first-run.

---

## Summary: Carry-Mode by Section

| Section | Default Mode | Exceptions / Sub-field Overrides |
|---|---|---|
| A — Intake Summary | revision | Channel decision and measurement method transition to `link` after ASSESSMENT-09 gate |
| B — Business and Product Packet | revision | Business code is permanently `link`; name/region/products transition to `link` at ASSESSMENT-09 gate |
| C — ICP and Channel Packet | revision | Planned channels per-row: `link` once a decision reference is recorded |
| D — Constraints and Assumptions Register | revision (ASSESSMENT rows) / link (observed rows) | Discriminated by `observed` tag and non-ASSESSMENT source evidence |
| E — Outcome Contract Reference | link | Fully `link` from first-run onward |
| F — Missing-Data Checklist | revision (gap creation) / link (status once progressed) | Status field (`in-progress` / `resolved`) is `link` once set; gap text is `revision` |
| G — Priors (Machine) | link | Fully `link` from first-run onward; maintained by loop runtime only |

---

## Usage by Automated Sync

When `assessment-intake-sync.md` executes a refresh cycle, it must apply carry-mode rules in the following order:

1. **Identify `link`-mode rows/sections** using the discriminators above (decision ref present, `observed` tag, Section E/G boundaries, in-progress/resolved status flags). These are never overwritten.
2. **Identify `revision`-mode fields** as all remaining fields sourced from ASSESSMENT-01–ASSESSMENT-08 precursors with drift detected.
3. **Apply revision writes** only to `revision`-mode fields. Do not touch `link`-mode fields.
4. **Append new items** (Section D rows, Section F gaps) without removing existing items.
5. **Record transition** when a `revision`-mode field becomes `link` (e.g. when a decision reference is added to a channel row). The transition must be recorded by the operator, not assumed by the sync process.

---

## Relationship to Two-Layer Model

This schema implements the carry-mode semantics stated in `two-layer-model.md` (Layer A, Lifecycle and Staleness section):

> `link` mode: the field points to a source artifact path and is never overwritten by a refresh cycle.
> `revision` mode: the field is updated on each applicable refresh cycle.

The field-level classification in this document is authoritative for the ASSESSMENT intake packet. Standing domain packs (market-pack, sell-pack, product-pack, logistics-pack) will define their own carry-mode tables following the same `link`/`revision` taxonomy when those artifacts are specified in subsequent tasks.
