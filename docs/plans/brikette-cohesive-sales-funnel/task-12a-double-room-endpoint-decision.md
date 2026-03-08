# TASK-12a Decision: Double-Private-Room Booking Endpoint

**Date:** 2026-03-08
**Status:** Resolved
**Decision owner:** Peter Cowling (operator)

## Question

Does the double private room share the apartment booking page (Option A) or require a
separate Octorate endpoint (Option B)?

## Operator Input

> "separate"

## Decision: Option B — Separate Endpoint

The double private room has distinct Octorate rate codes from the apartment:

| Rate plan | Rate code |
|-----------|-----------|
| NR (non-refundable) | `433883` |
| Flex | `433894` |

Apartment rate codes (for comparison): NR 2pax=`804934`, flex 2pax=`804933`.

These are already present in `apps/brikette/src/data/roomsData.ts` (id: `double_room`).

## Implementation Instruction for TASK-12

Create a separate Brikette booking page at `/[lang]/private-rooms/double-room/book`
that constructs its own Octorate `calendar.xhtml` URL using the double room rate codes
(`433883` NR / `433894` flex) with `codice=45111` and fixed `pax=2`.

The apartment booking page (`/[lang]/private-rooms/book`) remains unchanged — it
serves apartment intent only and its rate codes are not shared.

Update `PrivateRoomsSummaryContent.tsx` so:
- Apartment card → `getPrivateBookingPath(lang)` (unchanged)
- Double room card → `getDoubleRoomBookingPath(lang)` (new route)

Both cards must write attribution to session storage on CTA click with the correct
`product_type` before navigation, using a thin client CTA wrapper.
