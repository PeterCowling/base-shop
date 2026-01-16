# Product Pipeline

Standalone product sourcing pipeline UI + engine. This app deploys to Cloudflare Pages as `product-pipeline` and talks to a dedicated Worker API.

## Local development

```bash
pnpm --filter @apps/product-pipeline dev
```

## Build (Cloudflare Pages)

```bash
pnpm --filter @apps/product-pipeline exec next-on-pages
pnpm --filter @apps/product-pipeline exec wrangler pages dev .vercel/output/static \
  --compatibility-flag=nodejs_compat \
  --port 3012
```

## Notes

- This app uses Pages Functions (Next route handlers) and is not compatible with
  `OUTPUT_EXPORT=1`.
- The UI talks to the Worker API for pipeline operations.
- Access control is expected via Cloudflare Access (single-user key) in production.
- Cloudflare bindings are defined in `apps/product-pipeline/wrangler.toml`.
- Localization: English-only forever for this app; do not add or propose additional locales.

## Stage M runner (Playwright/headed capture)

Use the runner script to process Stage M jobs with human-gated, headed capture and screenshot artifacts:

```bash
pnpm --filter @apps/product-pipeline exec tsx scripts/runner.ts \
  --capture --playwright --headful --human \
  --base-url http://localhost:3012 \
  --artifact-kind snapshot_html \
  --screenshot-kind snapshot_png
```

Flags:

- `--playwright`: use Playwright instead of raw fetch (requires `pnpm dlx playwright install chromium` once locally).
- `--headful`: show the browser; pair with `--human` to pause for manual login/scroll before capture.
- `--human`: prompts to continue/skip capture (guards against unintended scraping).
- `--wait-selector <css>`: optional wait before capture for late-loading content.
- `--no-screenshot`: disable screenshot artifact upload (HTML snapshot still uploads if enabled).
- `--user-data-dir <path>`: persist sessions/cookies between runs (for sites requiring login).
- `--scroll-steps <n>`: auto-scroll N times before capture to load results.
- `--post-nav-wait-ms <ms>`: add an explicit wait after navigation.
- `--playbook <auto|amazon_search|amazon_listing|taobao_listing>`: assisted capture defaults (selectors/scroll/waits).
- `--no-playbook`: disable assisted playbooks and use explicit flags only.
- `--session-root <path>`: root directory for rotating Playwright sessions.
- `--session-rotate <none|daily|per-job|per-candidate>`: rotation strategy when using `--session-root`.
- `--session-profile <name>`: session namespace (defaults to site or capture profile).
- `--claim-mode <runner|queue>`: claim only jobs tagged for human runner or queue worker.

Routing Stage M jobs:

- Set `PIPELINE_STAGE_M_CAPTURE_MODE_AMAZON=runner` (or `..._TAOBAO`) in the Worker env to keep those jobs off the queue and let the human runner claim them.
- Set `PIPELINE_STAGE_M_CAPTURE_PROFILES_AMAZON=profile1,profile2` (and/or `..._TAOBAO`) to allowlist runner capture profiles; runner mode requires a capture profile.
