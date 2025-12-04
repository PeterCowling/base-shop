## Dashboard runtime setup

- Set `NEXT_PUBLIC_CMS_BASE_URL` when the dashboard is hosted separately from the CMS. Leave empty to use same-origin APIs.
- Enable telemetry with `NEXT_PUBLIC_ENABLE_TELEMETRY=true` and point `NEXT_PUBLIC_TELEMETRY_ENDPOINT` at your collector; optional `NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE` controls sampling (0-1).
- The dashboard pulls shop status from `/api/shops` and recent history from `/api/shop/:id/upgrade-history`; ensure those endpoints are reachable from the configured base URL.
- ⚠️ Cloudflare deployments: set `NEXT_PUBLIC_CMS_BASE_URL` to the CMS host so history/publish retry calls succeed cross-origin. Without this, calls will target the dashboard origin and fail. Same-origin proxies are available at `/api/dashboard/shops`, `/api/dashboard/shop/:id/upgrade-history`, and `/api/dashboard/shop/:id/publish-upgrade`, but they still need the base URL set to reach CMS in production.
