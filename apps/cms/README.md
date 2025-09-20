# CMS app

## End-to-end tests

Playwright covers the highest risk authoring flows for this app. The suite boots the
Next.js dev server on port `3006`, signs in as the seeded admin user, and reuses the
saved session for each spec.

```bash
pnpm --filter @apps/cms playwright
```

The tests live in [`tests/e2e`](./tests/e2e) and share their storage state at
`tests/e2e/.auth/admin.json`. The `global-setup.ts` helper recreates that file on
every run by logging in through the `/login` UI.

If you are running the suite on a fresh environment, install Playwright browsers
first:

```bash
pnpm exec playwright install --with-deps
```

The command above is safe to run repeatedly and downloads the Chromium build used in
CI.
