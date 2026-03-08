---
Task: TASK-07
Type: INVESTIGATE
Status: Complete
Date: 2026-03-08
---

# TASK-07: NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED — env gate findings

## 1. .env.example — declared?

`apps/brikette/.env.example` does **not** declare `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED`.
The only declared var is `NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY` (commented out, no value).

## 2. How the var is consumed in code

**`apps/brikette/src/config/env.ts`** (lines 21–27, 126–127):

```ts
NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED:
  process.env.NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED,
```

Exported as:
```ts
export const OCTORATE_CUSTOM_PAGE_ENABLED =
  readEnv(["NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED"]) === "1";
```

This is a **build-time** env var: Next.js inlines `process.env.NEXT_PUBLIC_*` at build time.
It evaluates to `true` only when the string value `"1"` is supplied at build time.

**`apps/brikette/src/utils/octorateCustomPage.ts`** (line 97):
```ts
const mode = OCTORATE_CUSTOM_PAGE_ENABLED ? "custom_page" : "direct";
```

When `OCTORATE_CUSTOM_PAGE_ENABLED` is `false`, `buildHostelBookingTarget` returns `mode: "direct"` and `url` is the raw Octorate URL — no internal `/book/secure-booking` route is used.

**`apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`** also gates on this var — it gates whether the secure-booking shell page is reachable.

## 3. CI / deployment config evidence

**CI workflow: `.github/workflows/brikette.yml`** (line 219):

```
OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY=1 ...
```

`NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` is **not present** in the production build command. The var is not set in:
- `.env.example`
- Any GitHub Actions workflow found in `.github/workflows/` (searched all `.yml` files)
- The staging fast-path workflow (`brikette-staging-fast.yml`)
- Any wrangler.toml or Cloudflare Pages configuration visible in the repo

## 4. Conclusion

**Env gate: OFF on all known deployments (staging and production).**

- `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` is not set in any CI workflow, .env.example, or deployment config found in the repo.
- In the absence of this var (or any value other than `"1"`), `OCTORATE_CUSTOM_PAGE_ENABLED` evaluates to `false`.
- Effect: `buildHostelBookingTarget` always returns `mode: "direct"`, and the secure-booking shell (`/book/secure-booking`) is not used.
- The var exists in `env.ts` and is wired through the codebase, but it is not activated on any deployment.

**TASK-10 and TASK-11 may proceed.** Attribution infrastructure wiring does not depend on the shell being active. The shell-dependent acceptance criterion for in-shell checkout must remain marked UNVERIFIED pending operator activation of the env gate and completion of TASK-08 (iframe proof).
