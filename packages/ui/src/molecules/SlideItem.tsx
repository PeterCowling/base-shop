// Copied from src/components/accommodations-carousel/SlideItem.tsx
import { CfCardImage } from "../atoms/CfCardImage";
import { Button } from "../atoms/Button";
import type { Room } from "@/data/roomsData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useRoomPricing } from "@/hooks/useRoomPricing";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { forwardRef, memo, useCallback, useMemo, type CSSProperties, type ForwardedRef } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "@/i18n.config";
import { Stack } from "@/components/atoms/primitives/Stack";

const resolveAsset = (p: string): string => p.replace(/^\/images\//, "/img/");
const PRICE_LOADING_TEST_ID = "price-loading";

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
  const currentLang = useCurrentLanguage();
  const effectiveLang = lang ?? currentLang;
  const roomsSlug = getSlug("rooms", toAppLanguage(effectiveLang));
  const { loading: priceLoading } = useRoomPricing(item);

  const restPath = useMemo(() => item.roomsHref.replace(DROP_FIRST_SEGMENT, ""), [item.roomsHref]);
  const roomHref = `/${effectiveLang}/${roomsSlug}${restPath}`;

  const { nonRefundablePrice, flexiblePrice } = useMemo(() => {
    if (!ready) {
      return { nonRefundablePrice: "", flexiblePrice: "" };
    }
    return {
      nonRefundablePrice: t(`rooms.${item.id}.prices.nonRefundable`),
      flexiblePrice: t(`rooms.${item.id}.prices.flexible`),
    };
  }, [item.id, t, ready]);

  const handleNonRefundable = useCallback(() => openModalForRate(item, "nonRefundable"), [item, openModalForRate]);
  const handleFlexible = useCallback(() => openModalForRate(item, "refundable"), [item, openModalForRate]);

  const imageSrc = useMemo(() => resolveAsset(item.landingImage), [item.landingImage]);
  const style = useMemo<CSSProperties | undefined>(() => (height ? { height } : undefined), [height]);
  const detailsAriaLabel = useMemo(() => {
    if (!ready) return "";
    return `${t("moreAboutThisRoom")} ${t(`rooms.${item.id}.title`)}`;
  }, [item.id, t, ready]);

  const rateBtnCls =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "h-auto min-h-11 w-full whitespace-normal break-words transition-colors hover:text-white dark:text-white";

  const imageWrapperClass = height
    ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
      "relative w-full overflow-hidden flex-none"
    : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
      "relative w-full overflow-hidden aspect-[4/3]";

  return (
    // eslint-disable-next-line react/forbid-dom-props -- UI-1000 [ttl=2026-12-31] slide height is runtime-configurable
    <article ref={ref} data-slide-item style={style} className="flex h-full flex-col overflow-hidden rounded-lg bg-brand-bg shadow-md dark:bg-brand-surface dark:border dark:border-white/5">
      <CfCardImage
        src={imageSrc}
        alt={`${t(`rooms.${item.id}.title`)} landing`}
        wrapperClassName={imageWrapperClass}
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
      />

      <div className="flex h-full w-full flex-1 flex-col gap-4 p-6">
        <header>
          <h3 className="break-words text-lg font-bold uppercase tracking-wide">{t(`rooms.${item.id}.title`)}</h3>
          <p className="mt-2 break-words text-sm leading-relaxed text-brand-text/70">{t(`rooms.${item.id}.bed_intro`)}</p>
        </header>

        <div className="mt-auto flex flex-col gap-3">
          <Stack gap={3}>
            {priceLoading ? (
              <div
                data-testid={PRICE_LOADING_TEST_ID}
                aria-hidden="true"
                className="h-5 w-24 animate-pulse rounded bg-brand-surface"
              />
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
          </Stack>

          <Button
            asChild
            variant="outline"
            ariaLabel={detailsAriaLabel}
            className="h-auto min-h-11 w-full border-2 border-brand-bougainvillea text-brand-bougainvillea focus-visible:ring-2 focus-visible:ring-brand-bougainvillea dark:border-white/20 dark:text-white"
          >
            <Link
              to={roomHref}
              prefetch="intent"
              aria-label={detailsAriaLabel}
              title={t("details")}
              className="flex w-full items-center justify-center gap-2"
            >
              {t("moreAboutThisRoom")} <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default memo(forwardRef<HTMLElement, SlideItemProps>(SlideItemBase));
export { SlideItemBase as SlideItem };
