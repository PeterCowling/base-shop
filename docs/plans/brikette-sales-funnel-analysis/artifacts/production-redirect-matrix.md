# Production Redirect / Canonical Convergence Matrix

- Task: `TASK-08`
- Verification date: `2026-03-01`
- Method: `curl -L` checks against production host

## Live Check Command

```bash
for u in \
  "https://www.hostel-positano.com/book" \
  "https://www.hostel-positano.com/en/book" \
  "https://www.hostel-positano.com/it/prenota" \
  "https://www.hostel-positano.com/en/dorms" \
  "https://www.hostel-positano.com/it/camere-condivise"; do
  echo "URL $u"
  curl -s -o /dev/null -w 'code=%{http_code} redirects=%{num_redirects} final=%{url_effective}\n' -L "$u"
done
```

## Results

| Source URL | Redirect count | Final URL | Final HTTP status | Converged? | Notes |
|---|---:|---|---:|---|---|
| `https://www.hostel-positano.com/book` | 1 | `https://hostel-positano.com/book` | 404 | No | Alias reaches canonical host but canonical path is broken. |
| `https://www.hostel-positano.com/en/book` | 1 | `https://hostel-positano.com/en/book` | 200 | Partial | Host canonicalization works; path healthy. |
| `https://www.hostel-positano.com/it/prenota` | 1 | `https://hostel-positano.com/it/prenota` | 404 | No | Canonical target for localized booking path currently broken. |
| `https://www.hostel-positano.com/en/dorms` | 1 | `https://hostel-positano.com/en/dorms` | 404 | No | Dorm canonical target not healthy in production. |
| `https://www.hostel-positano.com/it/camere-condivise` | 1 | `https://hostel-positano.com/it/camere-condivise` | 404 | No | Localized dorm path not healthy in production. |

## Live Snapshot Before TASK-08C Rollout (2026-03-07)

Method: representative `curl -L` checks against the finalized localized contract after `TASK-13E`.

| Route family | Source URL | Redirect count | Final URL | Final HTTP status | Converged? | Notes |
|---|---|---:|---|---:|---|---|
| Booking canonical | `https://www.hostel-positano.com/it/prenota` | 1 | `https://hostel-positano.com/it/prenota` | 200 | Partial | Localized booking landing is live on the apex host. |
| Booking alias | `https://www.hostel-positano.com/it/book` | 1 | `https://hostel-positano.com/it/book` | 404 | No | Alias is not redirecting to the localized canonical target. |
| Private-booking canonical | `https://www.hostel-positano.com/it/prenota-alloggi-privati` | 1 | `https://hostel-positano.com/it/prenota-alloggi-privati` | 404 | No | Final localized private-booking route is not live yet. |
| Private-booking alias | `https://www.hostel-positano.com/it/book-private-accommodations` | 1 | `https://hostel-positano.com/it/book-private-accommodations` | 200 | No | Legacy English private-booking slug is still the live winner. |
| Guide canonical | `https://www.hostel-positano.com/ja/akusesu/amaruhuikarapozita-nohebasu-hosuteruburiketute` | 1 | `https://hostel-positano.com/ja/akusesu/amaruhuikarapozita-nohebasu-hosuteruburiketute` | 404 | No | Localized guide canonical is not deployed. |
| Guide alias | `https://www.hostel-positano.com/ja/akusesu/amalfi-positano-bus` | 1 | `https://hostel-positano.com/ja/akusesu/amalfi-positano-bus` | 200 | No | Legacy English guide slug still resolves live instead of redirecting to the localized canonical slug. |

Interpretation:

- Host canonicalization (`www` -> apex) is working.
- Production is still serving a pre-route-localization edge contract for at least part of the booking and guide surface.
- `TASK-08C` is therefore a real rollout step, not a paperwork-only closure.

## Decision / Follow-up

- Host-level one-hop canonicalization (`www` -> apex) is present.
- Route-level canonical convergence is incomplete because multiple canonical targets still return `404`.
- Do not declare TASK-08 fully converged on production redirects until Cloudflare route rules are updated so each canonical booking-surface target returns `200`.

## Final Localized Canonical Contract (Post TASK-13A to TASK-13E)

These are the repo-approved canonical targets Cloudflare should converge onto once `TASK-08C` is executed. The route-localization tranche is now complete in local source and verified via `verify-route-localization` + `verify-url-coverage`.

| Route family | Canonical target contract | Legacy / alias behavior to preserve |
|---|---|---|
| Booking landing | `/{lang}/{bookSlug}` | `/book`, internal `/book`, localized wrong-locale slugs, and room-root aliases redirect in one hop |
| Private accommodations booking | `/{lang}/{privateBookingSlug}` | old English `book-private-accommodations`, apartment `/book` aliases, and misspellings redirect to the localized target |
| Dorm room details | `/{lang}/{roomsSlug}/{localizedRoomSlug}` | old English room slugs and `/dorms` / `/rooms` aliases redirect to the localized canonical room URL |
| Guide article pages | `/{lang}/{guideNamespaceSlug}/{localizedGuideSlug}` | old English guide slugs and internal guide-base aliases redirect to the localized canonical guide URL |
| Guide tag pages | `/{lang}/{experiencesSlug}/{guidesTagsSlug}/{tag}` | old internal or wrong-locale tag roots redirect/rewrite to the localized target |

## Route-Localization Closure Snapshot

- Verification date: `2026-03-07`
- Method:
  - `pnpm --filter @apps/brikette run verify-route-localization`
  - `pnpm --filter @apps/brikette exec tsx scripts/verify-url-coverage.ts`

Results:

- `verify-route-localization`
  - top-level: `0`
  - nested segment: `0`
  - special route: `0`
  - room: `0`
  - guide: `0`
- `verify-url-coverage`
  - `Cloudflare _redirects: verified (4533 localized rules)`
  - `Missing: 0`

## TASK-08C / TASK-08D Implication

- `TASK-08C` should now implement Cloudflare rules against this finalized localized contract only.
- `TASK-08D` should verify live one-hop redirects and canonical `200` targets against the same contract, not the pre-localization `2026-03-01` matrix alone.
