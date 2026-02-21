# discovery-intake-sync — DISCOVERY Intake Auto-Sync

Called automatically when DISCOVERY-01–DISCOVERY-07 precursors are first all complete, or when any precursor has been updated since the last intake sync. Reads DISCOVERY-01–DISCOVERY-07 artifacts and writes or refreshes `<BIZ>-intake-packet.user.md`.

This module is **not operator-invoked directly** — it is called by `cmd-start.md` (Gate D pass-through) and `cmd-advance.md` (GATE-DISCOVERY-00 complete).

---

## Trigger conditions

**First-run** (intake does not yet exist):
- All seven DISCOVERY completion artifacts are present (see Gate D in `cmd-start.md`)
- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` does NOT exist

**Refresh** (intake exists but a precursor has been updated):
- Intake packet exists with `Precursor-DISCOVERY-01/02/03/04/05/06/07:` fields in frontmatter
- At least one precursor's frontmatter `Updated` or `Created` date is newer than the corresponding `Precursor-DISCOVERY-*:` field stored in the intake packet

**No-op** (skip silently):
- Intake exists AND all stored `Precursor-DISCOVERY-*:` dates match the current precursor frontmatter dates
- Emit: `DISCOVERY intake sync: UP-TO-DATE — no precursor drift detected.`

---

## Staleness check

```bash
# Step 1 — read current precursor dates from their frontmatter (Updated preferred; Created fallback)
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/problem-statement.user.md
grep -m1 "^Updated:\|^Created:" "$(ls docs/business-os/strategy/<BIZ>/*-solution-space-results.user.md 2>/dev/null | sort -r | head -1)"
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/s0c-option-select.user.md
grep -m1 "^Updated:\|^Created:\|^Date:" "$(ls docs/business-os/strategy/<BIZ>/*-naming-shortlist.user.md 2>/dev/null | sort -r | head -1)"
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/distribution-plan.user.md
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/measurement-plan.user.md
grep -m1 "^Updated:\|^Created:" docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md

# Step 2 — read stored precursor dates from intake packet frontmatter
grep -E "^Precursor-DISCOVERY-[0-9]+:" docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md 2>/dev/null
```

If any precursor date is newer than the stored value → drift detected → proceed to sync steps.
If intake packet is absent → first-run → proceed to sync steps.

---

## Sync steps

### Step 1: Read precursors in full

Read and extract from each:

**DISCOVERY-01 — `problem-statement.user.md`:**
- `## Core Problem` — 1-2 sentence summary for Intake Summary
- `## Affected User Groups` — Group 1 (primary ICP with segment qualifiers), Group 2 (secondary ICP)
- `## Problem Boundary` — In-scope / Out-of-scope (feeds product constraints)
- Frontmatter `Updated`/`Created` date

**DISCOVERY-02 — latest `*-solution-space-results.user.md`:**
- Shortlisted option name and 2-3 sentence description
- Frontmatter `Updated`/`Created` date

**DISCOVERY-03 — `s0c-option-select.user.md`:**
- Selected option name and product scope statement
- Shortlist caveats: regulatory constraints, tether gate, naming status note
- Frontmatter `Updated`/`Created` date

**DISCOVERY-04 — latest `*-naming-shortlist.user.md`:**
- Business name status (confirmed / shortlist-returned / unconfirmed)
- Top recommended name from shortlist (for business name field and naming status note)
- Frontmatter `Updated`/`Created`/`Date` date

**DISCOVERY-05 — `distribution-plan.user.md`:**
- Section A: channels (feeds intake Section C Channel Packet), channel names, cost/effort estimates, ICP fit rationale
- Section C: priority order of channels (feeds intake Section A execution posture)
- Frontmatter `Updated`/`Created` date

**DISCOVERY-06 — `measurement-plan.user.md`:**
- Section A: tracking method (feeds intake Section A execution posture)
- Section B: key metrics (feeds intake Section F Missing-Data if any have feasibility gaps)
- Frontmatter `Updated`/`Created` date

**DISCOVERY-07 — `s0e-operator-evidence.user.md`:**
- Section A: launch surface, execution posture, primary time constraint, hard stop conditions
- Section B: Product 1 stock status, in-stock date, sellable units, compatibility matrix status
- Section C: pricing model, price range, payment provider, returns policy
- Section D: all channel pre-decisions with decision reference IDs
- Section E: all open evidence gaps (feeds intake Section F)
- Frontmatter `Updated`/`Created` date

### Step 2: Read existing intake (if present)

If intake exists, extract and preserve:
- All Section D rows tagged `observed` with non-DISCOVERY source evidence
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
Precursor-DISCOVERY-01: <date from problem-statement.user.md>
Precursor-DISCOVERY-02: <date from solution-space-results>
Precursor-DISCOVERY-03: <date from s0c-option-select.user.md>
Precursor-DISCOVERY-04: <date from naming-shortlist>
Precursor-DISCOVERY-05: <date from distribution-plan.user.md>
Precursor-DISCOVERY-06: <date from measurement-plan.user.md>
Precursor-DISCOVERY-07: <date from s0e-operator-evidence.user.md>
Precursor-sync-date: <today>
Source-DISCOVERY-01: docs/business-os/strategy/<BIZ>/problem-statement.user.md
Source-DISCOVERY-02: docs/business-os/strategy/<BIZ>/<date>-solution-space-results.user.md
Source-DISCOVERY-03: docs/business-os/strategy/<BIZ>/s0c-option-select.user.md
Source-DISCOVERY-04: docs/business-os/strategy/<BIZ>/<date>-naming-shortlist.user.md
Source-DISCOVERY-05: docs/business-os/strategy/<BIZ>/distribution-plan.user.md
Source-DISCOVERY-06: docs/business-os/strategy/<BIZ>/measurement-plan.user.md
Source-DISCOVERY-07: docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md
---
```

**Section A — Intake Summary (synthesized; update on every sync):**
- Business idea: derived from DISCOVERY-01 Core Problem + DISCOVERY-03 selected option
- First product lane: from DISCOVERY-03 selected option description
- 90-day extension lane: from DISCOVERY-03 product scope (if present)
- Launch surface: from DISCOVERY-07 Section A (`Launch surface`)
- Inventory status: from DISCOVERY-07 Section B (`Product 1 stock status`)
- Execution posture: from DISCOVERY-07 Section A (`Execution posture` and `Primary time constraint`)
- Channel decision: from DISCOVERY-05 Section C (primary channel) + DISCOVERY-07 Section D (decision ref if present)
- Measurement method: from DISCOVERY-06 Section A (tracking tool)
- Naming status: from DISCOVERY-04 shortlist status
- Any open caveats from DISCOVERY-03 (regulatory, tether gate)

**Section B — Business and Product Packet (synthesized; update on every sync):**

| Field | Source |
|---|---|
| Business code | `<BIZ>` |
| Business name | DISCOVERY-04 top recommended name (or "unconfirmed" if no shortlist) |
| Business name status | DISCOVERY-04 shortlist status |
| Region | DISCOVERY-01 Problem Boundary in-scope (geography if stated) or preserve existing |
| Product 1 | DISCOVERY-03 selected option name |
| Product 1 status | DISCOVERY-07 Section B (`Product 1 stock status` + `In-stock date`) |
| Product 2 | DISCOVERY-03 90-day extension scope (if stated) |
| Product constraints | DISCOVERY-01 Problem Boundary out-of-scope + DISCOVERY-03 regulatory caveats |

**Section C — ICP and Channel Packet (partially synthesized):**

| Field | Source |
|---|---|
| First-buyer ICP | DISCOVERY-01 Group 1 (primary) — preserve exact segment description |
| Secondary ICP | DISCOVERY-01 Group 2 (secondary) |
| Planned channels | DISCOVERY-05 Section A (distribution plan) + DISCOVERY-07 Section D (pre-decisions); note decision ref; if absent, leave blank with note "pending S6B" |

**Section D — Constraints and Assumptions Register:**
- On first-run: populate from DISCOVERY-03 caveats (regulatory, tether gate, naming) AND DISCOVERY-07 Section A confirmed constraints (execution posture, hard stop conditions)
- On refresh: ADD new items from DISCOVERY-01/03/05/07 that are not already present; NEVER remove existing rows
- Never overwrite rows tagged `observed` with a non-DISCOVERY source

**Section E — Outcome Contract Reference:**
- Preserve exactly on refresh
- On first-run: set placeholder pointing to `docs/business-os/contracts/<BIZ>/outcome-contract.user.md`

**Section F — Missing-Data Checklist:**
- On first-run: populate from DISCOVERY-07 Section E (open evidence gaps) PLUS DISCOVERY-01 open questions, DISCOVERY-03 caveats, and DISCOVERY-06 Section B metrics with feasibility gaps
- On refresh: ADD new gaps from updated precursors; NEVER remove existing items (they may be in progress)
- DISCOVERY-07 Section E is the primary source — it represents operator-acknowledged gaps

**Section G — Priors (Machine):**
- Preserve exactly on refresh
- On first-run: populate from DISCOVERY-01 ICP confidence tags and DISCOVERY-03 caveats

### Step 4: Emit sync report

```
DISCOVERY intake sync: COMPLETE
  Run type:       [first-run | refresh]
  Precursors:     DISCOVERY-01 (<date>) | DISCOVERY-02 (<date>) | DISCOVERY-03 (<date>) | DISCOVERY-04 (<date>) | DISCOVERY-05 (<date>) | DISCOVERY-06 (<date>) | DISCOVERY-07 (<date>)
  Drift detected: [list changed precursors, or "none (first-run)"]
  Updated:        [list sections updated, e.g. "A, B, C, D (new rows added), F (new gaps added)"]
  Preserved:      [list operator-locked sections, e.g. "D (observed rows), E, G"]
  Output:         docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md
```

---

## Operator-locked fields (never overwrite on refresh)

These fields derive from operator direct knowledge, not from DISCOVERY-01–DISCOVERY-07 artifacts:

- Section D rows tagged `observed` with evidence source that is NOT `problem-statement.user.md`, `s0c-option-select.user.md`, `naming-shortlist`, `distribution-plan.user.md`, `measurement-plan.user.md`, or `s0e-operator-evidence.user.md`
- All of Section E (Outcome Contract Reference)
- Channel decision references (`DEC-<BIZ>-CH-*`) — unless being refreshed from an updated DISCOVERY-07 Section D
- Inventory / stock status fields (stock dates, unit counts) — always sync from DISCOVERY-07; do not overwrite with stale values
- Pricing architecture decisions
- Payment stack decisions
- Section G (Priors JSON block) — preserve exactly; do not merge or overwrite

---

## Error handling

| Condition | Action |
|---|---|
| A required precursor file is missing | Log `DISCOVERY intake sync: SKIPPED — <file> missing. All seven DISCOVERY-01–DISCOVERY-07 precursors required.`; do not write partial intake; do not block startup-loop operation |
| Precursor frontmatter date cannot be parsed | Log `DISCOVERY intake sync: WARNING — could not parse date from <file>; treating as stale`; proceed with sync |
| Intake packet write fails | Log error; surface to operator; do not block startup-loop operation |
