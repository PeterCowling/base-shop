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

## Staging Proof After Direct Pages Deploy (2026-03-07)

Method:

- Built a fresh static export locally with `.env.local` Cloudflare credentials loaded and staging-safe Axerve mock placeholders.
- Deployed directly with `wrangler pages deploy out --project-name brikette-website --branch staging`.
- Verified using cache-busted requests (`?__cb=<timestamp>`) to avoid stale staging cache hits from older deployments.

| Route family | Source URL | Final HTTP status | Final URL / redirect target | Expected result | Actual result | Notes |
|---|---|---:|---|---|---|---|
| Booking canonical | `https://staging.brikette-website.pages.dev/it/prenota?__cb=<ts>` | 200 | same URL | `200` canonical | Pass | Localized canonical booking page is live on staging. |
| Private-booking canonical | `https://staging.brikette-website.pages.dev/it/prenota-alloggi-privati?__cb=<ts>` | 200 | same URL | `200` canonical | Pass | Localized canonical private-booking page is live on staging. |
| Early legacy booking alias | `https://staging.brikette-website.pages.dev/book-dorm-bed?__cb=<ts>` | 301 | `/en/book-dorm-bed?__cb=<ts>` | one-hop redirect | Pass | Early `_redirects` entry still applies. |
| Early legacy localized booking alias | `https://staging.brikette-website.pages.dev/en/book?__cb=<ts>` | 301 | `/en/book-dorm-bed?__cb=<ts>` | one-hop redirect | Pass | Early locale-specific alias still applies. |
| Italian booking alias | `https://staging.brikette-website.pages.dev/it/book?__cb=<ts>` | 404 | same URL | redirect to `/it/prenota` | Fail | Localized alias family is missing in live staging behavior. |
| Italian private-booking alias | `https://staging.brikette-website.pages.dev/it/book-private-accommodations?__cb=<ts>` | 404 | same URL | redirect to `/it/prenota-alloggi-privati` | Fail | Localized private-booking alias is missing in live staging behavior. |
| Italian guide alias | `https://staging.brikette-website.pages.dev/it/help/how-to-reach-positano-on-a-budget?__cb=<ts>` | 404 | same URL | redirect to localized guide slug | Fail | Later guide alias family is missing in live staging behavior. |
| Japanese top-level alias | `https://staging.brikette-website.pages.dev/ja/about?__cb=<ts>` | 404 | same URL | redirect to `/ja/annai` | Fail | Later top-level localized alias is missing in live staging behavior. |

Rule-count evidence from the deployed artifact:

- `apps/brikette/out/_redirects`
  - static rules: `4016`
  - dynamic rules: `601`
  - total rules: `4617`

Interpretation:

- The direct staging deploy proves the build/export/deploy path is healthy and the localized canonical targets themselves are valid.
- The remaining defect is the alias-routing layer, not the pages.
- Cloudflare Pages documents `_redirects` limits of `2000` static and `100` dynamic rules. Our generated file exceeds both limits substantially.
- Inference from staging behavior: Pages is honoring only an early subset of the `_redirects` file, which is why early English alias routes still return `301` while later localized alias families fall through to `404`.
- `TASK-08C` therefore cannot be closed by promoting the current `_redirects` artifact alone; it requires a smaller redirect contract or a different Cloudflare routing layer for the overflow alias families.

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

## Route-Localization / Static-Runtime Closure Snapshot

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
  - `Historical legacy URLs: 3435`
  - `Localized canonicals: 3956`
  - `Structural _redirects rules: 83`
  - `Exact legacy redirects: 2757`
  - `Pages Function include rules: 32`
  - `Missing: 0`

Interpretation:

- The supported public contract is now explicit:
  - current localized canonicals
  - supported historical URLs from `apps/brikette/src/test/fixtures/legacy-urls.txt`
  - a small structural redirect set
- The canonical inventory now excludes:
  - top-level hostel booking pages (`/{lang}/{bookSlug}`) while those routes remain `noindex,follow`
  - private-room booking helper routes (`/{lang}/{privateRoomsSlug}/book`) that redirect to the top-level private-booking canonical
- Synthetic alias debt such as `/it/book` is intentionally out of scope and should not be reintroduced as redirect “coverage”.
- The Pages runtime contract now fits the platform model:
  - `_redirects` remains small
  - high-cardinality exact legacy redirects move to the scoped Pages Function layer

## TASK-08C / TASK-08D Implication

- `TASK-08C` should now deploy the hybrid static-runtime contract, not the old preserve-everything `_redirects` artifact.
- `TASK-08D` should verify live behavior against the curated support boundary:
  - canonical localized booking/private-booking routes return direct `200`
  - supported historical URLs redirect in one hop through either `_redirects` or the scoped Pages Function layer
  - intentionally dropped synthetic aliases such as `/it/book` return `404`

## Staging Deployment Status After TASK-14B

- Repo-side implementation and deploy preflight are complete.
- `pnpm preflight:brikette-deploy -- --json` passes.
- A fresh staging proof is still pending because the current local Cloudflare API token in `.env.local` is invalid as of `2026-03-07`, so direct `wrangler pages deploy` cannot authenticate from this workspace yet.
