# GA4 Governance Runbook — Brikette Funnel Reduction

**Status:** Active
**Owner (all lanes):** Pete
**Cadence:** Weekly, Monday morning
**Last updated:** 2026-02-17
**Property:** `properties/474488225`
**Web stream:** `properties/474488225/dataStreams/10183287178` (`G-2ZSYXG8R7T`)

---

## 1. Ownership and Cadence

| Lane | Owner | Backup | Cadence |
|---|---|---|---|
| Analytics / admin | Pete | — | Weekly Monday morning |
| Engineering (instrumentation) | Pete | — | Weekly Monday morning |
| Ops / reconciliation | Pete | — | Weekly Monday morning |

**Weekly review format:**
- Pull the GA4 funnel question set (Section 4) via `ga4-run-report.ts` commands.
- Compare handoff trend vs prior week.
- Run Octorate export if reconciliation window is new.
- Record observations + action items in `docs/plans/brikette-octorate-funnel-reduction/reconciliation-ops-pack.md` (once created by TASK-09).
- Escalate if any threshold miss is detected (Section 6).

---

## 2. Event Taxonomy

### 2.1 Canonical Handoff Event

| Field | Value | Notes |
|---|---|---|
| Event name | `handoff_to_engine` | Canonical. Native emission via `fireHandoffToEngine` / `fireHandoffToEngineAndNavigate` (TASK-05A). |
| `handoff_mode` | `same_tab` \| `new_tab` | Required. `new_tab` deprecated after TASK-03 normalization completes. |
| `engine_endpoint` | `result` \| `confirm` | Required. `result` is default; `confirm` only when room/rate context is deterministic. |
| `checkin` | `YYYY-MM-DD` | Required. |
| `checkout` | `YYYY-MM-DD` | Required. |
| `pax` | integer | Required. |
| `source` | string | Optional. Surface or campaign source. |
| `transport_type` | `beacon` | Always present. Ensures event survives same-tab navigation. |

### 2.2 Compatibility Event (Migration Window Only)

| Event name | Status | Notes |
|---|---|---|
| `begin_checkout` | Compat only — fires without beacon during migration window | Remove after TASK-05B cleanup |
| `search_availability` | Compat — fires in `Booking2Modal` no-room path | Keep for search-intent signal; not a booking handoff signal |

### 2.3 Key / Conversion Events (GA4 Admin as of 2026-02-17)

| Event | Key event? | Conversion? | Owner rationale |
|---|---|---|---|
| `handoff_to_engine` | ✓ (added 2026-02-17) | No — do not mark as conversion yet (see note) | Primary funnel measurement event |
| `begin_checkout` | ✓ | ✓ | Compat; conversion designation inherited from pre-migration config |
| `click_whatsapp` | ✓ | ✓ | High-intent contact action |
| `click_check_availability` | ✓ | ✓ | Pre-handoff intent signal |
| `purchase` | ✓ | ✓ | Reserved; unobservable from current web-only instrumentation |

> **Note on `handoff_to_engine` conversion designation:** Do not mark `handoff_to_engine` as a conversion event yet. During the migration window while `begin_checkout` compat is active, dual-event counting would inflate conversion numbers. Designate `handoff_to_engine` as the primary conversion event after TASK-05B cleanup confirms no double-counting.

### 2.4 Admin-Created Event Rules (as of 2026-02-17)

Two stream-level create rules map legacy events into `handoff_to_engine` for continuity during migration:

| Rule ID | Source event | Created event | Mutations |
|---|---|---|---|
| `eventCreateRules/13623175772` | `begin_checkout` | `handoff_to_engine` | `handoff_mode=unknown`, `handoff_stage=pre_checkout`, `engine_endpoint=unknown`, `legacy_event=begin_checkout` |
| `eventCreateRules/13623239459` | `search_availability` | `handoff_to_engine` | `handoff_mode=unknown`, `handoff_stage=pre_checkout`, `engine_endpoint=result`, `legacy_event=search_availability` |

> **Important:** These create-rule-derived events are supplementary. They were the sole source of `handoff_to_engine` prior to TASK-05A. After TASK-05A native emission is deployed, the native events will carry accurate `handoff_mode` and `engine_endpoint` values. Create-rule-derived events can be identified by `handoff_mode=unknown`. Do **not** remove the create rules until native emission is confirmed stable in standard reporting windows.

### 2.5 Custom Dimensions (as of 2026-02-17)

Registered on stream `properties/474488225/dataStreams/10183287178`:

`handoff_mode`, `engine_endpoint`, `handoff_stage`, `legacy_event`, `checkin`, `checkout`, `pax`

---

## 3. Admin Configuration State

### 3.1 Cross-Domain Linking

**Current state (2026-02-17):** Not configured. GA4 diagnostics shows "Additional domains detected for configuration" with suggestions for `hostel-positano.com` and `brikette-website.pages.dev`.

**Required action (pending):**
- Add `hostel-positano.com` and `brikette-website.pages.dev` to the cross-domain include list in GA4 Tag Settings → Configure your domains.
- Rationale: prevents referral self-attribution when users navigate between apex, preview, and Octorate domains within a session.
- Owner: Pete (analytics lane).

### 3.2 Unwanted Referrals (Referral Exclusions)

**Current state (2026-02-17):** Empty — no domains configured.

**Required action (pending):**
- Add `book.octorate.com` as an unwanted referral. Octorate checkout redirects back to `hostel-positano.com` on completion; without exclusion, this generates spurious referral sessions and breaks the funnel continuity view.
- Owner: Pete (analytics lane).

### 3.3 Internal Traffic Filtering

**Current state:** Not explicitly configured in this review.

**Required action (pending):**
- Confirm whether Pete's own sessions (or staging sessions from `brikette-website.pages.dev`) need an internal traffic definition.
- Recommended: define IP/hostname-based internal filter and exclude from operational KPI views.
- Owner: Pete (analytics lane).

### 3.4 Untagged Pages Diagnostics

**Current state (2026-02-17):** Two active issues:
1. "Some of your pages are not tagged" — dominated by preview-domain entries (`8a8eb612.brikette-website.pages.dev`) and non-canonical legacy multilingual paths.
2. "Additional domains detected for configuration" — see §3.1.

**Interpretation:** These diagnostics include stale/crawler-artifact entries and do not represent a systematic gap in canonical production coverage. Action is to configure cross-domain (§3.1) and then re-assess residual entries.

---

## 4. Weekly Funnel Question Set

The following questions must be answerable from documented report surfaces each Monday morning.

### Q1: What is the handoff trend this week vs last week?

```bash
# Current week (adjust dates each Monday)
pnpm exec tsx scripts/src/brikette/ga4-run-report.ts \
  --window <YYYY-MM-DD>..<YYYY-MM-DD> \
  --events handoff_to_engine,begin_checkout,search_availability,page_view

# Prior week (for comparison)
pnpm exec tsx scripts/src/brikette/ga4-run-report.ts \
  --window <YYYY-MM-DD>..<YYYY-MM-DD> \
  --events handoff_to_engine,begin_checkout,search_availability,page_view
```

**Interpret:** Compare `handoff_to_engine` count week-over-week. Flag if drop >15% vs prior week without a known traffic-volume confound (e.g. campaign pause, seasonality).

**Consent caveat:** GA4 Data API reports use the blended modeled view (includes modeled data for consented + unconsented users where available). State this explicitly in any decision memo that cites these numbers.

### Q2: What is the booking-like 404 trend?

```bash
# Cloudflare top-404 rollup (requires CLOUDFLARE_API_TOKEN in .env.local)
pnpm brik:export-cloudflare-proxies \
  --zone-name hostel-positano.com \
  --hostname hostel-positano.com \
  --months 1 \
  --output .tmp/cloudflare-top-404-<YYYY-MM-DD>.json

# Then filter booking-like paths manually from output:
# /book, /{lang}/book, /{lang}/rooms, /{lang}/apartment/book, /{lang}/deals
```

**Interpret:** Booking-like 404 count should trend toward zero after TASK-02 redirect rollout. Flag any new path cluster not covered by existing redirect map.

### Q3: What is the reconciliation lag (Octorate export vs GA4 handoff)?

- Run weekly Octorate export (manual download from Octorate admin panel → Save to `.tmp/reconciliation-<window>/`).
- Run `packages/mcp-server/octorate-process-bookings.mjs` on the export.
- Compare daily booking totals vs GA4 `handoff_to_engine` counts for the same window.

**Interpret:** Until TASK-09 reconciliation ops pack is live, record lag manually:
- `GA4 handoff count / Octorate booking count` = gross coverage ratio (target ≥ 95% of Octorate bookings explained by same-day GA4 handoff events once native emission is deployed).

---

## 5. Consent Reporting Rules

All operational KPI decisions must state which view was used:

| View | When to use | How to obtain |
|---|---|---|
| **Consented-only deterministic** | For precision-sensitive claims (e.g. A/B test outcomes, individual event validation) | GA4 Explorations with "Include all users" disabled; filter by `consent_state=granted` dimension where available |
| **Blended modeled (default)** | For weekly trend reading and operational decisions | GA4 Data API / standard reports (default) — includes modeled data for non-consenting users |

**Rule:** Every decision memo or weekly review note must include one of:
- `[Blended modeled view — includes consent-estimated data]`
- `[Consented-only view — excludes modeled data for non-consenting users]`

**Current default:** Use blended modeled view for weekly trend reads. Note explicit that Consent Mode v2 default-deny is active; absolute counts understate true traffic.

---

## 6. Escalation Policy

### Thresholds

| Signal | Threshold | Action |
|---|---|---|
| `handoff_to_engine` week-over-week drop | ≥ 15% without known confound | Investigate immediately; check instrumentation, redirect loop, CTA rendering |
| Booking-like 404 count | New cluster ≥ 10 URLs not in redirect map | Add to redirect map candidate backlog within same week |
| Reconciliation coverage | `GA4 handoff / Octorate bookings < 60%` | Escalate to TASK-08 calibration; check for export processing gap or GA4 event persistence failure |
| Reconciliation lag | Export not processed within 3 days of close of week | Flag in Decision Log; identify whether export was missed or processing script failed |

### Escalation path

Pete is the sole owner for all lanes. If a threshold is missed:
1. Record in this week's Decision Log entry.
2. Open a new task in the plan (or replan if it blocks downstream work).
3. Do not mark the weekly review as complete until the escalation is acknowledged and actioned or explicitly deferred with a rationale note.

---

## 7. VC Checklist (VC-01)

Use this checklist for the VC-01 reviewer pass:

- [ ] Owner named for each lane (Section 1)
- [ ] Weekly cadence documented (day, time, evidence destination)
- [ ] Canonical event (`handoff_to_engine`) defined with all required params (Section 2.1)
- [ ] Compat events (`begin_checkout`, `search_availability`) policy documented with cleanup trigger (Section 2.2)
- [ ] Key/conversion event designations documented with rationale (Section 2.3)
- [ ] Admin-created event rules documented (Section 2.4)
- [ ] Custom dimensions listed (Section 2.5)
- [ ] Cross-domain linking action item recorded (Section 3.1)
- [ ] Referral exclusion (`book.octorate.com`) action item recorded (Section 3.2)
- [ ] Weekly funnel question set answerable from documented commands (Section 4)
- [ ] Consent reporting rule documented (Section 5)
- [ ] Escalation thresholds and path documented (Section 6)

---

## 8. Pending Admin Actions (Required Before VC-02)

These GA4 admin changes are documented here but not yet applied. They must be completed before the weekly review can run cleanly.

| Action | Owner | Status |
|---|---|---|
| Add `hostel-positano.com` + `brikette-website.pages.dev` to cross-domain include list | Pete | **Complete (2026-02-17)** |
| Add `book.octorate.com` to unwanted referrals (referral exclusions) | Pete | **Complete (2026-02-17)** |
| Define internal traffic filter (IP/hostname) for Pete's own sessions | Pete | Pending |
| Confirm `handoff_to_engine` conversion designation policy after TASK-05B | Pete | Pending — depends on TASK-05B |
| Remove or archive `begin_checkout → handoff_to_engine` create rule after native emission confirmed stable | Pete | Pending — depends on operational window post-TASK-05A |

---

## 9. Evidence Log

| Date | Event | Source |
|---|---|---|
| 2026-02-17 | GA4 Admin API snapshot: property, stream, key events, conversion events | fact-find §Data & Contracts |
| 2026-02-17 | Event create rules added: `begin_checkout → handoff_to_engine`, `search_availability → handoff_to_engine` | fact-find §External Data Access Checks |
| 2026-02-17 | Custom dimensions created for handoff event params | fact-find §External Data Access Checks |
| 2026-02-17 | Cross-domain linking configured: `hostel-positano.com` + `brikette-website.pages.dev` added | Pete (GA4 Admin) |
| 2026-02-17 | Referral exclusion added: `book.octorate.com` in unwanted referrals | Pete (GA4 Admin) |
| 2026-02-17 | Calibration attempt: GA4 handoff events = 0 despite Octorate bookings = 31 | fact-find §Calibration attempt |
| 2026-02-17 | TASK-05A: native `handoff_to_engine` emission added to BookingModal, Booking2Modal, ApartmentBookContent | plan.md TASK-05A build evidence |
| 2026-02-17 | TASK-01: Pete confirmed as owner of all three lanes; weekly Monday morning cadence | plan.md Decision Log |
