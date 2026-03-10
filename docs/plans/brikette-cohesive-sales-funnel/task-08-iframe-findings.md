---
Task: TASK-08
Type: INVESTIGATE
Status: Complete
Date: 2026-03-08
---

# TASK-08: result.xhtml iframe viability findings

## 1. How the iframe is mounted

**`apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`**

The iframe is rendered when `hasIframeEmbed` is true (`embedUrl` prop is provided):

```tsx
<iframe
  aria-label={widgetHostLabel}
  className="aspect-video w-full rounded-2xl border border-brand-outline/20 bg-brand-surface"
  loading="eager"
  referrerPolicy="strict-origin-when-cross-origin"
  src={embedUrl}
  style={{ minHeight: "780px" }}
  title={embedTitle ?? heading}
  onLoad={() => { setStatus("ready"); }}
/>
```

Key observations:
- **No `sandbox` attribute** is set — the iframe is not sandboxed; full capabilities are permitted.
- **No `allow` attribute** — no Permissions Policy delegation to the iframe origin.
- `referrerPolicy` is `strict-origin-when-cross-origin` (standard).
- `loading="eager"` — loads immediately, not lazily.
- `onLoad` fires `setStatus("ready")` — there is no error-state detection if the frame is blocked.

**`apps/brikette/src/components/booking/SecureBookingPageClient.tsx`**

`SecureBookingPageClient` does **not** pass `embedUrl` to `OctorateCustomPageShell`. It only passes `widgetScriptSrc` and `widgetGlobalKey`, which triggers the script-widget bootstrap path (not the iframe path). The iframe path (`embedUrl`) appears to be a fallback/alternative mechanism documented in the shell's prop types but not currently activated by any production caller.

## 2. X-Frame-Options / CSP headers

No documentation, configuration, or code found in the repo that documents Octorate's `X-Frame-Options` or `Content-Security-Policy` response headers for `result.xhtml`. The secure-booking page (`apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`) does not set CSP frame-src headers.

The embeddability of `result.xhtml` under `https://hostel-brikette.octorate.com` (or equivalent) is **not documented** anywhere in this codebase.

## 3. Test coverage

A search for `result.xhtml` across the brikette test suite found references only in:
- `apps/brikette/src/test/utils/octorateCustomPage.test.ts` — tests URL construction, not iframe loading
- E2E scripts that reference the URL as a string

No test exists that validates that `result.xhtml` loads inside an iframe without being blocked by `X-Frame-Options` or `frame-ancestors` CSP. No Playwright or Cypress spec validates iframe load state.

## 4. Conclusion

**Iframe viability: UNPROVEN**

The shell infrastructure exists and is correctly wired (OctorateCustomPageShell renders an iframe when `embedUrl` is provided). However:

1. `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` is OFF on all known deployments (see TASK-07 findings) — the shell is not reachable by end users.
2. `SecureBookingPageClient` does not currently pass `embedUrl` — it uses the script-widget path, not the iframe path.
3. Octorate's `X-Frame-Options` / `frame-ancestors` policy for `result.xhtml` is unknown.
4. No automated test validates iframe load success.

**Manual staging verification is required** before any acceptance criterion references in-shell checkout completion. The verification steps are:
1. Activate `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1` on a staging build.
2. Navigate to `/en/book/secure-booking?checkin=...&checkout=...&pax=...&plan=nr&room=...`.
3. Confirm the Octorate booking frame loads without being blocked.
4. Check the browser DevTools Network tab for `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` response headers on the Octorate response.

Until staging verification is complete, TASK-10 and TASK-11 acceptance criteria that reference in-shell checkout completion remain UNVERIFIED.
