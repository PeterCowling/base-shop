---
schema_version: worldclass-benchmark.v1
business: BRIK
goal_version: 1
generated_at: 2026-02-28
domains:
  - id: cash-reconciliation-ux
    name: Cash Reconciliation UX
  - id: stock-accountability
    name: Stock Accountability
  - id: manager-audit-visibility
    name: Manager Audit Visibility
  - id: end-of-day-closeout
    name: End-of-Day Close-Out
---

# World-Class Benchmark — BRIK/reception

## [cash-reconciliation-ux] Cash Reconciliation UX

### Current Best Practice

World-class cash reconciliation UX in 2025–2026 looks like an on-rails, denomination-aware counting flow that cannot be "done wrong" by accident and provides continuous "expected vs counted" feedback as staff progress. Best-in-class systems guide users through each denomination with a keypad-driven workflow (entering counts of notes/coins, not values), support easy correction of a previously-entered denomination, and make counting optional/mandatory based on role or store policy settings—so a first-shift team member gets guardrails while managers retain flexibility. This approach aligns with established UX guidance for reducing cognitive load and error recovery: break complex tasks into structured steps and make error states visible and fixable in-context rather than after submission.

World-class experiences also treat reconciliation as a stateful operational object (a drawer session / till / shift) with clear lifecycle states, rather than a one-time form. In practice that means: (1) a session has a starting balance, (2) every change to cash-on-hand is recorded as an explicit action (payout, cash drop, cash lift, pay-in/out) with a reason, (3) the system computes an expected balance continuously, and (4) the "close" step produces an immediate over/short result that's visible on the POS—not hidden in a back-office report. Best-in-class implementations go further with role-aware "blind" modes that hide expected balances from certain roles to reduce gaming, and with lock/assignment mechanics that tie a drawer to a specific employee for accountability.

The main difference between world-class and merely good is how discrepancies are handled before the user confirms completion: world-class systems surface variance inline and provide drill-down context (denomination breakdowns, cash lift/drop journals, reasons) so the staff member can either resolve the issue immediately or record a structured explanation for later follow-up. For example, a report that allows a manager to click into a reported total to see exact denominations counted, and to export a "cash management journal" with amounts and reasons for lifts/drops, materially shortens variance investigation time. In contrast, common operator pain points in the market include (a) entering only a single total figure (increasing arithmetic errors and reducing coaching quality) and (b) seeing differences only after closing, which pushes staff into stressful "close first, investigate later" behaviours at peak reception moments.

Offline reality is a differentiator for BRIK's context. Many leading platforms support continuing operations during connectivity disruptions and make the offline state explicit to staff (for example, an offline banner explaining what can/can't be done and auto-switching back online when restored). However, several "closing" or "new drawer creation" operations in commercial systems are still connectivity-sensitive (e.g., cash drawer availability at start of day, or close-of-day reporting not runnable while offline), which is out-of-scope for BRIK's requirement that workflows complete correctly under poor connectivity. The closest in-scope interpretation of world-class, given BRIK's offline-first architecture, is: allow the full reconciliation flow to complete offline, store an immutable local audit record immediately, and defer only non-essential external settlement steps until sync.

### Exemplars

- **Toast** — Cash drawers are modelled as a stateful workflow with open/paused/closed states, expected vs actual totals, visible cash overage/shortage, and "full vs blind" permissions that can hide expected balances for certain roles.
- **Lightspeed** — Denomination-by-denomination guided counting on POS plus a cash drawer report that supports denomination drill-down and exportable cash lift/drop journals with reasons for variance resolution.
- **Square** — Cash sessions track starting cash, paid-in/out actions (with descriptions), and expected cash, with reviewable drawer history and reporting; strong session modelling but (often) total-entry counting rather than denomination guidance.
- **Oracle** — Register close can include a denomination "deposit calculator" that shows a running total during cash counting, reinforcing error prevention through structured input.
- **Tevalis (with Opsyte)** — Integrated "cash up" positioning emphasises reducing end-of-night cashing-up friction and surfacing daily variances (note: described as online, so offline-first replication is required for BRIK).

### Key Indicators

- Median time-to-complete a standard drawer reconciliation (including denomination entry and confirmation) is ≤ 5 minutes on shared touch hardware, without skipping steps.
- Inline expected-vs-actual feedback is visible during the flow (not only after closing), and discrepancy magnitude is displayed at the moment it becomes knowable.
- Denomination-aware entry (counts of coins/notes with auto-calculated totals) is supported for faster counting and reduced arithmetic error.
- Role-aware controls exist (e.g., "blind" mode hiding expected balances; drawer locked to an employee) to reduce gaming risk and improve accountability.
- Structured cash movements (cash in/out, lifts/drops) require a reason/note and are surfaced directly in variance investigation tooling.
- Error prevention and recovery: the UI highlights what's wrong, keeps errors near the relevant fields/step, and guides staff to a fix rather than "try again" dead-ends.
- Offline-safe completion: the reconciliation can be fully completed without connectivity, with a clear offline state indicator and guaranteed later sync (commercial platforms often fall short here, which BRIK should treat as a deliberate differentiator).

### Minimum Threshold

A competitive minimum is a drawer/session workflow that records starting cash and cash movements, supports a fast counted close with an immediate over/short display, and stores an audit-ready record that can be reviewed later—even if the network is down at close time.

---

## [stock-accountability] Stock Accountability

### Current Best Practice

World-class stock accountability in 2025–2026 optimises for physical reality: staff count in the order items are stored ("shelf-to-sheet" / "storage areas"), see progress as they move, and can finish confidently even in low-signal storage spaces. The best patterns combine (1) location-structured templates, (2) progress and completion cues, and (3) offline-capable counting with automatic sync when reconnected. Exemplars show concrete UX mechanisms like storage-area navigation, progress bars, and real-time value feedback to reduce fatigue and catch miscounts while they're happening.

World-class systems also treat variance as a first-class outcome, not a separate analytical afterthought. That means the tool immediately computes expected vs actual (or theoretical vs actual) and makes it obvious which items/categories are driving the problem, with drill-down into what the "actual usage" number is composed of (beginning inventory count, purchases, transfers, ending inventory count). Strong implementations explicitly flag "excess variance" and provide both positive/negative variance views so managers can identify systematic issues (portioning, theft, missed invoices, mapping errors) rather than chasing noise.

Distinguishing expected variance from unexplained loss is a hallmark of world-class. The best tools model "known" sinks (waste, donations, manual depletions/spillage, transfers) and compute what remains unexplained, sometimes even showing "variance with allowance" to account for an agreed tolerance. This reduces false alarms and helps staff learn the difference between "we comped/spilled this" and "something is missing." Systems that recommend logging waste as a specific depletion category—and that provide dedicated columns or measures for waste vs unexplained variance—make the workflow both teachable for novices and actionable for managers.

Finally, world-class workflows prevent "silent failure" at count completion. A common gap in real operations is finishing a count with uncounted items (or rushed zeros) because the UI doesn't force staff to confront what's incomplete. Strong designs surface the number of uncounted items throughout, and at completion present explicit options (go back and count; set to zero; or, carefully, use a theoretical in-stock quantity and mark those lines). Recording the counting user per line item and providing exported reports that include expected quantity and variances reinforces accountability and drastically improves post-count investigation speed.

### Exemplars

- **BevSpot** — Storage-area-based inventory with offline mode, search, progress bars, and real-time value feedback, syncing changes when back online.
- **Restaurant365** — Inventory counts follow storage locations/templates ("shelf-to-sheet"), listing items in physical order with cost/UoM; variance reporting decomposes actual usage (counts, transfers, purchases) and flags excess variance.
- **WISK** — Counting UX that surfaces item $ value during count review to catch counting/costing errors early, with multi-user counting patterns that attribute submissions to specific users.
- **Craftable** — AvT variance reporting explicitly links discrepancies to operational causes (over-pouring, theft, missed invoices) and miscount/mapping errors; audit workflows use storage areas and calculator-style entry.
- **Tevalis Stock Management** — Stocktake UX surfaces uncounted items, supports completion options for uncounted lines (including theoretical in-stock quantities with marking), shows expected vs counted differences, and exports reports including who counted items and resulting variances.

### Key Indicators

- Count sequencing matches physical layout (storage areas / categories), and staff can complete a typical category count within ≤ 5 minutes on shared touch hardware.
- Progress visibility: the UI shows % complete (or uncounted item counts) continuously and prevents "accidental completion" without explicit acknowledgement of remaining lines.
- Immediate variance surfacing: after submitting a count, variances (positive/negative) are surfaced within the same workflow with top drivers highlighted.
- Variance decomposition: the system can show what contributes to usage/variance (beginning count, purchases, transfers, ending count, waste/depletions) to support resolution, not just detection.
- Expected vs unexplained separation: waste/spoilage/comp (or "allowance") is explicitly captured so "unexplained variance" is a smaller, focused list.
- Attribution at the point of entry: count submissions are tied to a user (and ideally a timestamp) per area and/or per item, enabling investigation without guesswork.
- Offline-capable completion: the entire count can be performed without reliable connectivity, with local persistence and later sync (a key constraint for BRIK that best-in-class inventory tools explicitly design for).

### Minimum Threshold

A competitive minimum is a storage-area/category-based count sheet with fast quantity entry, offline-safe save-as-you-go, and automatic expected-vs-counted variance calculation with a required note/reason when variance exceeds a defined threshold.

---

## [manager-audit-visibility] Manager Audit Visibility

### Current Best Practice

World-class manager audit visibility is defined by speed-to-certainty: a manager should be able to confirm in seconds whether the shift was clean, and if not, see exactly what is wrong and where to click next. Best-in-class dashboards provide a single screen that consolidates: expected totals, actual totals, overage/shortage, closed-out times, and state (open/paused/closed) across drawers or tills. A standout pattern is presenting "expected total closeout cash", "actual total closeout cash", and "cash overage or shortage" inline with the drawer list so managers don't need to hunt through multiple reports.

World-class audit trails are also queryable. A manager needs to filter by staff member, entity/type, and date range, and see user attribution on every meaningful event. Strong implementations include audit logs that list user-driven events in reverse chronological order with explicit event timestamps, user identity, and direct links to underlying records; and they provide export-to-CSV for deeper analysis. This is a meaningful step up from "the system stores something somewhere" because it turns accountability into a practical, fast workflow.

World-class systems make "why is this off?" answerable without reconstructing the day from memory. That requires drill-down: denomination breakdowns for counts, cash-lift/drop journals with reasons, and report columns that preserve device/location context (crucial for multi-terminal operations and shared reception hardware). Providing these investigative affordances moves discrepancy handling from "manager coaching required" to "self-explaining evidence trail," which is the core of BRIK's stated goal.

Offline and bilingual constraints change what "world-class" must mean for BRIK: a manager's audit view must work even when the network is unreliable, because that's when operational errors are most likely. Many commercial systems rely on cloud back office for some audit views, but several explicitly support printing/exporting/emailing reports for offline access—an indicator that "auditability without live connectivity" is an expected baseline pattern. For BRIK specifically, the in-scope best practice is to keep the audit summary and event log locally readable at all times and sync upstream opportunistically.

### Exemplars

- **Toast** — One screen shows expected vs actual totals and cash overage/shortage, includes stateful drawer lists with closed-out times, and provides role-based visibility (full vs blind) plus employee locking indicators.
- **Lightspeed** — Cash drawer report supports sorting by user/date, export to CSV, denomination drill-down, and "cash management journal" exports including lift/drop reasons—strong for fast discrepancy investigation.
- **Square** — Drawer history supports adding columns (paid in/out, device, location) and emailing/printing reports from the POS app, enabling lightweight audit review.
- **Restaurant365** — Event Audit Log records user-driven events with timestamp and user attribution, links to underlying records, and supports column controls and CSV export.
- **Tevalis Stock Management** — Audit log list supports entity/date filtering, displays user attribution, and supports export; stocktake exports include who counted items and resulting variances.

### Key Indicators

- Manager time-to-confirm a clean shift is ≤ 30 seconds, because the audit screen is a single consolidated view (not multiple reports).
- Variance salience: any over/short cash or high variance stock category is visible "above the fold" with magnitude and affected entity (drawer, stock area, category).
- Attribution completeness: every critical action (count submitted, drawer closed, cash drop/lift, stocktake completion) records who and when in a reviewable log.
- Queryable audit trail: manager can filter by staff member/date/entity and export results for investigations or owner reporting.
- Direct drill-down: one tap from "variance" to the underlying details (e.g., denominations counted, list of lifts/drops with reasons, linked record).
- Offline-readable audit: shift summary and event log remain accessible without connectivity; exports/prints are available as a fallback.
- Human-centred error language: discrepancy messages use clear, constructive wording and guide next actions rather than blaming staff.

### Minimum Threshold

A competitive minimum is a single manager view per shift/day showing expected vs actual cash and any stock variances, with user attribution, timestamps, and an exportable log so unresolved issues are visible immediately rather than buried.

---

## [end-of-day-closeout] End-of-Day Close-Out

### Current Best Practice

World-class end-of-day close-out is a wizard/checklist that consolidates all end-of-shift requirements into an ordered sequence, prevents closing with known blockers, and produces a final artefact (printed/email report + immutable record) that lets owners/managers trust the numbers. Best practice includes configurable requirements (close open checks, adjust tips, total drawers, clock out staff) and a "close preview" that lets the closer resolve missing steps from within the close flow itself. The best systems also allow controlled overrides via owner passcode for exceptional cases—recognising that rigid procedures can fail in real operations.

A second hallmark is explicit incomplete-task surfacing during the close-out: the UI shows what's done, what's missing, and advances only when each step is complete. A concrete exemplar is an end-of-day wizard that displays required tasks with checkmarks, shows incomplete actions in a separate panel, and includes dedicated steps for reconciling open orders, closing tills, confirming employee time cards, and printing the final report. This turns close-out from "tribal knowledge" into a repeatable, low-stress routine for mixed-skill teams.

World-class close-out also integrates with how the POS models the business day: sales periods/shifts cannot be closed until open orders are processed, staff are clocked out, and associated drawers are counted and closed—often with explicit warnings if other devices' drawers haven't been handled. On the reporting side, strong systems treat floats as first-class (opening float, in-till amount at close) and produce an end-of-day variance report as part of the close operation, enabling automation/integration without losing accountability.

Offline constraints are where "world-class market practice" commonly conflicts with BRIK's required scope. Several commercial systems explicitly block completion of close-of-day reporting or end-of-day processes when the device is offline (while still allowing offline payments that sync later), or require connectivity for certain steps such as handling offline payments/declines before the wizard can finish. For BRIK, that behaviour is out-of-scope: the in-scope best practice is to split close-out into (1) an offline-completable operational close that records counts and flags issues, and (2) a later sync/settlement phase that attaches processor outcomes once connectivity returns.

### Exemplars

- **Square** — Close-of-day procedures are configurable (checks, tips, drawers, clock-outs), the report can be printed/emailed, and overrides require an owner passcode; close-of-day reporting itself is not runnable while offline (out-of-scope for BRIK).
- **Revel Systems** (via operational training material) — EOD wizard is explicitly step-by-step with task completion checkmarks, includes handling offline/declined payments, and blocks completion if still offline—strong checklist mechanics that BRIK can replicate while keeping offline completion in-scope.
- **Lightspeed** — Closing a sales period requires closing open orders, clocking out users, and closing associated cash drawers, with warnings about unclosed drawers on other POS devices—strong pre-close validation.
- **Epos Now** — API-driven "open till" (float) and "close till" (in-till amount) operations return an end-of-day variance report, reflecting a structured close-out model suitable for automation and audit.
- **Tevalis + Opsyte** — Marketed as simplifying end-of-night cashing-up and taking care of daily variances/reporting via integrated "Cash Up" (described as online; offline-first replication required for BRIK).

### Key Indicators

- Time-to-close: end-of-day close-out is routinely completed in ≤ 5 minutes on shared touch hardware when there are no issues, because the workflow is a short wizard rather than a long checklist scattered across menus.
- Pre-close validation coverage: the system blocks or prominently warns on open checks/orders, unadjusted tips, unclosed drawers, or still-clocked-in staff before allowing final confirmation.
- Single final confirmation: one "confirm close" action produces a final report artefact and resets the system for the next day (or clearly indicates what remains).
- Exception handling is explicit: overrides (where allowed) require elevated credentials and are logged, so "we had to bypass a step" becomes auditable rather than invisible.
- Variance is actionable immediately: close-out output includes magnitude (+/–), category (cash vs stock), and drill-down context (e.g., denomination breakdown, cash journal, unresolved orders list).
- Offline-first completion: staff can finish close-out even with poor connectivity; non-essential settlement tasks sync later (note: many commercial exemplars block completion while offline, which BRIK should deliberately avoid).
- Clear instructional language: steps and error states are presented with concise guidance and constructive error messaging (critical for mixed-language, mixed-skill teams).

### Minimum Threshold

A competitive minimum is a single guided close-out checklist that (a) confirms drawers are counted and recorded, (b) confirms stock logging status, (c) forces resolution or explicit carry-over of outstanding items, and (d) produces a stored summary report that remains viewable offline and syncs when connectivity returns.
