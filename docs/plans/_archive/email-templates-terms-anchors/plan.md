---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Operations
Created: 2026-02-21
Last-reviewed: 2026-02-21
Last-updated: 2026-02-21
Relates-to charter: none
Feature-Slug: email-templates-terms-anchors
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email Templates — T&C Link Audit and Migration Plan

## Summary

All 53 Brikette email templates have been audited against the T&C page at `https://hostel-positano.com/en/terms`. 28 templates require changes: 10 have wrong/outdated Google Docs links to replace or remove, 7 need a new primary T&C link added, and 13 need a secondary T&C link added alongside an existing assistance page link. Two templates (T46 pets, T50 invoices) have incorrect T&C links — their topics are not covered in the T&C and the links must be removed. Before any template linking can use subsection-level anchors, `page.tsx` must be updated to add `id` attributes to the relevant `<p>` elements. The fact-find at `docs/plans/_archive/email-templates-terms-anchors/fact-find.md` is the **authoritative working spec** — every build task must read from the per-template spec cards therein rather than making independent judgments.

## Active tasks

- [x] TASK-01: Add subsection `id` helper + update terms page
- [x] TASK-02: Replace/remove wrong T&C links (10 templates)
- [x] TASK-03: Add primary T&C links to templates with none (7 templates)
- [x] TASK-04: Add secondary T&C links to templates with assistance links (13 templates)
- [x] TASK-05: Run lint-templates validation

## Goals

- Every template that should reference T&C does so with a precise anchored URL pointing to the most relevant section.
- All Google Docs T&C links replaced with `https://hostel-positano.com/en/terms#<anchor>`.
- Two incorrectly linked templates (T46, T50) corrected — their topics are not covered in T&C.
- Link phrasing standardised: `"For full details, please see:"` → `"For more information, please see:"` (or more specific phrasing per spec).
- Link text is descriptive (e.g. `"Non-Refundable Rate rules"`) — no bare URLs, no generic "click here".
- Subsection anchors (`<p id="…">`) added to terms page for all 9 new anchor IDs.

## Non-goals

- T06, T07 (building access), T18 (hiking guides) — these link to operational Google Docs; separate migration.
- Any change to `termsPage.json` content.
- Translation of terms page body text.
- T46 replacement URL (set to `null`; House Rules link is a future enhancement).

## Constraints & Assumptions

- Constraints:
  - TASK-01 (subsection anchors in `page.tsx`) must complete before any template link using a NEW anchor is considered live. JSON changes themselves can be authored in parallel, but anchors must be deployed first.
  - Template JSON changes must pass `packages/mcp-server/scripts/lint-templates.ts`.
  - Email body is plain text. Link format: `Label: <url>` (label followed by colon and space-padded URL).
  - Subsection ID formula: `${sectionKey}-${sectionNumber}-${subNumber}` for N.M patterns (e.g. `s6-6-5`), `${sectionKey}-a${num}` for Appendix A patterns (e.g. `s17-a1`).
- Assumptions:
  - T12 and T14 (borderline first-attempt prepayment failure) are treated as YES — including Appendix A link signals consequences clearly without being aggressive.
  - T46 `canonical_reference_url` set to `null` pending a House Rules page URL.
  - T50 `canonical_reference_url` set to `null` — invoice/receipt topics are not in T&C.
  - T17 links to s7.4 (under-18) even though the email also covers over-35 dorm restriction (no T&C section covers that).

## Fact-Find Reference

- Related brief: `docs/plans/_archive/email-templates-terms-anchors/fact-find.md`
- Key findings used:
  - Full 53-template assessment table (verdict + best T&C section + anchor per template)
  - Anchor registry: 11 EXISTS anchors, 9 NEW subsection anchors
  - Per-template spec cards (action, anchor, full URL, link label, phrasing prefix, position, canonical field change)
  - New subsection anchors table (`id` → paragraph prefix → section key)
  - Implementation scope (Part 1: page.tsx; Part 2: email-templates.json)

## Proposed Approach

The fact-find identifies a single obvious approach — no alternatives needed. Proceed with:

1. **Code first**: Extract `getSubsectionId(sectionKey, text)` helper, add subsection `id` attributes to `<p>` elements in `page.tsx`, write unit test.
2. **Data second**: Make all template JSON edits in three batches (replace/remove, add-primary, add-secondary) reading values verbatim from the fact-find per-template spec cards.
3. **Validate**: Run `lint-templates.ts` after all JSON changes.

TASK-02, TASK-03, and TASK-04 (data batches) can be authored in parallel but must be reviewed sequentially if multiple agents are used (no overlapping template IDs across batches).

## Plan Gates

- Foundation Gate: **Pass** — fact-find complete, spec locked, all 53 templates assessed, anchor IDs verified
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **No** (plan-only mode; no `plan+auto` intent)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `getSubsectionId` helper + 9 `<p id>` attrs in page.tsx + unit test | 85% | M | Complete (2026-02-21) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Replace/remove wrong T&C links — 10 templates (T01,T03,T15,T16,T17,T40,T41,T42,T46,T50) | 88% | M | Complete (2026-02-21) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Add primary T&C links — 7 templates with no existing link (T02,T11,T12,T13,T14,T34,T36) | 88% | M | Complete (2026-02-21) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Add secondary T&C links — 13 templates with existing assistance links (T05,T08,T10,T26,T27,T28,T31,T32,T33,T38,T43,T51,T52) | 87% | M | Complete (2026-02-21) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Run lint-templates and fix any validation errors | 95% | S | Complete (2026-02-21) | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Standalone code change; must complete before waves 2–3 can be considered live |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 complete | All three edit different template IDs — no overlap. Can be authored in parallel. |
| 3 | TASK-05 | TASK-02 + TASK-03 + TASK-04 complete | Validates the final JSON state |

---

## Tasks

---

### TASK-01: Add subsection `id` helper + update terms page

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/brikette/src/app/[lang]/terms/page.tsx` with `<p id="…">` attributes on subsection paragraphs; new helper `getSubsectionId`; unit test
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `apps/brikette/src/app/[lang]/terms/page.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — algorithm is deterministic; `slugify.ts` is already tested. The only risk is misidentifying which paragraphs carry the subsection prefix.
  - Approach: 88% — additive-only change; no existing functionality altered. Section-level `<h2 id>` anchors are untouched.
  - Impact: 90% — without this task, any NEW anchor link in the template JSON is a dead link.
- **Acceptance:**
  - `getSubsectionId('s6', '6.5 No Show…')` returns `'s6-6-5'`
  - `getSubsectionId('s17', 'A1. Non-Refundable Rate')` returns `'s17-a1'`
  - `getSubsectionId('s6', 'No Show (continued)')` returns `null` (no leading pattern)
  - All 9 new `<p id>` values from the fact-find anchor registry appear in rendered terms page HTML
  - Existing `<h2 id>` attributes unchanged
  - Unit test passes: jest
- **Validation contract:**
  - TC-01: `getSubsectionId('s6', '6.4 Changes and extensions are treated…')` → `'s6-6-4'`
  - TC-02: `getSubsectionId('s7', '7.1 Check-in window 15:00–22:00…')` → `'s7-7-1'`
  - TC-03: `getSubsectionId('s17', 'A2. Refundable Rate — free cancel…')` → `'s17-a2'`
  - TC-04: `getSubsectionId('s2', 'This section covers…')` → `null`
  - TC-05: `getSubsectionId('s5', '5.1 Security Deposit rule…')` → `'s5-5-1'` (but this anchor is not used by current templates — verify it's still generated correctly)
- **Execution plan:** Red → Green → Refactor
  1. **Red**: write unit tests for `getSubsectionId` covering the 4 TC cases above — tests fail (function doesn't exist)
  2. **Green**: extract `getSubsectionId(sectionKey: string, text: string): string | null` — pattern logic:
     - Match `/^(\d+)\.(\d+)/` → return `${sectionKey}-${match[1]}-${match[2]}`
     - Match `/^([A-Z])(\d+)\./` → return `${sectionKey}-${match[1].toLowerCase()}${match[2]}`
     - Otherwise return `null`
  3. Add `id={getSubsectionId(s.key, p) ?? undefined}` prop to `<p>` elements in the body render loop in `page.tsx` (line 115–123 area)
  4. **Refactor**: move helper to its own file if it grows, or keep inline — either is fine
  5. Run `pnpm --filter brikette build` or type-check to confirm no TS errors
- **Planning validation (required for M):**
  - Checks run: Read `page.tsx` — body `<p>` elements rendered via `.map((p, i) =>` at line 115; no id on them currently
  - Validation artifacts: anchor ID formula verified against `slugify.ts` in fact-find; all 9 IDs cross-checked
  - Unexpected findings: `s5-5-1` is in the registry but not used by any template yet — still add it (future use)
- **Consumer tracing:**
  - New output: `id` attribute on `<p>` elements in the terms page HTML
  - Consumer: `#fragment` navigation in browser when guest clicks anchor link in email — no code consumer, HTML spec handles it
  - All consumers covered: anchor links in email JSON (TASK-02/03/04) → deployed terms page `<p id>` → browser jumps to correct paragraph
- **Scouts:** Confirm the paragraph text in `termsPage.json` actually begins with the expected `N.M ` pattern for each of the 9 anchor IDs before implementing
- **Edge Cases & Hardening:**
  - Non-English locales: anchor IDs are derived from `termsPage.json` EN body text at render time. If a non-EN locale has different paragraph ordering or text, the IDs would not be generated. Mitigation: check `termsPage.json` locale files to confirm the `N.M ` prefix is consistent across locales, or gate the ID generation on `sectionKey` + known prefix lookups rather than live text.
  - Paragraph text changes: if the `termsPage.json` paragraph text is ever reworded to drop the leading `N.M ` prefix, the anchor disappears silently. Document this dependency in a comment in `page.tsx`.
- **What would make this >=90%:**
  - Confirm that all non-EN locales preserve the `N.M ` prefix in their body paragraphs (or use a static ID allowlist rather than dynamic detection)
- **Rollout / rollback:**
  - Rollout: standard Next.js deploy via CI/Cloudflare Pages
  - Rollback: revert `page.tsx` change; existing `<h2 id>` section anchors are untouched; template JSON links to NEW anchors become dead links (no 404 — just scrolls to top of page)
- **Documentation impact:** Add a comment in `page.tsx` explaining the subsection ID formula and the dependency on the `N.M ` paragraph prefix convention
- **Notes / references:** Anchor IDs from the fact-find anchor registry — `docs/plans/_archive/email-templates-terms-anchors/fact-find.md`, section "New subsection anchors required in page.tsx"

---

### TASK-02: Replace/remove wrong T&C links — 10 templates

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/mcp-server/data/email-templates.json` — body and/or `canonical_reference_url` for T01, T03, T15, T16, T17, T40, T41, T42, T46, T50
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/data/email-templates.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 88% — spec is complete; values to use are verbatim in the fact-find per-template cards
  - Approach: 90% — JSON data edit, no code change
  - Impact: 92% — fully contained; guests will see correct links immediately on next email send
- **Acceptance:**
  - No template in this batch retains any `docs.google.com` URL
  - T46 body has no external link in its final line
  - T50 `canonical_reference_url` is `null`
  - T41 `canonical_reference_url` points to `#s6-6-cancellations-changes-no-shows-early-departure`
  - T40 body has two T&C links (s6 + s14) where the Google Docs link previously was
  - Phrasing "For full details" does not appear in any of these templates after the change
- **Validation contract:**
  - TC-01: T01 body ends with `For more information, please see:\nNon-Refundable Rate rules: <https://hostel-positano.com/en/terms#s17-a1>`
  - TC-02: T16 body ends with `For more information, please see:\nNo Show policy and fees: <https://hostel-positano.com/en/terms#s6-6-5>`
  - TC-03: T46 body contains no `<http` link at all
  - TC-04: T50 `canonical_reference_url` is `null`
  - TC-05: T40 body contains both `#s6-6-cancellations-changes-no-shows-early-departure` and `#s14-14-health-and-safety`
- **Execution plan:**
  Read each template body and `canonical_reference_url` from `email-templates.json`, then apply changes from the fact-find per-template spec cards. For each template in this batch:

  **T01** (`replace`): Replace body line `For full details, please see: <https://docs.google.com/…>` with `For more information, please see:\nNon-Refundable Rate rules: <https://hostel-positano.com/en/terms#s17-a1>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s17-a1`.

  **T03** (`replace`): Replace Google Docs body link with `For more information, please see:\nTermination for breach of house rules: <https://hostel-positano.com/en/terms#s6-6-7>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s6-6-7`.

  **T15** (`replace`): Replace Google Docs body link with `For more information, please see:\nNon-Refundable Rate rules: <https://hostel-positano.com/en/terms#s17-a1>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s17-a1`.

  **T16** (`replace`): Replace Google Docs body link with `For more information, please see:\nNo Show policy and fees: <https://hostel-positano.com/en/terms#s6-6-5>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s6-6-5`.

  **T17** (`replace`): Replace Google Docs body link with `For more information, please see:\nAge and minors policy: <https://hostel-positano.com/en/terms#s7-7-4>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s7-7-4`.

  **T40** (`replace` — two links): Replace the single Google Docs body link line with two consecutive lines:
  - `For more information on our cancellation policy, please see:\nCancellations and rate rules: <https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure>`
  - `For health-related cancellations and travel insurance guidance, please see:\nHealth and safety terms: <https://hostel-positano.com/en/terms#s14-14-health-and-safety>`
  Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s14-14-health-and-safety`.

  **T41** (`field-only`): No body change. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure`.

  **T42** (`replace`): Replace Google Docs body link with `For more information, please see:\nPayments and preauthorisations policy: <https://hostel-positano.com/en/terms#s4-4-payments-deposits-and-preauthorisations>`. Set `canonical_reference_url` to `https://hostel-positano.com/en/terms#s4-4-payments-deposits-and-preauthorisations`.

  **T46** (`remove`): Remove the final line `For full details, please see: <https://docs.google.com/…>` from body. Set `canonical_reference_url` to `null`.

  **T50** (`field-only-remove`): No body change. Set `canonical_reference_url` to `null`.

- **Planning validation:**
  - Checks run: All 10 templates confirmed in fact-find assessment table; body format and Google Docs URL presence confirmed in prior session reads
  - Validation artifacts: per-template spec cards in fact-find (verbatim source of all values)
  - Unexpected findings: T40 is the only template where a single link becomes two links (warranted by dual s6+s14 scope)
- **Consumer tracing:**
  - Modified field: `body` text and `canonical_reference_url` in template JSON
  - Consumers of `body`: MCP gmail drafting tools read body text when generating email drafts
  - Consumers of `canonical_reference_url`: MCP `draft_quality_check` uses this field to verify links in generated drafts; template linter validates URL format
  - All consumers updated by same data change; no code change needed to read the new values
- **Scouts:** For T46, confirm body ends with the Google Docs link before removing it (read the current body first)
- **Edge Cases & Hardening:** T40 dual-link insertion — ensure no extra blank lines are introduced between the two link lines that would break plain-text email rendering
- **What would make this >=90%:** Pre-verify exact current body text of each template before editing (eliminates any uncertainty about whitespace/newline format)
- **Rollout / rollback:**
  - Rollout: data-only; no deploy needed for JSON changes unless MCP server caches template data at startup
  - Rollback: `git revert` the JSON file change
- **Documentation impact:** None: self-documenting data change
- **Notes / references:** Per-template spec cards in `docs/plans/_archive/email-templates-terms-anchors/fact-find.md` §"Per-template spec"

---

### TASK-03: Add primary T&C links — 7 templates with no existing link

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/mcp-server/data/email-templates.json` — body and `canonical_reference_url` for T02, T11, T12, T13, T14, T34, T36
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/data/email-templates.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 88%
  - Implementation: 88% — spec values are verbatim in fact-find cards; "add-primary" means appending a new final line to body
  - Approach: 90% — additive JSON edit
  - Impact: 90% — guests receive T&C references they currently have no access to from these emails
- **Acceptance:**
  - All 7 templates have a new final body line with a T&C link matching the fact-find spec
  - All 7 `canonical_reference_url` fields set to the spec URL
  - Phrasing follows: `"For more information, please see:\n<Label>: <URL>"`
  - `lint-templates.ts` passes (validated in TASK-05)
- **Validation contract:**
  - TC-01: T02 body ends with `For more information, please see:\nOur booking terms: <https://hostel-positano.com/en/terms#s2-2-booking-requests-authorised-channels-and-contract-formation>`
  - TC-02: T11 body ends with `For more information, please see:\nCancellation policy: <https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure>`
  - TC-03: T34 body ends with `For more information, please see:\nPromotions and coupon terms: <https://hostel-positano.com/en/terms#s15-15-promotions-and-coupons>`
  - TC-04: T36 `canonical_reference_url` = `https://hostel-positano.com/en/terms#s10-10-personal-belongings-and-property-storage`
- **Execution plan:**
  For each template, append a new final body line (preceded by `\n`) and set `canonical_reference_url`:

  **T02** — Add: `For more information, please see:\nOur booking terms: <https://hostel-positano.com/en/terms#s2-2-booking-requests-authorised-channels-and-contract-formation>`. Set canonical.

  **T11** — Add: `For more information, please see:\nCancellation policy: <https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure>`. Set canonical.

  **T12** — Add: `For more information, please see:\nNon-Refundable Rate rules: <https://hostel-positano.com/en/terms#s17-a1>`. Set canonical.

  **T13** — Add: `For more information, please see:\nCancellation policy: <https://hostel-positano.com/en/terms#s6-6-cancellations-changes-no-shows-early-departure>`. Set canonical.

  **T14** — Add: `For more information, please see:\nNon-Refundable Rate rules: <https://hostel-positano.com/en/terms#s17-a1>`. Set canonical.

  **T34** — Add: `For more information, please see:\nPromotions and coupon terms: <https://hostel-positano.com/en/terms#s15-15-promotions-and-coupons>`. Set canonical.

  **T36** — Add: `For more information, please see:\nPersonal belongings and storage policy: <https://hostel-positano.com/en/terms#s10-10-personal-belongings-and-property-storage>`. Set canonical.

- **Planning validation:**
  - Checks run: All 7 templates confirmed as `None` (no existing T&C link) in fact-find assessment table; `reference_scope` values noted (T34, T36 have excluded assistance links — T&C is their first external reference)
  - Unexpected findings: T12 and T14 are BORDERLINE in the audit — they are included here as YES per the assumption in fact-find; user may override before build
- **Consumer tracing:**
  - New output: `body` line and `canonical_reference_url` value
  - Same consumers as TASK-02: MCP drafting tools read body; `canonical_reference_url` used by quality-check and linter
- **Scouts:** For T34 and T36 (which currently have `reference_optional_excluded` scope), verify that the drafting tools do not suppress the body link due to scope — the scope field governs automatic injection, not manual body text
- **Edge Cases & Hardening:** T12/T14 are first-attempt payment failure emails — gentle in tone. The T&C link uses Appendix A (rate rules), not the cancellation section; this maintains the educational rather than threatening tone.
- **What would make this >=90%:** Explicit user confirmation that T12 and T14 should be included (currently inferred as YES per fact-find assumption)
- **Rollout / rollback:**
  - Rollout: data-only
  - Rollback: `git revert` JSON change
- **Documentation impact:** None
- **Notes / references:** Per-template spec cards T02, T11, T12, T13, T14, T34, T36 in fact-find §"Per-template spec"

---

### TASK-04: Add secondary T&C links — 13 templates with existing assistance links

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/mcp-server/data/email-templates.json` — body for T05, T08, T10, T26, T27, T28, T31, T32, T33, T38, T43, T51, T52; `canonical_reference_url` unchanged for all
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/data/email-templates.json`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 87%
  - Implementation: 87% — slightly more complex than add-primary (must insert after a specific line, not just append to end)
  - Approach: 88% — JSON edit; no canonical_reference_url change for any of these
  - Impact: 90% — adds policy backing to practical emails without replacing the assistance page link
- **Acceptance:**
  - All 13 templates have a new T&C link line inserted after the existing assistance link (at the position specified in the fact-find)
  - `canonical_reference_url` unchanged for all 13 (assistance page remains primary reference)
  - Phrasing follows the specific prefix from the fact-find spec card (not generic "For more information" in some cases)
  - Lint passes (TASK-05)
- **Validation contract:**
  - TC-01: T05 body contains both `/en/assistance/checkin-checkout` and `#s7-7-check-in-requirements-eligibility-id-and-payment` in the correct order
  - TC-02: T33 body contains both `/en/assistance/checkin-checkout` and `#s5-5-security-deposit-and-safeguarding`
  - TC-03: T51 body contains both `/en/assistance/booking-basics` and `#s2-2-6`
  - TC-04: T31 body contains both `/en/assistance/rules` and `#s6-6-7`
  - TC-05: T27 body contains `/en/assistance/changing-cancelling`, `#s6-6-4`, and `#s3-3-2` (in that order)
  - TC-06: T38 body contains `/en/assistance/booking-basics`, `#s3-3-2`, and `#s2-2-6` (in that order)
- **Execution plan:**
  For each template, locate the existing assistance link line and insert the new T&C line immediately after it. All values from fact-find spec cards:

  **T05** — after `/en/assistance/checkin-checkout` line: `For the booking terms on check-in, please see:\nCheck-in requirements: <https://hostel-positano.com/en/terms#s7-7-check-in-requirements-eligibility-id-and-payment>`

  **T08** — after `/en/assistance/checkin-checkout` line: `For the booking terms on check-in and no-shows, please see:\nCheck-in window and no-show terms: <https://hostel-positano.com/en/terms#s7-7-1>`

  **T10** — after `/en/assistance/late-checkin` line: `For the booking terms on late arrivals, please see:\nCheck-in window and late arrival terms: <https://hostel-positano.com/en/terms#s7-7-1>`

  **T26** — after `/en/assistance/changing-cancelling` line: `For the booking terms on changes, please see:\nBooking changes and cancellation policy: <https://hostel-positano.com/en/terms#s6-6-4>`

  **T27** — after `/en/assistance/changing-cancelling` line, add two consecutive T&C lines:
  - `For the booking terms on changes, please see:\nBooking changes and cancellation policy: <https://hostel-positano.com/en/terms#s6-6-4>`
  - `For the booking terms on room allocation, please see:\nRoom and bed allocation policy: <https://hostel-positano.com/en/terms#s3-3-2>`

  **T28** — after `/en/assistance/changing-cancelling` line: `For the booking terms on stay limits, please see:\nMaximum stay and booking limits: <https://hostel-positano.com/en/terms#s2-2-6>`

  **T31** — after `/en/assistance/rules` line: `For the booking terms on breach of rules, please see:\nTermination for breach of house rules: <https://hostel-positano.com/en/terms#s6-6-7>`

  **T32** — after `/en/assistance/rules` line: `For the booking terms on visitor access, please see:\nVisitor definition and conditions: <https://hostel-positano.com/en/terms#s1-1-parties-and-definitions>`

  **T33** — after `/en/assistance/checkin-checkout` line: `For the booking terms on the security deposit, please see:\nSecurity deposit terms: <https://hostel-positano.com/en/terms#s5-5-security-deposit-and-safeguarding>`

  **T38** — after `/en/assistance/booking-basics` line, add two consecutive T&C lines:
  - `For the booking terms on room allocation and groups, please see:\nRoom and group booking allocation: <https://hostel-positano.com/en/terms#s3-3-2>`
  - `For the booking terms on maximum stay and group size, please see:\nMaximum stay and booking limits: <https://hostel-positano.com/en/terms#s2-2-6>`

  **T43** — after `/en/assistance/changing-cancelling` line: `For the booking terms on remedies and alternative accommodation, please see:\nDefects and remedies policy: <https://hostel-positano.com/en/terms#s8-8-defects-maintenance-and-remedies>`

  **T51** — after `/en/assistance/booking-basics` line: `For the booking terms on group limits and maximum stay, please see:\nGroup booking limits and stay terms: <https://hostel-positano.com/en/terms#s2-2-6>`

  **T52** — add as new final line after existing `/en/assistance/late-checkin` reference: `For the booking terms on late arrivals, please see:\nCheck-in window and late arrival terms: <https://hostel-positano.com/en/terms#s7-7-1>`

- **Planning validation:**
  - Checks run: All 13 templates confirmed as having an existing assistance page link in the fact-find assessment table; positions specified in per-template spec cards
  - Unexpected findings: T33 and T05 both reference `/en/assistance/checkin-checkout` — different T&C sections appended (s5 and s7 respectively)
- **Consumer tracing:**
  - New output: additional body line in 13 templates
  - `canonical_reference_url` unchanged — no consumer change for that field
  - MCP drafting tools read body text — they will include the new T&C line in generated drafts
- **Scouts:** Read each template body before editing to confirm the exact text of the assistance link line (to insert after the correct line)
- **Edge Cases & Hardening:** If a template's assistance link line includes additional text on the same line (not a standalone line), the "insert after" logic must be adapted — read body first to confirm line structure
- **What would make this >=90%:** Pre-read all 13 template bodies to confirm line structure before editing
- **Rollout / rollback:**
  - Rollout: data-only
  - Rollback: `git revert`
- **Documentation impact:** None
- **Notes / references:** Per-template spec cards T05, T08, T10, T26, T27, T28, T31, T32, T33, T38, T43, T51, T52 in fact-find §"Per-template spec"

---

### TASK-05: Run lint-templates validation

- **Type:** IMPLEMENT
- **Deliverable:** All lint-templates checks pass; any URL format or schema errors fixed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/scripts/lint-templates.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — linter script exists and is runnable; any errors are fixable inline
  - Approach: 95% — standard validation step
  - Impact: 95% — confirms data integrity before MCP server uses updated templates
- **Acceptance:**
  - `pnpm --filter mcp-server lint:templates` exits 0
  - No `docs.google.com` URLs remain in `canonical_reference_url` fields of any template
  - No `docs.google.com` URLs remain in body text of any template (except T06, T07, T18 which are out of scope)
- **Validation contract:**
  - TC-01: Linter exits 0 after all TASK-02/03/04 changes
  - TC-02: `grep "docs.google.com" email-templates.json` only matches T06, T07, T18 (access guides + hiking route — out of scope)
- **Execution plan:**
  1. Run `pnpm --filter mcp-server lint:templates` (or equivalent — check `packages/mcp-server/package.json` scripts)
  2. Fix any validation errors reported
  3. Run `grep docs.google.com packages/mcp-server/data/email-templates.json` to confirm only expected templates still reference Google Docs
  4. Commit all changes together
- **Planning validation:**
  - Checks run: Confirmed `packages/mcp-server/scripts/lint-templates.ts` exists in fact-find key modules list
  - Unexpected findings: None
- **Scouts:** None: validation-only task
- **Edge Cases & Hardening:** If lint-templates checks URL reachability (not just format), the new `hostel-positano.com` URLs with fragment hashes may return 200 but hash fragments are client-side only — confirm linter only validates URL format/structure
- **What would make this >=90%:** None required (already at 95%)
- **Rollout / rollback:**
  - Rollout: no deploy needed; lint is a CI check
  - Rollback: None: validation task only
- **Documentation impact:** None
- **Notes / references:** Script: `packages/mcp-server/scripts/lint-templates.ts`

---

## Build Evidence (2026-02-21)

### TASK-01

- Added `getSubsectionId(sectionKey, text)` in `apps/brikette/src/app/[lang]/terms/getSubsectionId.ts`.
- Wired paragraph IDs in `apps/brikette/src/app/[lang]/terms/page.tsx` using `id={getSubsectionId(...) ?? undefined}`.
- Added tests in `apps/brikette/src/test/app/terms/getSubsectionId.test.ts` covering TC-01 through TC-05 patterns.
- Validation:
  - `pnpm --filter @apps/brikette test -- src/test/app/terms/getSubsectionId.test.ts` (pass)
  - `pnpm --filter @apps/brikette typecheck` (pass)
  - `pnpm --filter @apps/brikette lint` (pass; script intentionally informational)
  - `pnpm exec tsx` subsection probe over EN terms content confirmed all 9 required IDs generated (9/9).

### TASK-02

- Updated T01, T03, T15, T16, T17, T40, T41, T42, T46, T50 in `packages/mcp-server/data/email-templates.json` per fact-find cards.
- Replaced/remapped outdated T&C Google Docs links; removed T46 body link; set `canonical_reference_url` to `null` for T46 and T50.
- Validation checks confirmed no `For full details` phrasing remains in this 10-template batch and T40 now contains both required policy links.

### TASK-03

- Added primary T&C link blocks and canonical URLs for T02, T11, T12, T13, T14, T34, T36.
- Validation checks confirmed all seven templates now end with the specified `For more information` + labeled anchor format.

### TASK-04

- Added secondary T&C link blocks to T05, T08, T10, T26, T27, T28, T31, T32, T33, T38, T43, T51, T52 while preserving existing assistance canonical URLs.
- Validation checks confirmed required ordering constraints (including dual-link sequences in T27 and T38).

### TASK-05

- Ran template/data and package validations:
  - `pnpm --filter mcp-server lint:templates` (pass; 53 templates, 0 warnings)
  - `pnpm --filter mcp-server typecheck` (pass)
  - `pnpm --filter mcp-server lint` (pass with pre-existing repository warnings only)
- Google Docs scan now reports only T06, T07, and T18 as expected out-of-scope matches.
## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Subsection paragraph text in `termsPage.json` doesn't start with expected `N.M ` prefix | Low | High | Read `termsPage.json` body text in TASK-01 to verify all 9 paragraphs before writing the pattern-detection logic |
| Non-EN locales have different paragraph ordering, breaking subsection anchor detection | Medium | Low | Anchor IDs generated at render time from locale body text — if non-EN text lacks `N.M ` prefix, those paragraphs silently get no `id`. Acceptable for now (guests receive emails in EN; T&C page is EN-first) |
| T40 dual-link insertion introduces extra whitespace breaking email plain-text rendering | Low | Low | Read T40 body first; test with exact newline format before committing |
| Linter checks URL reachability rather than just format — fragment hashes cause false failures | Low | Medium | Read lint-templates.ts before running; adjust approach if it does live HTTP checks |
| T12/T14 user rejects including T&C link at first-attempt failure stage | Low | Low | Fact-find assumption clearly stated as overridable; these are BORDERLINE in the audit |

## Observability

- Logging: None — data-only changes; MCP server logs template loads at startup if applicable
- Metrics: None
- Alerts/Dashboards: None: no infrastructure change

## Acceptance Criteria (overall)

- [x] `getSubsectionId` helper exists and all unit tests pass
- [x] All 9 new `<p id="…">` attributes present in rendered terms page HTML
- [x] No `docs.google.com` URL in any template `canonical_reference_url` or body (except T06, T07, T18 out-of-scope)
- [x] No "For full details" phrasing in any updated template body
- [x] All updated link text is descriptive (no bare URLs, no "click here")
- [x] T46 body has no external link; `canonical_reference_url` is `null`
- [x] T50 `canonical_reference_url` is `null`
- [x] `lint-templates.ts` exits 0

## Decision Log

- 2026-02-21: T12 and T14 (first-attempt payment failure) included as YES for T&C linking. Rationale: even at the first failure, providing a link to Appendix A (rate rules) educates the guest about consequences without being threatening.
- 2026-02-21: T17 links to s7.4 (under-18) even though the email covers over-35 dorm restriction. No T&C section covers the over-35 rule — s7.4 is the closest applicable clause.
- 2026-02-21: T46 `canonical_reference_url` set to `null`. Pets are not mentioned in T&C. Future: link to House Rules page when available.
- 2026-02-21: T40 receives two links (s6 + s14) replacing the single Google Docs link. Health hardship cancellations span both policy sections.

## Overall-confidence Calculation

S=1, M=2, L=3

| Task | Confidence | Effort | Weight |
|---|---:|---|---:|
| TASK-01 | 85% | M | 2 |
| TASK-02 | 88% | M | 2 |
| TASK-03 | 88% | M | 2 |
| TASK-04 | 87% | M | 2 |
| TASK-05 | 95% | S | 1 |

Overall = (85×2 + 88×2 + 88×2 + 87×2 + 95×1) / (2+2+2+2+1)
       = (170 + 176 + 176 + 174 + 95) / 9
       = 791 / 9
       = **88%**
