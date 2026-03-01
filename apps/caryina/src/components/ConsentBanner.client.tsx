// apps/caryina/src/components/ConsentBanner.client.tsx
// First-party GDPR cookie consent banner.
// Sets/reads the "consent.analytics" cookie — shared literal with
// packages/platform-core/src/analytics/client.ts and
// apps/caryina/src/app/api/analytics/event/route.ts.
// No external dependencies; native document.cookie API only.

"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "consent.analytics";
const COOKIE_ATTRS = "SameSite=Lax; Path=/; Max-Age=31536000";

function hasCookieSet(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${COOKIE_NAME}=`));
}

function writeConsentCookie(value: "true" | "false"): void {
  document.cookie = `${COOKIE_NAME}=${value}; ${COOKIE_ATTRS}`;
}

// Banner requires fixed positioning and z-index as a viewport-level consent overlay.
const bannerClass =
  "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-lg";

export function ConsentBanner({ lang }: { lang: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasCookieSet()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    writeConsentCookie("true");
    setVisible(false);
  };

  const handleDecline = () => {
    writeConsentCookie("false");
    setVisible(false);
  };

  return (
    <div role="dialog" aria-label="Cookie consent" className={bannerClass}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          We use analytics cookies to understand how visitors interact with our
          site. See our{" "}
          <a href={`/${lang}/privacy`} className="underline hover:text-primary">
            privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
