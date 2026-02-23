# assessment-intake-sync — ASSESSMENT Intake Auto-Sync

Called automatically when ASSESSMENT-01–ASSESSMENT-08 precursors are first all complete, or when any precursor has been updated since the last intake sync. Reads ASSESSMENT-01–ASSESSMENT-08 artifacts and writes or refreshes `<BIZ>-intake-packet.user.md`.

This module is **not operator-invoked directly** — it is called by `cmd-start.md` and `cmd-advance.md` as part of the ASSESSMENT-09 Intake contract (`GATE-ASSESSMENT-00`).

---

## Trigger conditions

**First-run** (intake does not yet exist):
- All seven ASSESSMENT completion artifacts are present (see Gate D in `cmd-start.md`)
- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` does NOT exist

**Refresh** (intake exists but a precursor has been updated):
- Intake packet exists with `Precursor-ASSESSMENT-01/02/03/04/06/07/08:` fields in frontmatter
- At least one precursor's frontmatter `Updated` or `Created` date is newer than the corresponding `Precursor-ASSESSMENT-*:` field stored in the intake packet

**No-op** (skip silently):
- Intake exists AND all stored `Precursor-ASSESSMENT-*:` dates match the current precursor frontmatter dates
- Emit: `ASSESSMENT intake sync: UP-TO-DATE — no precursor drift detected.`

---

## Staleness check

```bash
# Step 1 — read current precursor dates from their frontmatter (Updated preferred; Created fallback)
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/problem-statement.user.md
grep -m1 "^Updated:\|^Created:" "$(ls docs/business-os/strategy/<BIZ>/*-solution-profile-results.user.md 2>/dev/null | sort -r | head -1)"
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/solution-select.user.md
grep -m1 "^Updated:\|^Created:\|^Date:" "$(ls docs/business-os/strategy/<BIZ>/*-candidate-names.user.md 2>/dev/null | sort -r | head -1)"
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/distribution-profiling.user.md
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/measurement-profiling.user.md
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/current-situation.user.md

# Step 2 — read stored precursor dates from intake packet frontmatter
grep -E "^Precursor-ASSESSMENT-[0-9]+:" docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md 2>/dev/null
```

If any precursor date is newer than the stored value → drift detected → proceed to sync steps.
If intake packet is absent → first-run → proceed to sync steps.

---

## Sync steps

### Step 1: Read precursors in full

Read and extract from each:

**ASSESSMENT-01 — `problem-statement.user.md`:**
- `## Core Problem` — 1-2 sentence summary for Intake Summary
- `## Affected User Groups` — Group 1 (primary ICP with segment qualifiers), Group 2 (secondary ICP)
- `## Problem Boundary` — In-scope / Out-of-scope (feeds product constraints)
- Frontmatter `Updated`/`Created` date

**ASSESSMENT-02 — latest `*-solution-profile-results.user.md`:**
- Shortlisted option name and 2-3 sentence description
- Frontmatter `Updated`/`Created` date

**ASSESSMENT-03 — `solution-select.user.md`:**
- Selected option name and product scope statement
- Shortlist caveats: regulatory constraints, tether gate, naming status note
- Frontmatter `Updated`/`Created` date

**ASSESSMENT-04 — latest `*-candidate-names.user.md`:**
- Business name status (confirmed / shortlist-returned / unconfirmed)
- Top recommended name from shortlist (for business name field and naming status note)
- Frontmatter `Updated`/`Created`/`Date` date

**ASSESSMENT-06 — `distribution-profiling.user.md`:**
- Section A: channels (feeds intake Section C Channel Packet), channel names, cost/effort estimates, ICP fit rationale
- Section C: priority order of channels (feeds intake Section A execution posture)
- Frontmatter `Updated`/`Created` date

**ASSESSMENT-07 — `measurement-profiling.user.md`:**
- Section A: tracking method (feeds intake Section A execution posture)
- Section B: key metrics (feeds intake Section F Missing-Data if any have feasibility gaps)
- Frontmatter `Updated`/`Created` date

**ASSESSMENT-08 — `current-situation.user.md`:**
- Section A: launch surface, execution posture, primary time constraint, hard stop conditions
- Section B: Product 1 stock status, in-stock date, sellable units, compatibility matrix status
- Section C: pricing model, price range, payment provider, returns policy
- Section D: all channel pre-decisions with decision reference IDs
- Section E: all open evidence gaps (feeds intake Section F)
- Frontmatter `Updated`/`Created` date

### Step 2: Read existing intake (if present)

If intake exists, extract and preserve:
- All Section D rows tagged `observed` with non-ASSESSMENT source evidence
- All Section E (Outcome Contract Reference) content
- All Section G (Priors JSON block) content
- `Owner:` frontmatter field
- `Created:` date (preserve on refresh; only set on first-run)

### Step 3: Write or refresh intake packet

**Output path:** `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md`

**Frontmatter fields — always set/update:**

```yaml
---
Type: Startup-Intake-Packet
Status: Active
Business: <BIZ>
Created: <preserve on refresh; set today on first-run>
Updated: <today>
Last-reviewed: <today>
Owner: <preserve on refresh; set Pete on first-run if unknown>
Precursor-ASSESSMENT-01: <date from problem-statement.user.md>
Precursor-ASSESSMENT-02: <date from solution-profile-results>
Precursor-ASSESSMENT-03: <date from solution-select.user.md>
Precursor-ASSESSMENT-04: <date from candidate-names>
Precursor-ASSESSMENT-06: <date from distribution-profiling.user.md>
Precursor-ASSESSMENT-07: <date from measurement-profiling.user.md>
Precursor-ASSESSMENT-08: <date from current-situation.user.md>
Precursor-sync-date: <today>
Source-ASSESSMENT-01: docs/business-os/strategy/<BIZ>/problem-statement.user.md
Source-ASSESSMENT-02: docs/business-os/strategy/<BIZ>/<date>-solution-profile-results.user.md
Source-ASSESSMENT-03: docs/business-os/strategy/<BIZ>/solution-select.user.md
Source-ASSESSMENT-04: docs/business-os/strategy/<BIZ>/<date>-candidate-names.user.md
Source-ASSESSMENT-06: docs/business-os/strategy/<BIZ>/distribution-profiling.user.md
Source-ASSESSMENT-07: docs/business-os/strategy/<BIZ>/measurement-profiling.user.md
Source-ASSESSMENT-08: docs/business-os/strategy/<BIZ>/current-situation.user.md
---
```

**Section A — Intake Summary (synthesized; update on every sync):**
- Business idea: derived from ASSESSMENT-01 Core Problem + ASSESSMENT-03 selected option
- First product lane: from ASSESSMENT-03 selected option description
- 90-day extension lane: from ASSESSMENT-03 product scope (if present)
- Launch surface: from ASSESSMENT-08 Section A (`Launch surface`)
- Inventory status: from ASSESSMENT-08 Section B (`Product 1 stock status`)
- Execution posture: from ASSESSMENT-08 Section A (`Execution posture` and `Primary time constraint`)
- Channel decision: from ASSESSMENT-06 Section C (primary channel) + ASSESSMENT-08 Section D (decision ref if present)
- Measurement method: from ASSESSMENT-07 Section A (tracking tool)
- Naming status: from ASSESSMENT-04 shortlist status
- Any open caveats from ASSESSMENT-03 (regulatory, tether gate)

**Section B — Business and Product Packet (synthesized; update on every sync):**

| Field | Source |
|---|---|
| Business code | `<BIZ>` |
| Business name | ASSESSMENT-04 top recommended name (or "unconfirmed" if no shortlist) |
| Business name status | ASSESSMENT-04 shortlist status |
| Region | ASSESSMENT-01 Problem Boundary in-scope (geography if stated) or preserve existing |
| Product 1 | ASSESSMENT-03 selected option name |
| Product 1 status | ASSESSMENT-08 Section B (`Product 1 stock status` + `In-stock date`) |
| Product 2 | ASSESSMENT-03 90-day extension scope (if stated) |
| Product constraints | ASSESSMENT-01 Problem Boundary out-of-scope + ASSESSMENT-03 regulatory caveats |

**Section C — ICP and Channel Packet (partially synthesized):**

| Field | Source |
|---|---|
| First-buyer ICP | ASSESSMENT-01 Group 1 (primary) — preserve exact segment description |
| Secondary ICP | ASSESSMENT-01 Group 2 (secondary) |
| Planned channels | ASSESSMENT-06 Section A (distribution plan) + ASSESSMENT-08 Section D (pre-decisions); note decision ref; if absent, leave blank with note "pending S6B" |

**Section D — Constraints and Assumptions Register:**
- On first-run: populate from ASSESSMENT-03 caveats (regulatory, tether gate, naming) AND ASSESSMENT-08 Section A confirmed constraints (execution posture, hard stop conditions)
- On refresh: ADD new items from ASSESSMENT-01/03/06/08 that are not already present; NEVER remove existing rows
- Never overwrite rows tagged `observed` with a non-ASSESSMENT source

**Section E — Outcome Contract Reference:**
- Preserve exactly on refresh
- On first-run: set placeholder pointing to `docs/business-os/contracts/<BIZ>/outcome-contract.user.md`

**Section F — Missing-Data Checklist:**
- On first-run: populate from ASSESSMENT-08 Section E (open evidence gaps) PLUS ASSESSMENT-01 open questions, ASSESSMENT-03 caveats, and ASSESSMENT-07 Section B metrics with feasibility gaps
- On refresh: ADD new gaps from updated precursors; NEVER remove existing items (they may be in progress)
- ASSESSMENT-08 Section E is the primary source — it represents operator-acknowledged gaps

**Section G — Priors (Machine):**
- Preserve exactly on refresh
- On first-run: populate from ASSESSMENT-01 ICP confidence tags and ASSESSMENT-03 caveats

### Step 4: Emit sync report

```
ASSESSMENT intake sync: COMPLETE
  Run type:       [first-run | refresh]
  Precursors:     ASSESSMENT-01 (<date>) | ASSESSMENT-02 (<date>) | ASSESSMENT-03 (<date>) | ASSESSMENT-04 (<date>) | ASSESSMENT-06 (<date>) | ASSESSMENT-07 (<date>) | ASSESSMENT-08 (<date>)
  Drift detected: [list changed precursors, or "none (first-run)"]
  Updated:        [list sections updated, e.g. "A, B, C, D (new rows added), F (new gaps added)"]
  Preserved:      [list operator-locked sections, e.g. "D (observed rows), E, G"]
  Output:         docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md
```

---

## Operator-locked fields (never overwrite on refresh)

Carry-mode classification for all intake packet fields is defined in `docs/business-os/startup-loop/carry-mode-schema.md`. The entries below are the subset of `link`-mode fields that are directly enforced by this sync module. Consult the carry-mode schema for full field-level mapping including lifecycle-phase transition rules.

These fields are `link` mode — they derive from operator direct knowledge or committed decisions, not from ASSESSMENT precursor artifacts, and must never be overwritten by automated refresh:

- Section D rows tagged `observed` with evidence source that is NOT `problem-statement.user.md`, `solution-select.user.md`, `candidate-names`, `distribution-profiling.user.md`, `measurement-profiling.user.md`, or `current-situation.user.md` — **`link` mode** (discriminated by non-ASSESSMENT source tag)
- All of Section E (Outcome Contract Reference) — **`link` mode** from first-run onward
- Channel decision references (`DEC-<BIZ>-CH-*`) — **`link` mode** once a decision reference is recorded in ASSESSMENT-08 Section D; `revision` mode prior to that (see carry-mode-schema.md Section C for per-row transition rules)
- Inventory / stock status fields (stock dates, unit counts) — always sync from ASSESSMENT-08; do not overwrite with stale values
- Pricing architecture decisions — **`link` mode** once recorded
- Payment stack decisions — **`link` mode** once recorded
- Section G (Priors JSON block) — **`link` mode** from first-run onward; preserve exactly; do not merge or overwrite
- Section F item status fields (`in-progress` / `resolved`) — **`link` mode** once set; do not reset to `open` on refresh (see carry-mode-schema.md Section F)

---

## Error handling

| Condition | Action |
|---|---|
| A required precursor file is missing | Log `ASSESSMENT intake sync: SKIPPED — <file> missing. All seven ASSESSMENT-01–ASSESSMENT-08 precursors required.`; do not write partial intake; do not block startup-loop operation |
| Precursor frontmatter date cannot be parsed | Log `ASSESSMENT intake sync: WARNING — could not parse date from <file>; treating as stale`; proceed with sync |
| Intake packet write fails | Log error; surface to operator; do not block startup-loop operation |
