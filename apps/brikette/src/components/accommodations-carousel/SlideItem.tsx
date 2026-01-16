// src/components/accommodations-carousel/SlideItem.tsx
/* ────────────────────────────────────────────────────────────────
   Single room card used by <CarouselSlides>
---------------------------------------------------------------- */
import { CfCardImage } from "@/components/images/CfCardImage";
import { Cluster } from "@/components/ui/flex";
import { Button } from "@acme/ui/atoms";
import { resolveSharedToken } from "@acme/ui/shared";
import type { Room } from "@/data/roomsData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useRoomPricing } from "@/hooks/useRoomPricing";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  type CSSProperties,
  type ForwardedRef,
} from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@/i18n.config";
import clsx from "clsx";

/* -------------------------------------------------------------------------- */
/*  Helpers – convert legacy `/images/*.avif` → canonical `/img/*.webp`       */
/* -------------------------------------------------------------------------- */
const resolveAsset = (p: string): string => p.replace(/^\/images\//, "/img/");
const TEST_IDS = {
  priceLoading: "price-loading",
} as const;
const FACT_TYPE_KEYS = ["privateRoom", "mixedDorm", "femaleDorm", "femaleRoom"] as const;
const FACT_BATHROOM_KEYS = ["bathroomEnsuite", "bathroomPrivate", "bathroomSharedFemale"] as const;
const BED_CONFIG_KEYS = [
  "doubleBedForTwo",
  "threeSingleBedsThreeGuests",
  "oneDormBedTwoGuests",
  "threeDormBedsSixGuests",
  "threeDormBedsPlusSingleSevenGuests",
  "fourDormBedsEightGuests",
] as const;
const VIEW_KEYS = ["seaViewTerrace", "seaViewExtraLargeTerrace", "gardenView", "courtyardView", "noView"] as const;

type FactTypeKey = (typeof FACT_TYPE_KEYS)[number];
type FactBathroomKey = (typeof FACT_BATHROOM_KEYS)[number];
type BedKey = (typeof BED_CONFIG_KEYS)[number];
type ViewKey = (typeof VIEW_KEYS)[number];

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
export interface SlideItemProps {
  item: Room;
  openModalForRate: (room: Room, rateType: "nonRefundable" | "refundable") => void;
  height?: number;
  lang?: AppLanguage;
}

/* -------------------------------------------------------------------------- */
/* Strip the first path segment (legacy "/rooms" or localised variant) */
const DROP_FIRST_SEGMENT = /^\/[^/]+/;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
function SlideItemBase(
  { item, openModalForRate, height, lang }: SlideItemProps,
  ref: ForwardedRef<HTMLElement>
): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, ready } = useTranslation("roomsPage", translationOptions);
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", translationOptions);
  // Always call hooks unconditionally; derive effective language afterward
  const currentLang = useCurrentLanguage();
  const effectiveLang = lang ?? currentLang;
  const roomsSlug = getSlug("rooms", toAppLanguage(effectiveLang));
  const { loading: priceLoading, lowestPrice } = useRoomPricing(item);

  /* Build canonical room href with translated slug */
  const restPath = useMemo(() => item.roomsHref.replace(DROP_FIRST_SEGMENT, ""), [item.roomsHref]);
  const roomHref = `/${effectiveLang}/${roomsSlug}${restPath}`;

  const normaliseLabel = useCallback((value: unknown): string => {
    return typeof value === "string" ? value.trim() : "";
  }, []);

  const facilityKeys = useMemo<string[]>(() => {
    if (!ready) return [];
    const raw = t(`rooms.${item.id}.facilities`, { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw.filter((key) => typeof key === "string") as string[]) : [];
  }, [item.id, ready, t]);

  const translateKey = useCallback(
    (key: string | undefined, path: string, fallbackPath?: string): string | undefined => {
      if (!key) return undefined;
      const primary = normaliseLabel(t(`${path}.${key}`));
      if (primary && primary !== `${path}.${key}`) return primary;
      if (fallbackPath) {
        const fallback = normaliseLabel(t(`${fallbackPath}.${key}`));
        if (fallback && fallback !== `${fallbackPath}.${key}`) return fallback;
      }
      return undefined;
    },
    [normaliseLabel, t]
  );

  const typeLabel = useMemo(() => {
    const typeKey = facilityKeys.find((key): key is FactTypeKey => FACT_TYPE_KEYS.includes(key as FactTypeKey));
    return translateKey(typeKey, "facts.type", "facilities");
  }, [facilityKeys, translateKey]);

  const bathroomLabel = useMemo(() => {
    const bathKey = facilityKeys.find((key): key is FactBathroomKey =>
      FACT_BATHROOM_KEYS.includes(key as FactBathroomKey)
    );
    return translateKey(bathKey, "facts.bathroom", "facilities");
  }, [facilityKeys, translateKey]);

  const sleepsLabel = useMemo(() => {
    const label = normaliseLabel(t("facts.sleeps", { count: item.occupancy }));
    return label || `Sleeps ${item.occupancy}`;
  }, [item.occupancy, normaliseLabel, t]);

  const bedLabel = useMemo(() => {
    const bedKey = facilityKeys.find((key): key is BedKey => BED_CONFIG_KEYS.includes(key as BedKey));
    return translateKey(bedKey, "detailsLine.beds", "facilities");
  }, [facilityKeys, translateKey]);

  const viewLabel = useMemo(() => {
    const viewKey = facilityKeys.find((key): key is ViewKey => VIEW_KEYS.includes(key as ViewKey));
    return translateKey(viewKey, "detailsLine.views", "facilities");
  }, [facilityKeys, translateKey]);

  const facts = useMemo(
    () => [typeLabel, sleepsLabel, bathroomLabel].filter((entry): entry is string => Boolean(entry)),
    [bathroomLabel, sleepsLabel, typeLabel]
  );

  const detailParts = useMemo(
    () => [bedLabel, viewLabel].filter((entry): entry is string => Boolean(entry)),
    [bedLabel, viewLabel]
  );

  /* Callbacks */
  const handleCheckDates = useCallback(
    () => openModalForRate(item, "refundable"),
    [item, openModalForRate]
  );

  /* Image + dynamic height */
  const imageSrc = useMemo(() => resolveAsset(item.landingImage), [item.landingImage]);
  const style = useMemo<CSSProperties | undefined>(
    () => (height ? { minHeight: height, height } : undefined),
    [height]
  );

  const priceLine = useMemo(() => {
    const unitKey = item.pricingModel === "perRoom" ? "perRoom" : "perBed";
    const unitPath = `priceUnits.${unitKey}`;
    const unitTranslation = normaliseLabel(t(unitPath));
    const unitLabel = unitTranslation && unitTranslation !== unitPath ? unitTranslation : unitKey;
    if (priceLoading) {
      return t("loadingPrice");
    }
    if (typeof lowestPrice === "number") {
      const base = normaliseLabel(t("ratesFrom", { price: lowestPrice.toFixed(2) }));
      const prefix = base || `From €${lowestPrice.toFixed(2)}`;
      return unitLabel ? `${prefix} / ${unitLabel}` : prefix;
    }
    return "";
  }, [item.pricingModel, lowestPrice, priceLoading, t, normaliseLabel]);

  const availabilityLabel = useMemo(() => {
    if (!tokensReady) {
      return t("checkRatesFlexible");
    }
    return (
      resolveSharedToken(tTokens, "checkAvailability", {
        fallback: () => t("checkRatesFlexible"),
      }) ?? t("checkRatesFlexible")
    );
  }, [t, tTokens, tokensReady]);

  const landingImageAlt = useMemo(
    () => t("landingImageAlt", { room: t(`rooms.${item.id}.title`) }),
    [item.id, t]
  );
  const detailsAriaLabel = useMemo(
    () => `${t("moreAboutThisRoom")} ${t(`rooms.${item.id}.title`)}`,
    [item.id, t]
  );

  return (
    <article
      ref={ref}
      data-slide-item
      style={style}
      className="
        flex h-full flex-col overflow-hidden rounded-lg bg-brand-bg shadow-md
        dark:border dark:border-brand-outline/20 dark:bg-brand-surface
      "
    >
      <CfCardImage
        src={imageSrc}
        alt={landingImageAlt}
        /* 4 / 3 ratio prevents layout jump & fills cards evenly */
        wrapperClassName={clsx(
          "relative",
          "w-full",
          "overflow-hidden",
          !height && "aspect-[4/3]",
          height && "flex-none"
        )}
        className={clsx(
          "size-full",
          "object-cover",
          "transition-transform",
          "duration-300",
          "hover:scale-105"
        )}
      />

      <div className="flex size-full flex-1 flex-col gap-4 p-6">
        <header>
          <h3 className="break-words text-lg font-bold uppercase tracking-wide">
            {t(`rooms.${item.id}.title`)}
          </h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-brand-text/70 line-clamp-2">
            {t(`rooms.${item.id}.bed_intro`)}
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Cluster>
            {facts.map((fact) => (
              <span
                key={fact}
                className="rounded-full bg-brand-surface/80 px-3 py-1 text-xs font-medium text-brand-text/80 dark:bg-brand-surface/20 dark:text-brand-surface/80"
              >
                {fact}
              </span>
            ))}
          </Cluster>
          {detailParts.length ? (
            <p className="text-sm text-brand-text/80 line-clamp-2">{detailParts.join(" · ")}</p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-3">

          {priceLoading ? (
            <p
              data-testid={TEST_IDS.priceLoading}
              className={clsx(
                "w-24",
                "animate-pulse",
                "rounded",
                "bg-brand-surface",
                "text-transparent",
                "py-2"
              )}
              role="status"
            >
              <span className="sr-only">{t("loadingPrice")}</span>
            </p>
          ) : priceLine ? (
            <p className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{priceLine}</p>
          ) : null}

          <Button
            onClick={handleCheckDates}
            className={clsx(
              "h-auto",
              "min-h-11",
              "w-full",
              "whitespace-normal",
              "break-words",
              "transition-colors",
              "hover:text-white",
              "dark:text-white"
            )}
          >
            {availabilityLabel}
          </Button>

          <Link
            to={roomHref}
            prefetch="intent"
            aria-label={detailsAriaLabel}
            title={t("details")}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-bougainvillea underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bougainvillea dark:text-white"
          >
            {t("moreAboutThisRoom")}
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(forwardRef<HTMLElement, SlideItemProps>(SlideItemBase));
