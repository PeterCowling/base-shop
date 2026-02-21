---
Type: Decision-Artifact
Task: TASK-06
Status: Approved
Owner: Peter Cowling (product/ops)
Approved: 2026-02-17
---

# Internal Link Map v1 — Apartment Routes (EN)

All outbound links from apartment pages use canonical `www.brikette.com` host and localised slug patterns.

## Apartment Hub (`/en/apartment`)

| Link target | Canonical URL | Purpose |
|---|---|---|
| Street-level arrival sub-page | `/en/apartment/street-level-arrival/` | Intent card — arrival info |
| Private stay sub-page | `/en/apartment/private-stay/` | Intent card — stay info |
| Apartment booking page | `/en/apartment/book/` | Primary CTA |
| WhatsApp direct | `https://wa.me/393287073695` | Assisted conversion |

## Apartment Booking (`/en/apartment/book`)

| Link target | Canonical URL | Purpose |
|---|---|---|
| Back to apartment hub | `/en/apartment/` | Breadcrumb / back link |
| Octorate (JS path) | `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111` | Primary booking engine |
| Octorate (no-JS fallback) | `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111` | noscript static link |
| WhatsApp direct | `https://wa.me/393287073695` | Assisted conversion |

## Street-Level Arrival (`/en/apartment/street-level-arrival`)

| Link target | Canonical URL | Purpose |
|---|---|---|
| Apartment booking page | `/en/apartment/book/` | CTA |
| WhatsApp direct | `https://wa.me/393287073695` | Quick answers CTA |

## Private Stay (`/en/apartment/private-stay`)

| Link target | Canonical URL | Purpose |
|---|---|---|
| Apartment booking page | `/en/apartment/book/` | CTA |
| WhatsApp direct | `https://wa.me/393287073695` | Quick answers CTA |

## Fallback Policy for Non-EN Locales

Non-EN locales use the same link structure with localised slug prefixes. Where slug translations exist in the slug-map (e.g. `appartamento` for IT), those are used. Where no translation exists, the EN slug is preserved. Verify against `packages/ui/src/slug-map.ts` before TASK-13 ships.
