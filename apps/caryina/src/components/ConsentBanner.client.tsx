// apps/caryina/src/components/ConsentBanner.client.tsx
// First-party GDPR cookie consent banner.
// Sets/reads the "consent.analytics" cookie — shared literal with
// packages/platform-core/src/analytics/client.ts and
// apps/caryina/src/app/api/analytics/event/route.ts.
// No external dependencies; native document.cookie API only.

"use client";

import { useCallback } from "react";

import {
  useAnalyticsConsentValue,
  writeAnalyticsConsent,
} from "@/lib/analyticsConsent.client";

/**
 * Thin external-store wrapper around `document.cookie`.
 *
 * `useSyncExternalStore` ensures visibility is derived from the cookie itself
 * rather than from a `useState` flag that resets whenever the component
 * remounts (which happens on every Next.js client-side navigation when the
 * parent layout is an async server component).
 *
 * The `subscribe` callback listens for cookie changes via the (new)
 * CookieStore API where available, and always listens for `visibilitychange`
 * as a fallback so that consent given in another tab is picked up.
 */
// Banner requires fixed positioning and z-index as a viewport-level consent overlay.
const bannerClass =
  "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-lg";

export interface ConsentBannerStrings {
  message: string;
  privacyLink: string;
  cookieLink: string;
  decline: string;
  accept: string;
  ariaLabel: string;
}

export function ConsentBanner({
  lang,
  strings,
}: {
  lang: string;
  strings: ConsentBannerStrings;
}) {
  const cookieValue = useAnalyticsConsentValue();

  // Banner is visible only when there is no consent cookie at all.
  // "server" sentinel from SSR also keeps it hidden (revealed on hydration if needed).
  const visible = cookieValue === null;

  const handleAccept = useCallback(() => {
    writeAnalyticsConsent("true");
  }, []);

  const handleDecline = useCallback(() => {
    writeAnalyticsConsent("false");
  }, []);

  if (!visible) return null;

  return (
    <div role="dialog" aria-label={strings.ariaLabel} className={bannerClass}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {strings.message}{" "}
          <span className="text-muted-foreground">(Google Analytics — page visits and device type only. No personal details are collected.)</span>
          {" "}
          <a
            href={`/${lang}/privacy`}
            className="inline-flex min-h-11 min-w-11 items-center underline hover:text-primary"
          >
            {strings.privacyLink}
          </a>
          {" "}and{" "}
          <a
            href={`/${lang}/cookie-policy`}
            className="inline-flex min-h-11 min-w-11 items-center underline hover:text-primary"
          >
            {strings.cookieLink}
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            {strings.decline}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            {strings.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
