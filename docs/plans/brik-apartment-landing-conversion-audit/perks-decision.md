---
Type: Decision-Artifact
Task: TASK-04
Status: Approved
Owner: Peter Cowling (product/ops)
Approved: 2026-02-17
---

# Direct-Booking Perks — Apartment Route Policy

## Decision

**Option B: Perks do not apply to apartment routes. Suppress notification banner on all apartment routes.**

## Policy Flag

```
perks_apply_apartment: false
```

## Rationale

The notification banner exists to recover price-sensitive hostel guests from OTA platforms. The apartment has a different ICP (couples seeking independence), a different booking engine (Octorate direct), and different pricing dynamics. Hostel perks promises (e.g. "best price guaranteed", "free cancellation on direct bookings") cannot be uniformly applied to apartment rate types without separate commercial approval.

Showing hostel perks on apartment pages:
- Creates misleading expectations (rate rules differ between products)
- Generates support escalations ("you promised best price but Booking.com is cheaper")
- Dilutes both product identities

## Enforcement

- `NotificationBanner.tsx` must not render on any route matching `/[lang]/apartment/**`
- Implementation: check `usePathname()` for `/apartment` prefix and return `null` if matched
- The banner continues to render normally on all non-apartment routes

## Apartment Value Stack (alternative to perks banner)

The apartment's direct-booking value is expressed through:
- WhatsApp direct contact (on-page CTA)
- Step-free arrival claim (unique in Positano)
- Professional hospitality next door (independence with support)

These are surfaced in `ApartmentPageContent.tsx` and sub-pages, not via the hostel banner.

## Future State

If an apartment-specific perks programme is approved (e.g. "direct booking includes breakfast"), create a separate apartment notification component. Do not reuse the hostel banner.

## Sign-off

- Owner: Peter Cowling
- Date: 2026-02-17
- Method: Verbal approval via build session — decisions recorded in plan Decision Log
