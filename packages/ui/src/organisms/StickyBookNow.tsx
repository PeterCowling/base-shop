// packages/ui/src/organisms/StickyBookNow.tsx
// Floating CTA that deep‑links to Octorate with prefilled params when available.
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { i18nConfig } from "@/i18n.config";
import { resolveBookingCtaLabel } from "@acme/ui/shared";
import { Section } from "../atoms/Section";

const STICKY_CTA_STORAGE_KEY = "sticky-cta-dismissed";

function StickyBookNow({ lang }: { lang?: string }): JSX.Element | null {
  const { t, ready } = useTranslation(undefined, { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.sessionStorage.getItem(STICKY_CTA_STORAGE_KEY);
      if (storedValue === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage access errors (e.g. Safari private mode).
    }
  }, []);

  const search = typeof window !== "undefined" ? window.location.search : "";
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const checkIn = useMemo(() => urlParams.get("checkin") ?? getTodayIso(), [urlParams]);
  const checkOut = useMemo(
    () => urlParams.get("checkout") ?? getDatePlusTwoDays(checkIn),
    [urlParams, checkIn]
  );
  const adults = useMemo(() => parseInt(urlParams.get("pax") ?? "1", 10) || 1, [urlParams]);

  const perksEyebrow = useMemo(
    () => (tokensReady ? (tTokens("directBookingPerks") as string) : ""),
    [tTokens, tokensReady]
  );
  const guaranteeLabel = useMemo(
    () => (tokensReady ? (tTokens("bestPriceGuaranteed") as string) : ""),
    [tTokens, tokensReady]
  );
  const highlightHeadline = useMemo(
    () =>
      ready
        ? (t("stickyCta.directHeadline", {
            defaultValue: "Lock in our best available rate in under two minutes.",
          }) as string)
        : "",
    [t, ready]
  );
  const highlightSubcopy = useMemo(
    () =>
      ready
        ? (t("stickyCta.directSubcopy", {
            defaultValue: "Skip third-party fees and get priority help from our Positano team.",
          }) as string)
        : "",
    [t, ready]
  );
  const ctaLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return "Book Now";
    }
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const apartment = t("apartmentPage.bookButton") as string;
          if (apartment && apartment.trim() && apartment !== "apartmentPage.bookButton") {
            return apartment;
          }
          const rooms = t("roomsPage.bookNow") as string;
          if (rooms && rooms.trim() && rooms !== "roomsPage.bookNow") {
            return rooms;
          }
          const fallbackApartment = t("apartmentPage.bookButton", { lng: i18nConfig.fallbackLng }) as string;
          if (fallbackApartment && fallbackApartment.trim() && fallbackApartment !== "apartmentPage.bookButton") {
            return fallbackApartment;
          }
          const fallbackRooms = t("roomsPage.bookNow", { lng: i18nConfig.fallbackLng }) as string;
          if (fallbackRooms && fallbackRooms.trim() && fallbackRooms !== "roomsPage.bookNow") {
            return fallbackRooms;
          }
          return "Book Now";
        },
      }) ?? "Book Now"
    );
  }, [t, tTokens, ready, tokensReady]);

  const deepLink = useMemo(() => {
    const qs = new URLSearchParams({
      codice: "45111",
      checkin: checkIn,
      checkout: checkOut,
      pax: String(adults),
      children: "0",
      childrenAges: "",
    });
    return `https://book.octorate.com/octobook/site/reservation/result.xhtml?${qs}`;
  }, [checkIn, checkOut, adults]);

  const onClick = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = deepLink;
    }
  }, [deepLink]);

  const onDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(STICKY_CTA_STORAGE_KEY, "true");
      } catch {
        // Ignore storage access errors (e.g. Safari private mode).
      }
    }
    setIsDismissed(true);
  }, []);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:inset-auto sm:bottom-auto sm:end-6 sm:top-1/3 sm:justify-end"
      aria-hidden={false}
      data-testid="sticky-cta"
    >
      <Section as="div" padding="none" className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-brand-outline/40 bg-brand-surface/90 p-5 shadow-xl backdrop-blur sm:max-w-sm sm:p-6">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute end-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-brand-surface/70 text-brand-heading transition hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          aria-label={tTokens("close", { defaultValue: "Close" }) as string}
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-brand-heading/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-terracotta/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-terracotta">
            <Sparkles aria-hidden className="h-3.5 w-3.5" />
            {perksEyebrow}
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-brand-heading">
            <BadgeCheck aria-hidden className="h-4 w-4 text-brand-primary" />
            {guaranteeLabel}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex-1">
            <p className="text-lg font-semibold text-brand-heading sm:text-xl">{highlightHeadline}</p>
            <p className="mt-1 text-sm text-brand-text/80 sm:text-base">{highlightSubcopy}</p>
          </div>
          <button
            type="button"
            onClick={onClick}
            className="group relative inline-flex min-h-10 min-w-10 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-secondary px-6 py-3 text-base font-semibold text-brand-heading shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:scale-105 hover:bg-brand-secondary/90 sm:px-5 sm:py-3 sm:text-sm"
            aria-label={ctaLabel}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="relative flex items-center gap-2">
              <span>{ctaLabel}</span>
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </Section>
    </div>
  );
}

export default memo(StickyBookNow);
export { StickyBookNow };
