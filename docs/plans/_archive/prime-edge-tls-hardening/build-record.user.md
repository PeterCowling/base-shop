# Build Record — Prime Edge TLS Hardening

**Plan:** `docs/plans/prime-edge-tls-hardening/plan.md`
**Build date:** 2026-03-06
**Business:** BRIK

## Outcome Contract

- **Why:** The Prime guest portal was promoted to a public custom domain (`guests.hostel-positano.com`), making the Cloudflare edge posture part of the real production attack surface. The zone was on `ssl=flexible` and `min_tls_version=1.0`, which is materially weak for a live guest-facing product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The `hostel-positano.com` zone is hardened with Full (strict) SSL, TLS 1.2 minimum, and browser security headers. The public/staff/guest route boundary is documented. A CI healthcheck validates the custom domain on every deploy.
- **Source:** operator

## What Was Delivered

### Zone settings (live — applied directly to hostel-positano.com)
- `ssl` changed from `flexible` → `strict` (Full strict mode)
- `min_tls_version` changed from `1.0` → `1.2`
- `always_use_https` was already `on` — confirmed and left in place

### Script (`scripts/src/ops/apply-prime-zone-hardening.ts`)
- Repeatable, version-controlled tool for applying/rolling back zone settings
- `--dry-run`, `--rollback`, `--zone` flags; pre-flight managed cert check; per-setting PATCH with read-back confirmation; clear partial-failure reporting
- Runnable via `pnpm --filter scripts prime:apply-zone-hardening`

### Security headers (`apps/prime/public/_headers`)
- Strict-Transport-Security (HSTS, max-age=31536000, includeSubDomains)
- X-Content-Type-Options, X-Frame-Options: DENY, Referrer-Policy, Permissions-Policy
- Content-Security-Policy with complete Firebase connect-src allow-list (Realtime DB HTTP+WSS, identitytoolkit, securetoken, authDomain)
- Deploys to production on next merge to main

### CI extension (`.github/workflows/prime.yml`)
- New top-level job `healthcheck-custom-domain` runs after every main deploy
- Checks `https://guests.hostel-positano.com` with 12 retries / 10s delay to handle CF propagation

### Route boundary ADR (`docs/plans/prime-edge-tls-hardening/adr-route-boundary.md`)
- Public, guest-gated (guarded layout), and staff/owner routes classified from source
- CF Access recommendation: staff routes (`/checkin`, `/staff-lookup`, `/admin`, `/owner`) are candidates; guest routes must not be gated
- WAF deferred pending CF plan level confirmation

## Smoke Test Results (TASK-03 checkpoint)

| Test | Result |
|---|---|
| `curl -sv https://guests.hostel-positano.com` — TLS version | TLSv1.3 ✓ |
| `curl -I http://guests.hostel-positano.com` — HTTP redirect | 301 → HTTPS ✓ |
| `curl -sv https://www.hostel-positano.com` — brikette unaffected | TLSv1.3 ✓ |
| `curl --tls-max 1.1 https://guests.hostel-positano.com` — old TLS rejected | SSL error: tlsv1 alert protocol version ✓ |

## What Remains

- **Brikette CI healthcheck** — next scheduled CI run will confirm zone change has no impact on the brikette pipeline (manually verified via curl; CI confirmation pending).
- **`_headers` deploy** — file is committed; takes effect when this branch merges to main and CI deploys prime.
- **CF Access on staff routes** — documented in ADR as next step (separate dispatch `adjacent_later`).
- **Guest auth/session hardening** — separate dispatch IDEA-DISPATCH-20260306191000-9028 (not in scope for this plan).
