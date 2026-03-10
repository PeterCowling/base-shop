"use client";
/* eslint-disable ds/no-hardcoded-copy, ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/no-raw-tailwind-color -- BRIK-2145 [ttl=2026-12-31] Temporary CTA variant copy/layout override during funnel experiment. */

// apps/brikette/src/components/cta/ContentStickyCta.tsx
// Sticky CTA Variant A for content pages - opens BookingModal (generic availability)
// Pattern reference: StickyBookNow, but opens modal instead of deep-link

import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Sparkles, X } from "lucide-react";

import { Section } from "@acme/design-system/atoms";
import { resolveBookingCtaLabel } from "@acme/ui/shared";

import { useEntryAttribution } from "@/hooks/useEntryAttribution";
import type { AppLanguage } from "@/i18n.config";
import { writeAttribution } from "@/utils/entryAttribution";
import { type CtaLocation, fireCtaClick } from "@/utils/ga4-events";
import { resolveIntentAwareBookingSurface } from "@/utils/intentAwareBookingSurface";
import { resolveIntent } from "@/utils/intentResolver";
import { getBookPath } from "@/utils/localizedRoutes";
import { getPrivateRoomsPath } from "@/utils/privateRoomPaths";

type ContentStickyCtaProps = {
  lang: AppLanguage;
  ctaLocation: Extract<
    CtaLocation,
    "guide_detail" | "about_page" | "bar_menu" | "breakfast_menu" | "how_to_get_here" | "assistance" | "experiences_page"
  >;
  isPrivateRoute?: boolean;
};

type RoutedStickyOption = {
  href: string;
  resolvedIntent: "hostel" | "private";
  productType: "apartment" | "double_private_room" | "hostel_bed" | null;
  decisionMode: "direct_resolution" | "chooser" | "hybrid_merchandising";
  destinationFunnel: "hostel_central" | "hostel_assist" | "private";
};

type StickySegmentedRouting = ReturnType<typeof resolveIntentAwareBookingSurface> | null;

function StickyCtaActions({
  segmentedRouting,
  targetUrl,
  ctaLabel,
  hostelLabel,
  privateLabel,
  onDefaultClick,
  onSegmentedClick,
}: {
  segmentedRouting: StickySegmentedRouting;
  targetUrl: string;
  ctaLabel: string;
  hostelLabel: string;
  privateLabel: string;
  onDefaultClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onSegmentedClick: (
    e: React.MouseEvent<HTMLAnchorElement>,
    input: RoutedStickyOption,
  ) => void;
}): JSX.Element {
  if (!segmentedRouting) {
    return (
      <a
        href={targetUrl}
        onClick={onDefaultClick}
        className="group relative inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-secondary px-6 py-3 text-base font-semibold text-brand-on-accent shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:scale-105 hover:bg-brand-secondary/90 sm:px-5 sm:py-3 sm:text-sm"
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
      </a>
    );
  }

  if (segmentedRouting.mode === "direct") {
    return (
      <a
        href={segmentedRouting.primary.href}
        onClick={(event) => onSegmentedClick(event, segmentedRouting.primary)}
        className="group relative inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-secondary px-6 py-3 text-base font-semibold text-brand-on-accent shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:scale-105 hover:bg-brand-secondary/90 sm:px-5 sm:py-3 sm:text-sm"
        aria-label={segmentedRouting.primary.resolvedIntent === "private" ? privateLabel : hostelLabel}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="relative flex items-center gap-2">
          <span>{segmentedRouting.primary.resolvedIntent === "private" ? privateLabel : hostelLabel}</span>
          <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </a>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <a
        href={segmentedRouting.hostel.href}
        onClick={(event) => onSegmentedClick(event, segmentedRouting.hostel)}
        className="group relative inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-secondary px-6 py-3 text-base font-semibold text-brand-on-accent shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:scale-105 hover:bg-brand-secondary/90 sm:px-5 sm:py-3 sm:text-sm"
        aria-label={hostelLabel}
      >
        <span className="relative flex items-center gap-2">
          <span>{hostelLabel}</span>
          <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </a>
      <a
        href={segmentedRouting.private.href}
        onClick={(event) => onSegmentedClick(event, segmentedRouting.private)}
        className="group relative inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-brand-outline bg-brand-surface px-6 py-3 text-base font-semibold text-brand-heading shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:bg-brand-surface/80 sm:px-5 sm:py-3 sm:text-sm"
        aria-label={privateLabel}
      >
        <span className="relative flex items-center gap-2">
          <span>{privateLabel}</span>
          <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </a>
    </div>
  );
}

function useStickyCtaDismissState(ctaLocation: ContentStickyCtaProps["ctaLocation"]): {
  isDismissed: boolean;
  onDismiss: () => void;
} {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.sessionStorage.getItem(`content-sticky-cta-dismissed:${ctaLocation}`);
      setIsDismissed(storedValue === "true");
    } catch {
      // Ignore storage access errors (e.g. Safari private mode).
    }
  }, [ctaLocation]);

  const onDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(`content-sticky-cta-dismissed:${ctaLocation}`, "true");
      } catch {
        // Ignore storage access errors (e.g. Safari private mode).
      }
    }
    setIsDismissed(true);
  }, [ctaLocation]);

  return { isDismissed, onDismiss };
}

function ContentStickyCta({ lang, ctaLocation, isPrivateRoute = false }: ContentStickyCtaProps): JSX.Element | null {
  const { t, ready } = useTranslation(undefined, { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { t: tHeader, ready: headerReady } = useTranslation("header", { lng: lang });
  const router = useRouter();
  const currentAttribution = useEntryAttribution();
  const { isDismissed, onDismiss } = useStickyCtaDismissState(ctaLocation);

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
      return "Check availability";
    }

    // Primary: _tokens:checkAvailability
    const checkAvailabilityToken = tTokens("checkAvailability") as string;
    if (
      checkAvailabilityToken &&
      checkAvailabilityToken.trim() &&
      checkAvailabilityToken !== "checkAvailability"
    ) {
      return checkAvailabilityToken;
    }

    // Fallback chain
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const modalAvailability = t("modals:booking.buttonAvailability") as string;
          if (
            modalAvailability &&
            modalAvailability.trim() &&
            modalAvailability !== "modals:booking.buttonAvailability"
          ) {
            return modalAvailability;
          }
          return "Check availability";
        },
      }) ?? "Check availability"
    );
  }, [t, tTokens, ready, tokensReady]);

  const segmentedSurface = ctaLocation === "assistance" || ctaLocation === "how_to_get_here";
  const segmentedRouting = useMemo(
    () => (segmentedSurface ? resolveIntentAwareBookingSurface(lang, currentAttribution) : null),
    [currentAttribution, lang, segmentedSurface],
  );
  const hostelLabel = useMemo(
    () =>
      headerReady
        ? ((tHeader("rooms", { defaultValue: "Dorms" }) as string) || "Dorms")
        : "Dorms",
    [headerReady, tHeader],
  );
  const privateLabel = useMemo(
    () =>
      headerReady
        ? ((tHeader("apartment", { defaultValue: "Private Rooms" }) as string) || "Private Rooms")
        : "Private Rooms",
    [headerReady, tHeader],
  );

  // Resolve intent and target URL at render time (SSR-safe, pure).
  const { resolved_intent, product_type, decision_mode, destination_funnel } = resolveIntent(
    "sticky_cta",
    { isPrivateRoute }
  );
  const targetUrl = resolved_intent === "private"
    ? getPrivateRoomsPath(lang)
    : getBookPath(lang);

  const fireAndRoute = useCallback((input: {
    href: string;
    resolvedIntent: "hostel" | "private";
    productType: "apartment" | "double_private_room" | "hostel_bed" | null;
    decisionMode: "direct_resolution" | "chooser" | "hybrid_merchandising";
    destinationFunnel: "hostel_central" | "hostel_assist" | "private";
  }) => {
    writeAttribution({
      source_surface: "content_page",
      source_cta: ctaLocation,
      resolved_intent: input.resolvedIntent,
      product_type: input.productType,
      decision_mode: input.decisionMode,
      destination_funnel: input.destinationFunnel,
      locale: lang,
      fallback_triggered: false,
      next_page: input.href,
    });

    fireCtaClick(
      { ctaId: "content_sticky_check_availability", ctaLocation },
      undefined,
      {
        source_surface: "content_page",
        source_cta: ctaLocation,
        resolved_intent: input.resolvedIntent,
        product_type: input.productType,
        decision_mode: input.decisionMode,
        destination_funnel: input.destinationFunnel,
        locale: lang,
        fallback_triggered: false,
        next_page: input.href,
      }
    );

    router.push(input.href);
  }, [ctaLocation, lang, router]);

  const onCtaClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    fireAndRoute({
      href: targetUrl,
      resolvedIntent: resolved_intent === "private" ? "private" : "hostel",
      productType: product_type,
      decisionMode: decision_mode,
      destinationFunnel: destination_funnel,
    });
  }, [decision_mode, destination_funnel, fireAndRoute, product_type, resolved_intent, targetUrl]);

  const onSegmentedClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, input: RoutedStickyOption) => {
    e.preventDefault();
    fireAndRoute({
      href: input.href,
      resolvedIntent: input.resolvedIntent,
      productType: input.productType,
      decisionMode: input.decisionMode,
      destinationFunnel: input.destinationFunnel,
    });
  }, [fireAndRoute]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:inset-auto sm:bottom-auto sm:end-6 sm:top-1/3 sm:justify-end"
      aria-hidden={false}
      data-testid="content-sticky-cta"
    >
      <Section
        as="div"
        padding="none"
        className="pointer-events-auto relative w-full max-w-md rounded-3xl border border-brand-outline/40 bg-brand-surface/90 p-5 shadow-xl backdrop-blur sm:max-w-sm sm:p-6"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute end-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-brand-surface/70 text-brand-heading transition hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          aria-label={tTokens("close", { defaultValue: "Close" }) as string}
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-brand-heading/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-terracotta/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
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
          <StickyCtaActions
            segmentedRouting={segmentedRouting}
            targetUrl={targetUrl}
            ctaLabel={ctaLabel}
            hostelLabel={hostelLabel}
            privateLabel={privateLabel}
            onDefaultClick={onCtaClick}
            onSegmentedClick={onSegmentedClick}
          />
        </div>
      </Section>
    </div>
  );
}

export default memo(ContentStickyCta);
export { ContentStickyCta };
