/* eslint-disable react/forbid-dom-props -- UI-1000 [ttl=2026-12-31] dynamic slide height uses inline style */
import { type CSSProperties, type ForwardedRef,forwardRef, memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CfCardImage } from "../atoms/CfCardImage";
import { Cluster } from "../components/atoms/primitives/Cluster";
import { Button } from "../components/atoms/shadcn";
import type { Room } from "../data/roomsData";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import { useRoomPricing } from "../hooks/useRoomPricing";
import type { AppLanguage } from "../i18n.config";
import { resolveSharedToken } from "../shared";
import { toAppLanguage } from "../utils/lang";
import { getSlug } from "../utils/slug";

const resolveAsset = (p: string): string => p.replace(/^\/images\//, "/img/");
const PRICE_LOADING_TEST_ID = "price-loading";
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

export interface SlideItemProps {
  item: Room;
  openModalForRate: (room: Room, rateType: "nonRefundable" | "refundable") => void;
  height?: number;
  lang?: AppLanguage;
}

const DROP_FIRST_SEGMENT = /^\/[^/]+/;

function SlideItemBase(
  { item, openModalForRate, height, lang }: SlideItemProps,
  ref: ForwardedRef<HTMLElement>
): JSX.Element {
  const { t, ready } = useTranslation("roomsPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const currentLang = useCurrentLanguage();
  const effectiveLang = lang ?? currentLang;
  const roomsSlug = getSlug("rooms", toAppLanguage(effectiveLang));
  const { loading: priceLoading, lowestPrice } = useRoomPricing(item);

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

  const handleCheckDates = useCallback(() => openModalForRate(item, "refundable"), [item, openModalForRate]);

  const imageSrc = useMemo(() => resolveAsset(item.landingImage), [item.landingImage]);
  const style = useMemo<CSSProperties | undefined>(() => (height ? { minHeight: height } : undefined), [height]);
  const detailsAriaLabel = useMemo(() => {
    if (!ready) return "";
    return `${t("moreAboutThisRoom")} ${t(`rooms.${item.id}.title`)}`;
  }, [item.id, t, ready]);

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

  const imageWrapperClass = height
    ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
      "relative w-full overflow-hidden flex-none"
    : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
      "relative w-full overflow-hidden aspect-[4/3]";

  return (
    <article
      ref={ref}
      data-slide-item
      style={style}
      className="flex h-full flex-col overflow-hidden rounded-lg bg-brand-bg shadow-md dark:bg-brand-surface dark:border dark:border-white/5"
    >
      <CfCardImage
        src={imageSrc}
        alt={`${t(`rooms.${item.id}.title`)} landing`}
        wrapperClassName={imageWrapperClass}
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
      />

      <div className="flex h-full w-full flex-col gap-3 p-4 sm:p-6 md:flex-1">
        <header>
          <h3 className="break-words text-lg font-bold uppercase tracking-wide">{t(`rooms.${item.id}.title`)}</h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-brand-text/70 line-clamp-2 hidden sm:block">
            {t(`rooms.${item.id}.bed_intro`)}
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Cluster gap={2}>
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
            <p className="text-sm text-brand-text/80 line-clamp-2 hidden sm:block">{detailParts.join(" · ")}</p>
          ) : null}
        </div>

        <div className="md:mt-auto flex flex-col gap-3">

          {priceLoading ? (
            <div
              data-testid={PRICE_LOADING_TEST_ID}
              aria-hidden="true"
              className="h-5 w-24 animate-pulse rounded bg-brand-surface"
            />
          ) : priceLine ? (
            <p className="text-sm font-semibold text-brand-heading">{priceLine}</p>
          ) : null}

          <Button
            onClick={handleCheckDates}
            className="h-auto min-h-11 w-full whitespace-normal break-words transition-colors hover:text-white dark:text-white"
          >
            {availabilityLabel}
          </Button>

          <Link
            href={roomHref}
            prefetch
            aria-label={detailsAriaLabel}
            title={t("details")}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-bougainvillea underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bougainvillea dark:text-white"
          >
            {t("moreAboutThisRoom")} <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(forwardRef<HTMLElement, SlideItemProps>(SlideItemBase));
export { SlideItemBase as SlideItem };
