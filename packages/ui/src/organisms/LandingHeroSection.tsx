// packages/ui/src/organisms/LandingHeroSection.tsx
import { CfHeroImage } from "../atoms/CfHeroImage";
import { Section } from "../atoms/Section";
import { Inline } from "../components/atoms/primitives/Inline";
import { useOptionalModal } from "@ui/context/ModalContext";
import { useCurrentLanguage } from "@ui/hooks/useCurrentLanguage";
import buildCfImageUrl from "@ui/lib/buildCfImageUrl";
import { translatePath } from "@ui/utils/translate-path";
import { ArrowRight, BusFront, ConciergeBell, Sparkles, Star, Waves } from "lucide-react";
import { FC, memo, useCallback, useMemo, type SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { type LinkDescriptor, type LinksFunction } from "react-router";
import type { AppLanguage } from "@ui/i18n.config";
import { i18nConfig } from "@ui/i18n.config";
import { resolveSharedToken } from "../shared";
import hotel from "@ui/config/hotel";

const heroOriginal = "/img/landing-xl.webp";

interface LandingHeroSectionProps {
  lang?: AppLanguage;
  onPrimaryCtaClick?: () => void;
}

type HeroProofItem = {
  label: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

type HeroRatingItem = {
  providerLabel: string;
  reviewText: string;
  score: string;
};

const RATING_SOURCE_KEYS: Record<string, string> = {
  Hostelworld: "hostelworld",
  "Booking.com": "booking",
};

const HeroProofRow = memo(function HeroProofRow({ items }: { items: HeroProofItem[] }): JSX.Element {
  return (
    <Inline
      gap={2}
      wrap={false}
      role="list"
      className="mt-3 overflow-x-auto text-xs font-medium text-black/80 sm:mt-4 sm:text-sm"
    >
      {items.map(({ label, Icon }) => (
        <span
          role="listitem"
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-3 py-1 sm:whitespace-nowrap"
        >
          <Icon className="size-4 text-black/70" aria-hidden />
          <span>{label}</span>
        </span>
      ))}
    </Inline>
  );
});

const HeroProofPanel = memo(function HeroProofPanel({
  heading,
  ratings,
  highlights,
}: {
  heading: string;
  ratings: HeroRatingItem[];
  highlights: HeroProofItem[];
}): JSX.Element | null {
  if (!ratings.length && !highlights.length) return null;

  return (
    <div className="rounded-2xl border border-white/20 bg-black/50 p-4 text-white shadow-md">
      {ratings.length ? (
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Star className="size-4 text-white/80" aria-hidden />
            <span>{heading}</span>
          </div>
          <ul className="mt-3 divide-y divide-white/10 text-sm">
            {ratings.map((item) => (
              <li key={item.providerLabel} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold text-white">{item.providerLabel}</p>
                  <p className="text-xs text-white/70">{item.reviewText}</p>
                </div>
                <span className="text-base font-semibold text-white">{item.score}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {highlights.length ? (
        <ul
          className={`mt-4 space-y-2 text-sm text-white/90 ${ratings.length ? "border-t border-white/10 pt-4" : ""}`} // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
        >
          {highlights.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="size-4 text-white/70" aria-hidden />
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

const LandingHeroSection: FC<LandingHeroSectionProps> = ({ lang: explicitLang, onPrimaryCtaClick }) => {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t, ready } = useTranslation("landingPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { t: tRatings, i18n: ratingsI18n } = useTranslation("ratingsBar", { lng: lang });
  const { openModal } = useOptionalModal();
  const perksAriaFallback =
    /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback aria label copy. */
    "Learn about direct perks";

  const selectDatesLabel = useMemo(() => {
    const direct = t("heroSection.selectDatesCta") as string;
    if (direct && direct.trim() && direct !== "heroSection.selectDatesCta") {
      return direct;
    }
    const fallback = t("heroSection.primaryCta") as string;
    if (fallback && fallback.trim() && fallback !== "heroSection.primaryCta") {
      return fallback;
    }
    const fallbackEn = t("heroSection.primaryCta", { lng: i18nConfig.fallbackLng }) as string;
    if (fallbackEn && fallbackEn.trim() && fallbackEn !== "heroSection.primaryCta") {
      return fallbackEn;
    }
    return "Select dates";
  }, [t]);

  const perksLabel = useMemo(() => {
    if (!tokensReady) {
      return "";
    }
    const perks = resolveSharedToken(tTokens, "directBookingPerks", {
      fallback: () =>
        /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback token copy. */
        "Direct booking perks",
    });
    const bestPrice = resolveSharedToken(tTokens, "bestPriceGuaranteed", {
      fallback: () =>
        /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback token copy. */
        "Best price guaranteed",
    });
    return [perks, bestPrice].filter(Boolean).join(" • ");
  }, [tTokens, tokensReady]);

  const heroIntro = t("introSection.title");
  const heroTitle = t("heroSection.title");
  const heroSubtitle = t("heroSection.subtitle");
  const secondaryCta = t("heroSection.secondaryCta");
  const trustItems = useMemo(() => {
    if (!ready) return [] as string[];
    const raw = t("heroSection.trustItems", { returnObjects: true }) as unknown;
    return Array.isArray(raw) ? (raw.filter((item) => typeof item === "string") as string[]) : [];
  }, [ready, t]);

  const handleReserve = useCallback(() => openModal("booking"), [openModal]);
  const handlePrimaryCta = useCallback(() => {
    if (onPrimaryCtaClick) {
      onPrimaryCtaClick();
      return;
    }
    handleReserve();
  }, [handleReserve, onPrimaryCtaClick]);
  const handlePerksClick = useCallback(() => openModal("offers"), [openModal]);

  const trustIcons = useMemo(() => [BusFront, Waves, ConciergeBell], []);
  const proofItems = useMemo<HeroProofItem[]>(
    () =>
      trustItems.map((item, idx) => ({
        label: item,
        Icon: trustIcons[idx] ?? Sparkles,
      })),
    [trustItems, trustIcons],
  );
  const ratingItems = useMemo<HeroRatingItem[]>(() => {
    const ratings = hotel.ratings ?? [];
    if (!ratings.length) return [];
    const locale = lang ?? ratingsI18n.language ?? i18nConfig.fallbackLng;
    return ratings.map((rating) => {
      const sourceKey = RATING_SOURCE_KEYS[rating.provider];
      const providerLabel = sourceKey
        ? (tRatings(`sources.${sourceKey}.label`) as string)
        : rating.provider;
      const formattedCount = rating.count.toLocaleString(locale);
      const reviewText = tRatings("countReviews", { count: rating.count, formattedCount }) as string;
      return {
        providerLabel,
        reviewText,
        score: rating.value.toFixed(1),
      };
    });
  }, [lang, ratingsI18n.language, tRatings]);

  return (
    <section className="w-full">
      <div className="relative isolate w-full min-h-[var(--landing-hero-min-h,28rem)] sm:min-h-[var(--landing-hero-min-h-sm,32rem)] lg:min-h-[var(--landing-hero-min-h-lg,36rem)]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <CfHeroImage
            src={heroOriginal}
            alt={t("heroSection.imageAlt")}
            quality={85}
            width={1920}
            height={1080}
            priority
            className="h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <Section
          as="div"
          padding="none"
          width="full"
          className="relative z-20 mx-auto h-full max-w-6xl px-6 pb-8 pt-8 sm:pb-12 sm:pt-10 lg:pb-14"
        >
          <div className="grid w-full items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <Section as="div" padding="none" width="full" className="max-w-xl px-4 sm:px-0 text-white">
              <span className="block w-full text-xs uppercase tracking-widest text-white/75 sm:text-sm">
                {heroIntro}
              </span>
              <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-5xl xl:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-4 text-base text-white/90 sm:text-lg lg:text-xl">
                {heroSubtitle}
              </p>

              {proofItems.length ? (
                <div className="mt-4 lg:hidden">
                  <HeroProofRow items={proofItems} />
                </div>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {onPrimaryCtaClick ? (
                  <a
                    href="#booking"
                    onClick={handlePrimaryCta}
                    className="min-h-12 min-w-11 rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-neutral-900 shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-white focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
                  >
                    {selectDatesLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="min-h-12 min-w-11 rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-neutral-900 shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-white focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
                  >
                    {selectDatesLabel}
                  </button>
                )}
                <Link
                  to={`/${lang}/${translatePath("rooms", lang)}`}
                  prefetch="intent"
                  className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {secondaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              {perksLabel ? (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-white/80">
                  <Sparkles className="size-4 text-white/70" aria-hidden />
                  <button
                    type="button"
                    onClick={handlePerksClick}
                    className="inline-flex min-h-10 min-w-10 items-center underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label={
                      (t("heroSection.perksCtaLabel", { defaultValue: perksAriaFallback }) as string) ||
                      perksAriaFallback
                    }
                  >
                    {perksLabel}
                  </button>
                </div>
              ) : null}
            </Section>
            <aside className="hidden lg:flex lg:justify-end">
              <Section as="div" padding="none" width="full" className="max-w-sm px-4 lg:px-0">
                <HeroProofPanel
                  heading={tRatings("reviewed") as string}
                  ratings={ratingItems}
                  highlights={proofItems}
                />
              </Section>
            </aside>
          </div>
        </Section>
      </div>
    </section>
  );
};

export default memo(LandingHeroSection);

// Preload hero image variants
export const links: LinksFunction = () => {
  const widths = [400, 768, 1024, 1920] as const;

  const imageSrcSet = widths
    .map(
      (w) =>
        `${buildCfImageUrl(heroOriginal, {
          width: w,
          quality: 85,
          format: "auto",
        })} ${w}w`
    )
    .join(", ");

  const href = buildCfImageUrl(heroOriginal, { width: 1920, quality: 85, format: "auto" });

  return [
    {
      rel: "preload",
      as: "image",
      fetchPriority: "high",
      imageSrcSet,
      imageSizes: "100vw",
      href,
    } as unknown as LinkDescriptor,
  ];
};
