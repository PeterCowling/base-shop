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
    .split(";")
    .map((chunk) => chunk.trim())
    .some((chunk) => chunk.startsWith(`${COOKIE_NAME}=`));
}

function writeConsentCookie(value: "true" | "false"): void {
  document.cookie = `${COOKIE_NAME}=${value}; ${COOKIE_ATTRS}`;
}

// Banner requires fixed positioning and z-index as a viewport-level consent overlay.
const bannerClass =
  "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-lg";

export interface ConsentBannerStrings {
  message: string;
  privacyLink: string;
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
    <div role="dialog" aria-label={strings.ariaLabel} className={bannerClass}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {strings.message}{" "}
          <a
            href={`/${lang}/privacy`}
            className="inline-flex min-h-11 min-w-11 items-center underline hover:text-primary"
          >
            {strings.privacyLink}
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
