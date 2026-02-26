// packages/ui/src/organisms/LandingHeroSection.tsx
import { type FC, memo, type SVGProps, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ArrowRight, BusFront, ConciergeBell, Sparkles, Star, Waves } from "lucide-react";

import { CfHeroImage } from "../atoms/CfHeroImage";
import { Section } from "../atoms/Section";
import { Inline } from "../components/atoms/primitives/Inline";
import hotel from "../config/hotel";
import { useOptionalModal } from "../context/ModalContext";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import type { AppLanguage } from "../i18n.config";
import { i18nConfig } from "../i18n.config";
import { resolveSharedToken } from "../shared";
// buildCfImageUrl is available via CfHeroImage internally
import { translatePath } from "../utils/translate-path";

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

const FALLBACK_TRUST_ITEMS = [
  "100 m to the SITA bus stop",
  "Sea-view terrace",
  "Digital concierge tips",
];

function looksLikeI18nKeyToken(value: string): boolean {
  if (!value.includes(".")) return false;
  const parts = value.split(".");
  if (parts.length < 2) return false;
  for (const part of parts) {
    if (!part) return false;
    for (let i = 0; i < part.length; i += 1) {
      const code = part.charCodeAt(i);
      const isLowerAlpha = code >= 97 && code <= 122;
      const isUpperAlpha = code >= 65 && code <= 90;
      const isDigit = code >= 48 && code <= 57;
      const isUnderscore = code === 95;
      if (!isLowerAlpha && !isUpperAlpha && !isDigit && !isUnderscore) {
        return false;
      }
    }
  }
  return true;
}

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (looksLikeI18nKeyToken(trimmed)) return fallback;
  return trimmed;
}

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
      className="mt-3 overflow-x-auto text-xs font-medium text-foreground/80 sm:mt-4 sm:text-sm"
    >
            {items.map(({ label, Icon }) => (
              <span
                role="listitem"
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-primary-fg/30 bg-surface/80 px-3 py-1 sm:whitespace-nowrap"
              >
                <Icon className="size-4 text-foreground/70" aria-hidden />
                <span className="hidden md:inline">{label}</span>
                <span className="sr-only md:hidden">{label}</span>
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
    <div className="rounded-2xl border border-white/15 bg-brand-primary/85 p-5 text-brand-on-primary shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-black/70 dark:text-brand-text">
      {ratings.length ? (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-on-primary/70 dark:text-brand-text/70">
            <Star className="size-3.5 text-brand-on-primary/70" aria-hidden />
            <span>{heading}</span>
          </div>
          <ul className="mt-3 divide-y divide-white/15 text-sm dark:divide-white/10">
            {ratings.map((item) => (
              <li key={item.providerLabel} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="font-semibold text-brand-on-primary dark:text-brand-text">{item.providerLabel}</p>
                  <p className="text-xs text-brand-on-primary/65 dark:text-brand-text/65">{item.reviewText}</p>
                </div>
                <span className="text-xl font-bold tabular-nums text-brand-on-primary dark:text-brand-text">
                  {item.score}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {highlights.length ? (
        <ul
          className={`mt-3.5 space-y-2.5 text-sm text-brand-on-primary/85 ${ratings.length ? "border-t border-white/15 pt-3.5 dark:border-white/10" : ""} dark:text-brand-text/85`} // i18n-exempt -- PB-000 [ttl=2025-12-31]: CSS utility classes only
        >
          {highlights.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-brand-on-primary/60 dark:text-brand-text/60" aria-hidden />
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

  const heroIntro = resolveTranslatedCopy(
    t("introSection.title", { defaultValue: "A Beautiful Home Away From Home" }),
    "A Beautiful Home Away From Home"
  );
  const heroTitle = resolveTranslatedCopy(
    t("heroSection.title", { defaultValue: "Hostel Brikette, Positano" }),
    "Hostel Brikette, Positano"
  );
  const heroSubtitle = resolveTranslatedCopy(
    t("heroSection.subtitle", {
      defaultValue: "Positano's only hostel - sea views, common areas, and a digital concierge.",
    }),
    "Positano's only hostel - sea views, common areas, and a digital concierge."
  );
  const secondaryCta = resolveTranslatedCopy(
    t("heroSection.secondaryCta", { defaultValue: "View rooms" }),
    "View rooms"
  );
  const trustItems = useMemo(() => {
    if (!ready) return FALLBACK_TRUST_ITEMS;
    const raw = t("heroSection.trustItems", { returnObjects: true }) as unknown;
    const items = Array.isArray(raw) ? (raw.filter((item) => typeof item === "string") as string[]) : [];
    if (!items.length) {
      return FALLBACK_TRUST_ITEMS;
    }
    return items.map((item, idx) =>
      resolveTranslatedCopy(item, FALLBACK_TRUST_ITEMS[idx] ?? FALLBACK_TRUST_ITEMS[0])
    );
  }, [ready, t]);

  const handleReserve = useCallback(() => {}, []);
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
      const providerLabelKey = sourceKey ? `sources.${sourceKey}.label` : "";
      const translatedProviderLabel = providerLabelKey
        ? ((tRatings(providerLabelKey) as string) ?? "").trim()
        : "";
      const providerLabel =
        translatedProviderLabel && translatedProviderLabel !== providerLabelKey
          ? translatedProviderLabel
          : rating.provider;
      const formattedCount = rating.count.toLocaleString(locale);
      const reviewTextKey = "countReviews";
      const translatedReviewText = (
        tRatings(reviewTextKey, { count: rating.count, formattedCount }) as string
      ).trim();
      const reviewText =
        translatedReviewText && translatedReviewText !== reviewTextKey
          ? translatedReviewText
          : `${formattedCount} reviews`;
      return {
        providerLabel,
        reviewText,
        score: rating.value.toFixed(1),
      };
    });
  }, [lang, ratingsI18n.language, tRatings]);

  return (
    <section className="w-full">
      <div className="relative isolate w-full min-h-96 sm:min-h-screen lg:min-h-screen">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <CfHeroImage
            src={heroOriginal}
            alt={resolveTranslatedCopy(
              t("heroSection.imageAlt", {
                defaultValue: "Panoramic view of Positano from Hostel Brikette terrace",
              }),
              "Panoramic view of Positano from Hostel Brikette terrace"
            )}
            quality={85}
            width={1920}
            height={1080}
            priority
            className="h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-r from-brand-bg/70 via-brand-bg/35 to-brand-bg/0" />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-t from-brand-bg/30 to-transparent" />
        </div>

        <Section
          as="div"
          padding="none"
          width="full"
          className="relative z-20 mx-auto h-full max-w-6xl px-6 pb-8 pt-8 sm:pb-12 sm:pt-10 lg:pb-14"
        >
          <div className="grid w-full items-start gap-8 lg:grid-cols-2 lg:gap-10">
            <Section as="div" padding="none" width="full" className="max-w-xl px-4 sm:px-0 text-primary-fg motion-safe:animate-fade-up">
              <span className="block w-full text-xs uppercase tracking-widest text-primary-fg/75 sm:text-sm">
                {heroIntro}
              </span>
              <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight tracking-tight text-primary-fg drop-shadow-lg sm:text-5xl lg:text-5xl xl:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-4 text-base text-primary-fg/90 sm:text-lg lg:text-xl">{heroSubtitle}</p>

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
                    className="min-h-12 min-w-11 rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-brand-on-primary focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
                  >
                    {selectDatesLabel}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="min-h-12 min-w-11 rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-brand-on-primary focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
                  >
                    {selectDatesLabel}
                  </button>
                )}
                <Link
                  href={`/${lang}/${translatePath("rooms", lang)}`}
                  prefetch={true}
                  className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-full border border-primary-fg/40 bg-surface/10 px-7 py-3 text-sm font-semibold text-primary-fg transition hover:border-white hover:bg-surface/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  {secondaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              {perksLabel ? (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary-fg/80">
                  <Sparkles className="size-4 text-primary-fg/70" aria-hidden />
                  <button
                    type="button"
                    onClick={handlePerksClick}
                    className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    {perksLabel}
                  </button>
                </div>
              ) : null}
            </Section>

            <aside className="hidden lg:flex lg:justify-end motion-safe:animate-fade-up [animation-delay:150ms]">
              <Section as="div" padding="none" width="full" className="max-w-sm px-4 lg:px-0">
                <HeroProofPanel
                  heading={resolveTranslatedCopy(tRatings("reviewed", { defaultValue: "Reviewed" }), "Reviewed")}
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
