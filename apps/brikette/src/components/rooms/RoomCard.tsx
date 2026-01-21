// src/components/rooms/RoomCard.tsx
// Adapter that composes app-specific data/hooks and renders the shared UI RoomCard.

import { isValidElement, memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RoomCard as UiRoomCard } from "@acme/ui/molecules/RoomCard";
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
import { useModal } from "@/context/ModalContext";
import type { Room } from "@/data/roomsData";
import { useRoomPricing } from "@/hooks/useRoomPricing";
import { i18nConfig } from "@/i18n.config";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";

const PRICE_LOADING_TEST_ID = "price-loading" as const; // legacy test id consumed by app unit tests

interface RoomCardProps {
  room: Room;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  lang?: string;
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

export default memo(function RoomCard({
  room,
  checkIn: checkInProp,
  checkOut: checkOutProp,
  adults: adultsProp,
  lang,
}: RoomCardProps): JSX.Element {
  const resolvedLang = (lang ?? i18nConfig.fallbackLng) as string;
  const { t, ready: readyRaw } = useTranslation("roomsPage", { lng: resolvedLang });
  const ready = readyRaw !== false;
  const { t: tTokens, ready: tokensReadyRaw } = useTranslation("_tokens", { lng: resolvedLang });
  const tokensReady = tokensReadyRaw !== false;
  const { openModal } = useModal();

  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const images = room.imagesRaw ?? [];
  const baseKey = `rooms.${room.id}`;
  const fallbackLanguage = (i18nConfig.fallbackLng ?? "en") as string;

  const checkIn = useMemo(() => checkInProp ?? getTodayIso(), [checkInProp]);
  const checkOut = useMemo(() => checkOutProp ?? getDatePlusTwoDays(checkIn), [checkOutProp, checkIn]);
  const adults = adultsProp ?? 1;

  const facilities = useMemo<FacilityKey[]>(() => {
    if (!ready) return [];
    const raw = t(`${baseKey}.facilities`, { returnObjects: true });
    return Array.isArray(raw) ? (raw as FacilityKey[]) : [];
  }, [t, baseKey, ready]);

  const renderFacilityIcon = useCallback<FacilityIconRenderer>(
    ({ facility }) => <FacilityIcon facility={facility} />,
    []
  );

  const facilityItems = useMemo<RoomCardFacility[]>(() => {
    return buildFacilities(facilities, t, renderFacilityIcon);
  }, [facilities, renderFacilityIcon, t]);

  const isDorm = useMemo(() => {
    return facilities.some((facility) => facility === "mixedDorm" || facility === "femaleDorm");
  }, [facilities]);

  const { lowestPrice, soldOut, loading: priceLoading } = useRoomPricing(room);

  const price: RoomCardPrice = useMemo(() => {
    const loadingLabel = ready ? (t("loadingPrice") as string) : "";
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
    };
  }, [isDorm, lowestPrice, priceLoading, soldOut, t, ready]);

  const openNonRefundable = useCallback(() => {
    openModal("booking2", {
      rateType: "nonRefundable",
      room,
      checkIn,
      checkOut,
      adults,
    });
  }, [openModal, room, checkIn, checkOut, adults]);

  const openFlexible = useCallback(() => {
    openModal("booking2", {
      rateType: "refundable",
      room,
      checkIn,
      checkOut,
      adults,
    });
  }, [openModal, room, checkIn, checkOut, adults]);

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

  const baseLabel = useMemo(() => {
    return (
      resolveToken("reserveNow") ??
      resolveToken("bookNow") ??
      resolveToken("reserveNow", fallbackLanguage) ??
      resolveToken("bookNow", fallbackLanguage) ??
      ""
    );
  }, [resolveToken, fallbackLanguage]);

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

  const actions = useMemo<RoomCardAction[]>(() => {
    if (!ready) return [];
    const rawNonRef = coerceString(t("checkRatesNonRefundable")).trim();
    const rawFlexible = coerceString(t("checkRatesFlexible")).trim();

    return [
      {
        id: "nonRefundable",
        label: buildLabel(rawNonRef, "checkRatesNonRefundable", "nonRefundable"),
        onSelect: openNonRefundable,
        disabled: soldOut,
      },
      {
        id: "flexible",
        label: buildLabel(rawFlexible, "checkRatesFlexible", "flexible"),
        onSelect: openFlexible,
        disabled: soldOut,
      },
    ];
  }, [buildLabel, openFlexible, openNonRefundable, soldOut, t, ready]);

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

  const title = t(`${baseKey}.title`) as string;
  const imageAlt = t("roomImage.photoAlt", { room: title }) as string;
  const imageLabels = useMemo<RoomCardImageLabels>(() => {
    if (!ready) {
      return { enlarge: "", prevAria: "", nextAria: "", empty: "" };
    }
    return {
      enlarge: t("roomImage.clickToEnlarge") as string,
      prevAria: t("roomImage.prevAria") as string,
      nextAria: t("roomImage.nextAria") as string,
      empty: t("roomImage.noImage", { defaultValue: "No image available" }) as string,
    };
  }, [t, ready]);

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
