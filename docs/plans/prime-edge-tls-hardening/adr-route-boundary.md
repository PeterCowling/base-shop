---
Status: Draft
Date: 2026-03-06
Feature-Slug: prime-edge-tls-hardening
---

# ADR: Prime Route Boundary — Public, Guest-Gated, and Staff-Only

## Context

The Prime guest portal runs on `guests.hostel-positano.com` (Cloudflare Pages static export).
As part of the edge hardening plan (`prime-edge-tls-hardening`), the public/staff/guest route
boundary was audited to determine which routes are candidates for future Cloudflare Access rules.

This ADR records the classification for reference when CF Access work is actioned (flagged
`adjacent_later` — not in scope for the current hardening plan).

## Route Classification

### Public routes — no auth required

These routes are reachable by anyone. Token-entry and booking-lookup flows live here.

| Route | Notes |
|---|---|
| `/` | Landing / home page |
| `/g/*` | Guest token entry point — URL carries the guest token in the path |
| `/find-my-stay` | Booking lookup by reference or email |

### Guest-gated routes — guarded layout

These routes sit under `apps/prime/src/app/(guarded)/layout.tsx`, which enforces
`validateGuestToken` + `readGuestSession` + `PinAuthProvider`. A valid guest token or PIN
is required at the server side; unauthenticated requests are redirected to `/g/`.

These routes **must NOT** be placed behind CF Access — doing so would block legitimate guests
who have not enrolled in any SSO provider.

| Route | Notes |
|---|---|
| `/activities` | Activity listings for the guest's stay |
| `/account/profile` | Guest profile management |
| `/bag-storage` | Bag storage request flow |
| `/bar-menu` | Bar menu |
| `/booking-details` | Guest booking summary |
| `/breakfast-menu` | Breakfast menu |
| `/cash-prep` | Cash preparation checklist (guest-facing) |
| `/chat` | In-app chat |
| `/complimentary-breakfast` | Complimentary breakfast info |
| `/complimentary-evening-drink` | Complimentary drink info |
| `/digital-assistant` | Digital assistant interface |
| `/eta` | ETA submission for check-in coordination |
| `/language-selector` | Language preference selector |
| `/late-checkin` | Late check-in instructions |
| `/main-door-access` | Door code delivery and access instructions |
| `/overnight-issues` | Overnight issue reporting |
| `/portal` | Guest session portal (session-gated in-page at `src/app/portal/page.tsx`) |
| `/positano-guide` | Local area guide |
| `/routes` | Route suggestions |

### Staff/owner-only routes — `canAccessStaffOwnerRoutes()` gate

These routes call `canAccessStaffOwnerRoutes()` (confirmed in source) and redirect
unauthenticated staff to a staff login page. They do not use the guest token flow.

| Route | Source reference | Notes |
|---|---|---|
| `/checkin/*` | `src/app/checkin/page.tsx:10-13` | Check-in management |
| `/staff-lookup/*` | `src/app/staff-lookup/` | Guest lookup by staff |
| `/admin` | `src/app/admin/` | Admin panel |
| `/owner` | `src/app/owner/page.tsx:30-33` | Owner-only reporting |

## Decision

**CF Access candidates:** staff/owner routes (`/checkin`, `/staff-lookup`, `/admin`, `/owner`).

These routes are protected by application-layer staff auth today, but adding a CF Access layer
(OIDC or One-Time PIN) would provide edge-level enforcement before any request reaches the
Pages Functions runtime. This is the recommended next step before any public promotion of
staff tooling.

**Not CF Access candidates:** guest-gated routes (above).

Guest routes enforce token/PIN auth server-side. CF Access would require guests to authenticate
via an SSO provider, which is incompatible with the token-in-URL / no-account-required guest
UX. Do not add CF Access to guest-gated routes.

**Public routes:** no additional access control recommended at this time. `/g/*` and
`/find-my-stay` are intentionally public entry points.

## WAF Note

Cloudflare managed WAF rulesets require CF Pro or higher. The current plan assumes the Free
plan. Managed WAF is deferred pending confirmation of the CF plan level. If Pro+ is confirmed,
enabling the OWASP Core Ruleset on `guests.hostel-positano.com` is recommended as a follow-on
action.

## Consequences

- Staff routes behind CF Access: adds an edge authentication layer. Staff must authenticate
  with the OIDC provider configured in CF Access before reaching the Pages Functions runtime.
  One-Time PIN is the lowest-friction option for a small staff team without an existing IdP.
- Guest routes unchanged: guest UX is unaffected. Token-based entry continues as today.
- Public routes unchanged: no new friction for booking lookup or token entry.

## Status

Draft — no CF Access rules have been applied. This ADR captures the route classification and
recommendation for when CF Access work is scheduled.
