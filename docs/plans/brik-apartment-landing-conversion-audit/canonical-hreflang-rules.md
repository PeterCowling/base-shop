---
Type: Decision-Artifact
Task: TASK-06
Status: Approved
Owner: Peter Cowling (product/ops)
Approved: 2026-02-17
---

# Canonical Host, Hreflang Locale Matrix, and Rules

## Decision

**Canonical host: `www.brikette.com`**

All canonical tags, hreflang entries, sitemap URLs, and redirect rules use `https://www.brikette.com`.

## Enforcement

| Layer | Rule |
|---|---|
| Cloudflare edge | 301 redirect: `brikette.com/*` → `https://www.brikette.com/*` |
| Next.js metadata | `metadataBase` set to `https://www.brikette.com` |
| Canonical tags | Always `https://www.brikette.com/[lang]/[slug]` |
| Hreflang | Always `https://www.brikette.com/[lang]/[slug]` |
| Sitemap | Always `https://www.brikette.com/[lang]/[slug]` |

## Hreflang Locale Matrix (apartment routes)

| Locale | hreflang value | Canonical URL pattern |
|---|---|---|
| en | `en` | `https://www.brikette.com/en/apartment` |
| it | `it` | `https://www.brikette.com/it/appartamento` |
| de | `de` | `https://www.brikette.com/de/apartment` |
| fr | `fr` | `https://www.brikette.com/fr/appartement` |
| es | `es` | `https://www.brikette.com/es/apartamento` |
| pt | `pt` | `https://www.brikette.com/pt/apartamento` |
| ru | `ru` | `https://www.brikette.com/ru/apartment` |
| zh | `zh` | `https://www.brikette.com/zh/apartment` |
| ja | `ja` | `https://www.brikette.com/ja/apartment` |
| ko | `ko` | `https://www.brikette.com/ko/apartment` |
| ar | `ar` | `https://www.brikette.com/ar/apartment` |
| hi | `hi` | `https://www.brikette.com/hi/apartment` |
| vi | `vi` | `https://www.brikette.com/vi/apartment` |
| pl | `pl` | `https://www.brikette.com/pl/apartment` |
| sv | `sv` | `https://www.brikette.com/sv/apartment` |
| no | `no` | `https://www.brikette.com/no/apartment` |
| da | `da` | `https://www.brikette.com/da/apartment` |
| hu | `hu` | `https://www.brikette.com/hu/apartment` |
| x-default | `x-default` | `https://www.brikette.com/en/apartment` |

> Note: Locale slug translations for "apartment" (e.g. `appartamento`, `appartement`, `apartamento`) should be verified against the existing slug-map before TASK-13 ships.

## Sign-off

- Owner: Peter Cowling
- Date: 2026-02-17
- Method: Verbal approval via build session — decisions recorded in plan Decision Log
