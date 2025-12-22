// src/components/accommodations-carousel/SlideItem.tsx
/* ────────────────────────────────────────────────────────────────
   Single room card used by <CarouselSlides>
---------------------------------------------------------------- */
import { CfCardImage } from "@/components/images/CfCardImage";
import { Button, Grid } from "@acme/ui/atoms";
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
  const { t } = useTranslation("roomsPage", translationOptions);
  // Always call hooks unconditionally; derive effective language afterward
  const currentLang = useCurrentLanguage();
  const effectiveLang = lang ?? currentLang;
  const roomsSlug = getSlug("rooms", toAppLanguage(effectiveLang));
  const { loading: priceLoading } = useRoomPricing(item);

  /* Build canonical room href with translated slug */
  const restPath = useMemo(() => item.roomsHref.replace(DROP_FIRST_SEGMENT, ""), [item.roomsHref]);
  const roomHref = `/${effectiveLang}/${roomsSlug}${restPath}`;

  /* Translations & price strings */
  const { nonRefundablePrice, flexiblePrice } = useMemo(
    () => ({
      nonRefundablePrice: t(`rooms.${item.id}.prices.nonRefundable`),
      flexiblePrice: t(`rooms.${item.id}.prices.flexible`),
    }),
    [item.id, t]
  );

  /* Callbacks */
  const handleNonRefundable = useCallback(
    () => openModalForRate(item, "nonRefundable"),
    [item, openModalForRate]
  );
  const handleFlexible = useCallback(
    () => openModalForRate(item, "refundable"),
    [item, openModalForRate]
  );

  /* Image + dynamic height */
  const imageSrc = useMemo(() => resolveAsset(item.landingImage), [item.landingImage]);
  const style = useMemo<CSSProperties | undefined>(
    () => (height ? { height } : undefined),
    [height]
  );

  const rateBtnCls = clsx(
    "h-auto",
    "min-h-11",
    "w-full",
    "whitespace-normal",
    "break-words",
    "transition-colors",
    "hover:text-brand-bg",
    "text-brand-bg",
    "dark:text-brand-heading"
  );

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
          <p className="mt-2 break-words text-sm leading-relaxed text-brand-text/70">
            {t(`rooms.${item.id}.bed_intro`)}
          </p>
        </header>

        <Grid as="div" gap={3} className="content-start">
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
          ) : (
            <>
              <Button className={rateBtnCls} onClick={handleNonRefundable}>
                {t("checkRatesNonRefundable")} – {t("ratesFrom", { price: nonRefundablePrice })}
              </Button>

              <Button className={rateBtnCls} onClick={handleFlexible}>
                {t("checkRatesFlexible")} – {t("ratesFrom", { price: flexiblePrice })}
              </Button>
            </>
          )}
        </Grid>

        <Button
          asChild
          variant="outline"
          ariaLabel={detailsAriaLabel}
          className={clsx(
            "mt-auto",
            "h-auto",
            "min-h-11",
            "w-full",
            "border-2",
            "border-brand-bougainvillea",
            "text-brand-bougainvillea",
            "focus-visible:ring-2",
            "focus-visible:ring-brand-bougainvillea",
            "dark:border-brand-outline/30",
            "dark:text-brand-heading"
          )}
        >
          <Grid
            as={Link}
            to={roomHref}
            prefetch="intent"
            aria-label={detailsAriaLabel}
            title={t("details")}
            gap={2}
            className={clsx(
              "w-full",
              "auto-cols-max",
              "grid-flow-col",
              "items-center",
              "justify-center"
            )}
          >
            {t("moreAboutThisRoom")}
            <ArrowRight className="size-4 shrink-0" />
          </Grid>
        </Button>
      </div>
    </article>
  );
}

export default memo(forwardRef<HTMLElement, SlideItemProps>(SlideItemBase));
