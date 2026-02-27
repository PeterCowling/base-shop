// src/components/rooms/RoomCard.tsx
// Adapter that composes app-specific data/hooks and renders the shared UI RoomCard.
/* eslint-disable ds/no-hardcoded-copy, max-lines-per-function -- LINT-1007 [ttl=2026-12-31] Fallback copy and adapter complexity retained while i18n + extraction follow-up is scheduled. */

import type { RefObject } from "react";
import { isValidElement, memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { RoomCard as UiRoomCard } from "@acme/ui/molecules";
import type { FacilityKey } from "@acme/ui/types/facility";
import type {
  RoomCardAction,
  RoomCardFacility,
  RoomCardFullscreenRequest,
  RoomCardImageLabels,
  RoomCardPrice,
} from "@acme/ui/types/roomCard";

import FacilityIcon from "@/components/rooms/FacilityIcon";
import FullscreenImage from "@/components/rooms/FullscreenImage";
import { IS_TEST } from "@/config/env";
import { BOOKING_CODE } from "@/context/modal/constants";
import type { Room } from "@/data/roomsData";
import { useRoomPricing } from "@/hooks/useRoomPricing";
import { i18nConfig } from "@/i18n.config";
import { buildOctorateUrl } from "@/utils/buildOctorateUrl";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";

const PRICE_LOADING_TEST_ID = "price-loading" as const; // legacy test id consumed by app unit tests

interface RoomCardProps {
  room: Room;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  lang?: string;
  /** Controls CTA behavior. Defaults to "absent" (→ navigate to /book). */
  queryState?: "valid" | "invalid" | "absent";
  /** Ref to date picker element for scroll-to on invalid state. */
  datePickerRef?: RefObject<HTMLElement | null>;
}

type FacilityIconRenderer = (props: { facility: FacilityKey }) => JSX.Element;

function isFacilityIconRenderer(value: unknown): value is FacilityIconRenderer {
  return typeof value === "function";
}

/**
 * Tests can provide an `act` shim on `globalThis` to silence sync updates.
 */
type TestAct = (callback: () => void) => void;

let runInTestAct: TestAct = (callback) => {
  callback();
};

if (IS_TEST) {
  const maybeAct = (globalThis as { __testAct?: TestAct; act?: TestAct }).__testAct ??
    (globalThis as { __testAct?: TestAct; act?: TestAct }).act;
  if (typeof maybeAct === "function") {
    runInTestAct = (callback) => {
      maybeAct(callback);
    };
  }
}

function realiseIcon(icon: JSX.Element): JSX.Element {
  if (!isValidElement(icon)) return icon;

  const { type, props } = icon;

  if (isFacilityIconRenderer(type)) {
    // Function components may be memo-wrapped in production or plain functions in
    // tests. Invoke them directly so mocks observe the call and we still receive
    // the rendered element rather than a lazy React element record.
    return type(props as Parameters<FacilityIconRenderer>[0]);
  }

  if (typeof type === "object" && type !== null) {
    const maybeInner = (type as { type?: FacilityIconRenderer })?.type;
    if (isFacilityIconRenderer(maybeInner)) {
      return maybeInner(props as Parameters<FacilityIconRenderer>[0]);
    }
  }

  return icon;
}

function buildFacilities(
  facilityKeys: FacilityKey[],
  translate: (key: string) => string,
  renderFacilityIcon: FacilityIconRenderer
): RoomCardFacility[] {
  return facilityKeys.map((facility) => ({
    id: facility,
    label: translate(`facilities.${facility}`),
    // Memo-wrapped <FacilityIcon/> is hook-free, so we can invoke it eagerly to
    // hand a ready element to the UI card even when tests stub the consumer.
    icon: realiseIcon(renderFacilityIcon({ facility })),
  }));
}

function suffixFromLabel(label: string): string {
  const separator = "–";
  if (!label.includes(separator)) return "";
  const [, ...rest] = label.split(separator);
  return rest.join(separator).trim();
}

function coerceString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function resolveTranslatedCopy(value: unknown, key: string, fallback: string): string {
  const trimmed = coerceString(value).trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

export default memo(function RoomCard({
  room,
  checkIn: checkInProp,
  checkOut: checkOutProp,
  adults: adultsProp,
  lang,
  queryState,
  datePickerRef,
}: RoomCardProps): JSX.Element {
  const resolvedLang = (lang ?? i18nConfig.fallbackLng) as string;
  const { t, ready: readyRaw } = useTranslation("roomsPage", { lng: resolvedLang });
  const ready = readyRaw === true;
  const { t: tTokens, ready: tokensReadyRaw } = useTranslation("_tokens", { lng: resolvedLang });
  const tokensReady = tokensReadyRaw !== false;
  const router = useRouter();

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const images = room.imagesRaw ?? [];
  const baseKey = `rooms.${room.id}`;
  const fallbackLanguage = (i18nConfig.fallbackLng ?? "en") as string;

  const checkIn = checkInProp ?? getTodayIso();
  const checkOut = checkOutProp ?? getDatePlusTwoDays(checkIn);
  const adults = adultsProp ?? 1;

  const facilities: FacilityKey[] = (() => {
    if (!ready) return [];
    const raw = t(`${baseKey}.facilities`, { returnObjects: true });
    return Array.isArray(raw) ? (raw as FacilityKey[]) : [];
  })();

  const renderFacilityIcon = useCallback<FacilityIconRenderer>(
    ({ facility }) => <FacilityIcon facility={facility} />,
    []
  );

  const facilityItems = buildFacilities(facilities, t, renderFacilityIcon);

  const isDorm = facilities.some((facility) => facility === "mixedDorm" || facility === "femaleDorm");

  const { lowestPrice, soldOut, loading: priceLoading } = useRoomPricing(room);

  const badgeText = ((): string | undefined => {
    if (soldOut || !tokensReady) return undefined;
    const raw = coerceString(tTokens("bestPriceGuaranteed")).trim();
    return raw && raw !== "bestPriceGuaranteed" ? raw : undefined;
  })();

  const price: RoomCardPrice = (() => {
    const loadingLabel = ready
      ? resolveTranslatedCopy(t("loadingPrice"), "loadingPrice", "Loading price...")
      : "";
    const formatted =
      !priceLoading && lowestPrice !== undefined
        ? (t("ratesFrom", { price: lowestPrice.toFixed(2) }) as string)
        : undefined;

    return {
      loading: priceLoading,
      loadingLabel,
      soldOut,
      skeletonTestId: PRICE_LOADING_TEST_ID,
      ...(formatted !== undefined ? { formatted } : {}),
      ...(soldOut ? { soldOutLabel: t("rooms.soldOut") as string } : {}),
      ...(isDorm ? { info: t("priceNotes.dorm") as string } : {}),
      ...(badgeText ? { badge: { text: badgeText, claimUrl: "https://wa.me/393287073695" } } : {}),
    };
  })();

  // Precompute Octorate URLs when queryState === "valid"
  const nrOctorateUrl = useMemo(() => {
    if (queryState !== "valid") return null;
    const result = buildOctorateUrl({
      checkin: checkIn,
      checkout: checkOut,
      pax: adults,
      plan: "nr",
      roomSku: room.sku,
      octorateRateCode: room.rateCodes.direct.nr,
      bookingCode: BOOKING_CODE,
    });
    return result.ok ? result.url : null;
  }, [queryState, checkIn, checkOut, adults, room]);

  const flexOctorateUrl = useMemo(() => {
    if (queryState !== "valid") return null;
    const result = buildOctorateUrl({
      checkin: checkIn,
      checkout: checkOut,
      pax: adults,
      plan: "flex",
      roomSku: room.sku,
      octorateRateCode: room.rateCodes.direct.flex,
      bookingCode: BOOKING_CODE,
    });
    return result.ok ? result.url : null;
  }, [queryState, checkIn, checkOut, adults, room]);

  const openNonRefundable = useCallback(() => {
    if (queryState === "invalid") {
      // Button is disabled; scroll to date picker if ref provided
      if (datePickerRef?.current) {
        datePickerRef.current.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    if (nrOctorateUrl) {
      window.location.href = nrOctorateUrl;
      return;
    }
    // absent or valid-but-url-failed → navigate to /book
    router.push(`/${resolvedLang}/book`);
  }, [queryState, nrOctorateUrl, datePickerRef, router, resolvedLang]);

  const openFlexible = useCallback(() => {
    if (queryState === "invalid") {
      if (datePickerRef?.current) {
        datePickerRef.current.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    if (flexOctorateUrl) {
      window.location.href = flexOctorateUrl;
      return;
    }
    router.push(`/${resolvedLang}/book`);
  }, [queryState, flexOctorateUrl, datePickerRef, router, resolvedLang]);

  const resolveToken = useCallback(
    (key: "reserveNow" | "bookNow", lngOverride?: string) => {
      if (!tokensReady) return undefined;
      const raw = coerceString(lngOverride ? tTokens(key, { lng: lngOverride }) : tTokens(key));
      const trimmed = raw.trim();
      if (trimmed && trimmed !== key) return trimmed;
      return undefined;
    },
    [tTokens, tokensReady]
  );

  const baseLabel =
    resolveToken("reserveNow") ??
    resolveToken("bookNow") ??
    resolveToken("reserveNow", fallbackLanguage) ??
    resolveToken("bookNow", fallbackLanguage) ??
    "";

  const resolveSuffix = useCallback(
    (
      rawLabel: string,
      suffixKey: "nonRefundable" | "flexible",
      labelKey: "checkRatesNonRefundable" | "checkRatesFlexible"
    ): string => {
      if (!ready) return "";
      const trimmedRaw = coerceString(rawLabel).trim();
      const derivedFromRaw = suffixFromLabel(trimmedRaw);
      if (derivedFromRaw) return derivedFromRaw;

      const direct = coerceString(t(`ctaSuffix.${suffixKey}`)).trim();
      if (direct && direct !== `ctaSuffix.${suffixKey}`) return direct;

      const fallbackDirect = coerceString(
        t(`ctaSuffix.${suffixKey}`, { lng: fallbackLanguage })
      ).trim();
      if (fallbackDirect && fallbackDirect !== `ctaSuffix.${suffixKey}`) return fallbackDirect;

      const fallbackLabel = coerceString(t(labelKey, { lng: fallbackLanguage })).trim();
      const derivedFromFallback = suffixFromLabel(fallbackLabel);
      if (derivedFromFallback) return derivedFromFallback;

      return "";
    },
    [fallbackLanguage, t, ready]
  );

  const buildLabel = useCallback(
    (
      rawLabel: string,
      labelKey: "checkRatesNonRefundable" | "checkRatesFlexible",
      suffixKey: "nonRefundable" | "flexible"
    ): string => {
      if (!ready) return baseLabel;
      const trimmed = coerceString(rawLabel).trim();
      if (trimmed && trimmed !== labelKey) return trimmed;

      const suffix = resolveSuffix(trimmed, suffixKey, labelKey);
      if (suffix) return baseLabel ? `${baseLabel} – ${suffix}` : suffix;

      const fallbackLabel = coerceString(t(labelKey, { lng: fallbackLanguage })).trim();
      if (fallbackLabel && fallbackLabel !== labelKey) return fallbackLabel;

      return baseLabel;
    },
    [baseLabel, fallbackLanguage, resolveSuffix, t, ready]
  );

  const actions: RoomCardAction[] = (() => {
    if (!ready) return [];
    const rawNonRef = coerceString(t("checkRatesNonRefundable")).trim();
    const rawFlexible = coerceString(t("checkRatesFlexible")).trim();
    const isInvalid = queryState === "invalid";

    return [
      {
        id: "nonRefundable",
        label: buildLabel(rawNonRef, "checkRatesNonRefundable", "nonRefundable"),
        onSelect: openNonRefundable,
        disabled: soldOut || isInvalid || (queryState === "valid" && nrOctorateUrl === null),
      },
      {
        id: "flexible",
        label: buildLabel(rawFlexible, "checkRatesFlexible", "flexible"),
        onSelect: openFlexible,
        disabled: soldOut || isInvalid || (queryState === "valid" && flexOctorateUrl === null),
      },
    ];
  })();

  const handleFullscreenRequest = useCallback((payload: RoomCardFullscreenRequest) => {
    runInTestAct(() => {
      setFullscreenImage(payload.image);
    });
  }, []);

  const closeFullscreen = useCallback(() => {
    runInTestAct(() => {
      setFullscreenImage(null);
    });
  }, []);

  const title = resolveTranslatedCopy(
    t(`${baseKey}.title`, { defaultValue: room.id.replace(/_/gu, " ") }),
    `${baseKey}.title`,
    room.id.replace(/_/gu, " ")
  );
  const imageAlt = ready
    ? resolveTranslatedCopy(
        t("roomImage.photoAlt", { room: title, defaultValue: `${title} room` }),
        "roomImage.photoAlt",
        `${title} room`
      )
    : "";
  const imageLabels: RoomCardImageLabels = (() => {
    if (!ready) {
      return { enlarge: "", prevAria: "", nextAria: "", empty: "" };
    }
    return {
      enlarge: resolveTranslatedCopy(
        t("roomImage.clickToEnlarge", { defaultValue: "Click to enlarge image" }),
        "roomImage.clickToEnlarge",
        "Click to enlarge image"
      ),
      prevAria: resolveTranslatedCopy(
        t("roomImage.prevAria", { defaultValue: "Previous image" }),
        "roomImage.prevAria",
        "Previous image"
      ),
      nextAria: resolveTranslatedCopy(
        t("roomImage.nextAria", { defaultValue: "Next image" }),
        "roomImage.nextAria",
        "Next image"
      ),
      empty: resolveTranslatedCopy(
        t("roomImage.noImage", { defaultValue: "No image available" }),
        "roomImage.noImage",
        "No image available"
      ),
    };
  })();

  return (
    <>
      <UiRoomCard
        id={room.id}
        title={title}
        images={images}
        imageAlt={imageAlt}
        imageLabels={imageLabels}
        facilities={facilityItems}
        price={price}
        actions={actions}
        lang={resolvedLang}
        onRequestFullscreen={handleFullscreenRequest}
      />

      {fullscreenImage ? (
        <FullscreenImage
          src={fullscreenImage}
          alt={imageAlt}
          onClose={closeFullscreen}
          lang={resolvedLang}
        />
      ) : null}
    </>
  );
});
