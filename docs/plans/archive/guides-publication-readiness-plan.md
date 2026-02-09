> **Status: Superseded** — Absorbed into the [Unified Guide System Plan](../../.claude/plans/vivid-scribbling-pumpkin.md). All tasks from this plan are either completed or tracked there.

---
Type: Plan
Status: Active
Domain: Brikette Guides
Relates-to charter: none
Created: 2026-02-04
Last-reviewed: 2026-02-04
Last-updated: 2026-02-04
Supersedes: docs/plans/how-to-get-here-guides-publication-plan.md
Feature-Slug: guides-publication-readiness
---

# Guides Publication Readiness Plan


## Active tasks

No active tasks at this time.

## Summary

Track and drive “ready to go live” status for Brikette guides. This plan is a **readiness tracker** (what’s left, what’s done, and the evidence) plus a set of **promotion gates** so moving a guide to `status: "live"` is deliberate and repeatable.

## Scope

- **In-scope:** Guides rendered via the guide system (`apps/brikette/src/routes/guides/**`) that we want to promote to `live` in `apps/brikette/src/routes/guides/guide-manifest.ts`.
- **Out-of-scope:** How-to-get-here route rendering changes, translation pipeline work, or large SEO refactors.

## Success Signals (What “Good” Looks Like)

- Targeted guides are `status: "live"` in the manifest and render correctly at their canonical URLs.
- For each promoted guide, we have evidence for:
  - schema-valid guide content
  - valid `%LINK/%URL/%HOWTO` tokens (no broken internal links)
  - acceptable SEO metadata (title/description) and no obviously hostile tone for policy sections
  - translation posture is explicit (either complete + current, or knowingly stale with a follow-up task)

## Promotion Gates (per guide)

These gates map to the manifest checklist categories.

1. **Content (required)**
   - Content reads clearly (scannable sections, consistent tone)
   - No accidental policy escalation (threatening language without explanation)
2. **Links (required)**
   - `pnpm --filter @apps/brikette validate-links -- --guides=<guideKey> --locale=en` passes
3. **Schema (required)**
   - `pnpm --filter @apps/brikette validate-content -- --guides=<guideKey> --locale=en` passes
4. **Translations (required for live unless explicitly exempted)**
   - Non-EN locales exist and are not placeholders for the guide’s core policy text.
   - If EN changed materially after translation, document whether translations must be refreshed.
5. **FAQs / JSON-LD (situational)**
   - If the guide has FAQs, ensure FAQ JSON-LD is present and correct.
   - If no FAQs, the checklist should explicitly record that (don’t leave it ambiguous).
6. **SEO audit (required before live)**
   - Title/description are accurate and not over-claiming.
   - No broken canonical/og assumptions for this guide page.

## Tracker

Legend:
- ✅ complete
- 🟡 in progress
- ⛔ missing / blocked

### Help guides (policies / assistance)

| Guide key | Manifest status | Translations | Content | Links | Schema | JSON-LD | FAQs | SEO audit | Notes / evidence | Next action |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| `ageAccessibility` | `draft` | ✅ | ✅ | ✅ | ✅ | ✅ | ⛔ | 🟡 | EN revised 2026-02-04 for clarity + tone; targeted validators pass (EN). Manifest checklist note updated. | Decide FAQ posture (add FAQs vs explicitly “no FAQs”); complete SEO audit; then promote to `live`. |

### How-to-get-here guides

This plan supersedes the old “how-to-get-here guides publication” naming, but the tracker is intentionally generic: it can include route-like guides and traditional editorial guides.

- Add guide keys to the tracker as they’re selected for promotion (don’t mass-list 24 routes unless they’re actively being worked).
- Use the same promotion gates above; route-like guides tend to require additional attention on:
  - time-sensitive claims (schedules, prices)
  - cross-linking to backups (bus vs ferry, last departure guidance)

## Progress Log

- 2026-02-04: `ageAccessibility` English copy improved for readability and explanatory tone; EN schema + link validation run and passing.

