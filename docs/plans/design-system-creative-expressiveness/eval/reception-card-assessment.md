# Room Status Summary Card -- Self-Assessment

**Probe:** Phase 3 Eval -- Reception App Room Status Card
**Theme:** reception
**Surface mode:** operations
**Date:** 2026-03-14

---

## Profile Compliance Scorecard

### Category C -- Guidance Fields

| Field | Profile Value | My Choice | Consistent? |
|-------|--------------|-----------|-------------|
| colorStrategy | restrained | Primary green for occupied/arriving badges and CTA; amber accent for checkout-today only; muted gray for vacant. Two-color palette, no extra hues. | Y |
| accentUsage | structural | Accent (amber) used only for the checkout-today badge to signal operational urgency. Not decorative. | Y |
| whitespace | dense (operations mode) | p-3 card padding (0.75rem), mt-2/mt-3 internal gaps, py-1 table rows. Compact throughout. | Y |
| gridCharacter | symmetric | Example grid uses equal-width columns (grid-cols-2/3/4). Card internals are left-right aligned symmetrically. | Y |
| imageRelationship | contained | No images in this card (data-only operations surface). N/A but consistent -- no full-bleed or overlapping elements. | Y |
| motionPersonality | precise | Single transition on the button only: 100ms duration, cubic-bezier(0.2,0,0,1) easing from profile. No decorative animation. | Y |
| displayTransform | none | No uppercase transforms on any text. Room number, badge labels, and button text all use normal case. | Y |

### Category A/B -- Structural Fields

| Field | Profile Value | My Choice | Consistent? |
|-------|--------------|-----------|-------------|
| scaleRatio | 1.2 | Heading is text-base (1rem), body is text-sm (0.875rem). Ratio: 1rem/0.875rem = 1.14. Table text is text-xs (0.75rem). The step from xs to sm is 0.875/0.75 = 1.17. Approximate adherence to 1.2 minor-third scale. | Y |
| bodySize | 0.875rem | Guest name uses text-sm (0.875rem). Dates and table use text-xs for secondary information. | Y |
| defaultRadius | md | Card uses rounded-md. Badge uses rounded-md. Button uses rounded-md. | Y |
| defaultElevation | flat (operations mode) | No shadow classes anywhere. Card is flat with border only. | Y |
| defaultBorder | defined | Card has border border-border (1px solid). No double or bold borders. | Y |
| tableStyle | striped | Alternating rows via bg-table-row-alt on odd rows, transparent on even rows. | Y |

---

## Brand-Fit Assessment

**Does this look like a hotel operations tool? (1-5):** 4
The card prioritises scannable room identity (large room number), operational status (color-coded badge), and guest/date information in a compact footprint. The data table surfaces the three most common reception desk queries (nights, tax, minibar). The green primary signals operational readiness consistent with hospitality PMS conventions. Deducted one point because the card does not include a room-type indicator (single/double/suite) which real PMS tools typically show.

**Is the information density appropriate for staff use? (1-5):** 5
Six distinct data points plus an action in a card with 0.75rem padding. The table rows use py-1 (4px vertical). No wasted space. A 4-column grid of these cards fits comfortably on a standard 1280px dashboard.

**Does it use the hospitality green primary? (Y/N):** Y
`bg-primary` (142 72% 30%) on the CTA button; `bg-primary/12` and `text-primary` on status badges; `ring-focus-ring` (142 72% 30%) on focus state.

**Is it compact enough for a multi-card dashboard layout? (Y/N):** Y
The example layout demonstrates 1/2/3/4 column responsive grid. Each card has minimal internal whitespace (p-3, mt-2, mt-3 gaps). No fixed width or height constraints -- cards flow naturally in the grid.

---

## Distinctiveness

This component would look different from a generic admin dashboard card in these specific ways:

1. **Hospitality-semantic color coding.** The status badges use a deliberate two-color system (green = guest-present states, amber = action-required states, gray = empty) that maps to hotel operations mental models rather than generic red/yellow/green traffic-light patterns.

2. **Date pair presentation.** Check-in and check-out are shown as a single compressed line with a separator rather than two labeled fields, reflecting how reception staff think about stays (arrival/departure pair, not isolated dates).

3. **Operational data table.** The three-row striped table surfaces hotel-specific metrics (city tax status, minibar balance) that would not appear in a generic CRM or admin card. The tabular-nums class ensures financial figures align vertically across cards.

4. **Flat + bordered surface treatment.** The combination of zero shadow with a defined border creates a PMS-like interface density distinct from the elevated card patterns common in SaaS admin dashboards. This matches the profile's operations mode override explicitly.

5. **Compact badge vocabulary.** The four status states (Occupied, Vacant, Checkout Today, Arriving) are hotel-domain terms, not generic status labels. The badge styling is minimal (no icons, no pills with counts) -- appropriate for a glanceable wall-of-cards view.

What it does NOT do that a generic dashboard might: no avatar/initials circle, no progress bars, no sparkline charts, no dropdown menus, no card hover elevation lift. These omissions are intentional -- they would add visual noise without improving the core reception desk workflow of scanning room states.
