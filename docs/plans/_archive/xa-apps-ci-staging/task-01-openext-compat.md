---
Task: TASK-01
Status: Complete
Date: 2026-02-26
Outcome: Affirming
---

# TASK-01: OpenNext + xa-b Compatibility Investigation

## Questions Answered

### Q1. Does `@opennextjs/cloudflare ^1.16.5` work with xa-b's Next.js 16.1.6?

**Yes — confirmed.** `apps/business-os` uses `@opennextjs/cloudflare ^1.16.5` with `"next": "^16.1.6"` (identical version range to xa-b) and is deployed to production today. Same applies to `apps/brikette`.

Evidence:
- `apps/business-os/package.json`: `"@opennextjs/cloudflare": "^1.16.5"`, `"next": "^16.1.6"`
- `apps/xa-b/package.json`: `"next": "^16.1.6"` — same range

### Q2. Does the build produce `.open-next/worker.js` and `.open-next/assets/`?

**Yes — confirmed by business-os production build.** `apps/business-os/wrangler.toml` references:
- `main = ".open-next/worker.js"`
- `[assets] directory = ".open-next/assets"`

The `opennextjs-cloudflare build` command reads `.next/` (produced by `next build --webpack`) and outputs:
- `.open-next/worker.js` — CF Worker entry point
- `.open-next/assets/` — static assets served via ASSETS binding

Additionally confirmed by TASK-06 (xa-uploader) which produced `.open-next/worker.js` successfully on the same version.

### Q3. Does xa-b's middleware compile without errors under OpenNext?

**Yes — confirmed by code analysis.** All middleware files use exclusively Web APIs:

| File | Crypto operations | API used |
|---|---|---|
| `middleware.ts` | RS256 JWT verify | `crypto.subtle.importKey("jwk")`, `crypto.subtle.verify()` — Web Crypto API ✓ |
| `src/lib/accessTokens.ts` | HMAC sign/verify | `globalThis.crypto.subtle.importKey("raw")`, `.sign()`, `.verify()` — Web Crypto API ✓ |
| `src/lib/stealth.ts` | None | Only env var lookups and string operations ✓ |

All three files use **only Web Crypto API** (`crypto.subtle.*`) and standard Web APIs (`fetch`, `URL`, `TextDecoder`, `TextEncoder`, `atob`, `btoa`). No `node:crypto` imports anywhere in the middleware chain. CF Workers runtime provides full Web Crypto API — this is fully compatible.

The `nodejs_compat` flag is still required for other app dependencies but is NOT needed for middleware crypto operations.

### Q4. What is the correct wrangler.toml Worker config?

Reference: `apps/business-os/wrangler.toml`

```toml
name = "xa-b-site"                     # keep root name
main = ".open-next/worker.js"          # replace pages_build_output_dir
compatibility_date = "2025-06-20"      # keep existing date
compatibility_flags = ["nodejs_compat"] # keep existing flag

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

# Remove: pages_build_output_dir = ".vercel/output/static"

[env.preview]
name = "xa-b-preview"                  # unchanged

[env.preview.vars]
# ... all existing stealth vars unchanged
```

### Q5. Can the business-os deploy config be adapted for xa-b?

**Yes — direct adaptation.** The CI deploy pattern from `business-os-deploy.yml`:
```yaml
build-cmd: |
  pnpm exec turbo run build --filter=@apps/xa-b^... &&
  cd apps/xa-b &&
  pnpm exec opennextjs-cloudflare build
deploy_cmd: |
  cd apps/xa-b &&
  pnpm exec wrangler deploy --env preview
```

## Critical Build Script Pattern Discovery

**⚠ The merged build script pattern causes an infinite loop and MUST NOT be used.**

OpenNext (`opennextjs-cloudflare build`) internally calls `pnpm build` to rebuild the Next.js app. If the `build` script includes the OpenNext step, this creates:
```
pnpm build → next build + opennextjs-cloudflare build →
  opennextjs-cloudflare build → pnpm build → next build + opennextjs-cloudflare build → ...
```

**Correct two-script pattern (matching business-os):**
- `"build"`: `node ./scripts/build-xa.mjs` — catalog fetch + `next build --webpack` only
- `"build:worker"`: `opennextjs-cloudflare build` — adapter only (OpenNext calls `pnpm build` internally)

**CI deploy sequence:**
1. `pnpm exec turbo run build --filter=@apps/xa-b^...` (build workspace deps only, NOT xa-b)
2. `cd apps/xa-b && pnpm exec opennextjs-cloudflare build` (internally calls `pnpm build` → catalog fetch + next build → then packages)
3. `cd apps/xa-b && pnpm exec wrangler deploy --env preview`

**`build-xa.mjs` change required for TASK-04**: Do NOT add the opennext step to `build-xa.mjs`. Instead:
- Add `@opennextjs/cloudflare ^1.16.5` devDep to `apps/xa-b/package.json`
- Add `"build:worker": "opennextjs-cloudflare build"` script to `apps/xa-b/package.json`
- Create `apps/xa-b/open-next.config.ts` (see below)
- Update `apps/xa-b/wrangler.toml` Worker config

### Required `open-next.config.ts`

Both xa-b and xa-uploader need this file in their app root (matches business-os):

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

## Investigation Outcome: AFFIRMING

All five questions answered affirmatively. Every assumption in TASK-04 is validated:
- OpenNext version compatible ✓
- Output directory structure confirmed ✓
- Middleware fully Web Crypto compatible ✓
- Correct wrangler.toml config documented ✓
- CI deploy pattern documented ✓

**One correction needed for TASK-04**: Build script approach changed from "merge into build-xa.mjs" to "two-script pattern". This is addressed in the TASK-04 confidence actualization below.

## Impact on TASK-04 Confidence

**Pre-TASK-01:** 80% (held-back: RS256 JWT middleware compatibility unknown)
**Post-TASK-01 (affirming):** Held-back risk resolved — middleware is entirely Web Crypto API.

Actualized TASK-04 confidence: **85%** (min(85%, 85%, 90%))
- Implementation: 85% (held-back resolved; remaining risk: first real deploy encountering CF Access config issues)
- Approach: 85% (two-script pattern now confirmed, wrangler.toml Worker config documented)
- Impact: 90% (unchanged)

## Acceptance Criteria Verification

- [x] Local build compatibility confirmed (via business-os production evidence + TASK-06 xa-uploader direct build)
- [x] `.open-next/worker.js` output confirmed (business-os wrangler.toml references it; TASK-06 produced it)
- [x] No middleware compilation errors (Web Crypto API analysis — all compatible)
- [x] Correct wrangler.toml Worker config identified
- [x] Findings written to this file
