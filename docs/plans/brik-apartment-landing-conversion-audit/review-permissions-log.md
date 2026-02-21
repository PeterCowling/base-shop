---
Type: Decision-Artifact
Task: TASK-05
Status: Approved
Owner: Peter Cowling (product/ops)
Approved: 2026-02-17
---

# Review Source Policy and Schema Eligibility Log

## Decision

**Option B: Testimonials as static attributed copy. Review schema (`AggregateRating`) disabled until first-party on-page data is collected.**

## Schema Eligibility Rule

Review schema may only be enabled when ALL of the following conditions are met:

1. Reviews are collected directly by Brikette (not aggregated from third parties).
2. The review content (text + rating + reviewer name + date) is visible on the apartment page itself.
3. At least 5 compliant reviews exist.
4. A documented collection method exists (e.g. post-stay form, verified email workflow).

**Current status: INELIGIBLE.** No first-party on-page review data exists. Schema remains disabled.

## Rollback Trigger

If review schema is enabled and subsequently:
- A review source is found to be third-party aggregated, or
- The review content is removed from the page

→ disable `AggregateRating` immediately and file a regression task.

## Candidate Review Sources

| Source | Rights status | On-page visible | Schema eligible |
|---|---|---|---|
| Booking.com guest reviews | Third-party; no embedding rights | No | No |
| Google Maps reviews | Third-party; no embedding rights | No | No |
| Direct guest WhatsApp/email quotes | First-party; requires explicit consent | Yes (if published) | Potentially — pending collection |
| Post-stay feedback form (not yet built) | First-party | Yes (if published) | Yes — once 5+ collected |

## Testimonial Policy (permitted now)

Static quoted testimonials with:
- Guest first name + country/month (e.g. "Anna, Germany — September 2025")
- Explicit consent from the guest before publication
- No numeric rating (star or score) unless first-party schema eligibility is met

## First-Party Collection Path

Create a post-stay outreach workflow (WhatsApp or email) that:
1. Asks for a short quote and permission to publish
2. Records consent with date and guest reference
3. Publishes the quote on the apartment page with attribution

This is a separate task; not in scope for this plan.

## Sign-off

- Owner: Peter Cowling
- Date: 2026-02-17
- Method: Verbal approval via build session — decisions recorded in plan Decision Log
