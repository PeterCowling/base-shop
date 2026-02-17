---
Type: Decision-Artifact
Task: TASK-03
Status: Approved
Owner: Peter Cowling (ops/legal)
Approved: 2026-02-17
---

# Apartment Legal Terms Scope and Route Label Rules

## Decision

**Option B: Neutral global terms label. One T&C document covers all Brikette accommodations.**

No separate apartment-specific terms document is required at this stage.

## Label Rule

| Route context | Footer label text | Target |
|---|---|---|
| All routes (hostel and apartment) | "Terms & conditions" | Existing terms page |

The label must NOT say "Hostel terms", "Hostel terms & conditions", or any hostel-specific framing on apartment routes.

## Required T&C Text Audit

Before TASK-07 ships the footer label change, the existing terms document must be checked for hostel-specific language. The following terms must not appear in the global T&C when it is linked from apartment routes:

- "dormitory" or "dorm"
- "shared room" or "shared bed"
- "bunk"

If any of these appear, update the T&C document to use accommodation-neutral language before changing the footer label.

## Apartment-Specific Policy Surface

Apartment-specific cancellation and rate terms (non-refundable vs. flexible) are already surfaced in the booking UI (rate selection step in ApartmentBookContent.tsx). No additional legal surface is required in the footer.

## Locale Implications

The neutral label "Terms & conditions" should be translated per locale using the existing footer translation keys. No new keys required — verify that `footer.termsLabel` (or equivalent) does not contain hostel-specific text in non-EN locales.

## Sign-off

- Owner: Peter Cowling
- Date: 2026-02-17
- Method: Verbal approval via build session — decisions recorded in plan Decision Log
