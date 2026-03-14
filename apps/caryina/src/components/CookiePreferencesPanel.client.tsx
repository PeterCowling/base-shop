"use client";

import {
  useAnalyticsConsentValue,
  writeAnalyticsConsent,
} from "@/lib/analyticsConsent.client";

function describeConsent(cookieValue: string | null): string {
  if (cookieValue === "true") {
    return "Analytics cookies are currently allowed on this browser.";
  }
  if (cookieValue === "false") {
    return "Analytics cookies are currently declined on this browser.";
  }
  return "No analytics preference has been saved yet on this browser.";
}

export function CookiePreferencesPanel() {
  const cookieValue = useAnalyticsConsentValue();

  return (
    <section
      id="cookie-preferences"
      className="rounded-3xl border border-border/70 bg-accent-soft p-6"
      aria-labelledby="cookie-preferences-title"
    >
      <div className="max-w-3xl space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Cookie preferences
          </p>
          <h2 id="cookie-preferences-title" className="text-2xl font-display">
            Manage analytics consent
          </h2>
          <p className="text-sm text-muted-foreground">
            Caryina uses essential cookies for cart and checkout continuity. Analytics cookies stay
            off unless you allow them.
          </p>
        </div>
        <p className="text-sm text-foreground">{describeConsent(cookieValue)}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => writeAnalyticsConsent("true")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            Allow analytics cookies
          </button>
          <button
            type="button"
            onClick={() => writeAnalyticsConsent("false")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-background/70"
          >
            Decline analytics cookies
          </button>
        </div>
      </div>
    </section>
  );
}
