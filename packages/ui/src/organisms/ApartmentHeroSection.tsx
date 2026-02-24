// packages/ui/src/organisms/ApartmentHeroSection.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { CfHeroImage } from "../atoms/CfHeroImage";
import { i18nConfig } from "../i18n.config";
import { resolveBookingCtaLabel } from "../shared";

const APARTMENT_HERO_IMAGE_SRC = "/img/677397746.jpg";

interface HeroSectionProps {
  bookingUrl?: string;
  lang?: string;
  onBookingCtaClick?: () => void;
}

function ApartmentHeroSection({ bookingUrl, lang, onBookingCtaClick }: HeroSectionProps): JSX.Element {
  const { t, ready } = useTranslation("apartmentPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });

  const ctaLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return "Book Now";
    }
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const current = t("bookButton") as string;
          if (current && current.trim() && current !== "bookButton") {
            return current;
          }
          const fallback = t("bookButton", { lng: i18nConfig.fallbackLng }) as string;
          return fallback && fallback.trim() && fallback !== "bookButton" ? fallback : undefined;
        },
      }) ?? "Book Now"
    );
  }, [t, tTokens, ready, tokensReady]);

  return (
    <section className="w-full">
      <div className="relative isolate w-full min-h-[var(--apartment-hero-height,28rem)] sm:min-h-[var(--apartment-hero-height-sm,32rem)] lg:min-h-[var(--apartment-hero-height-lg,36rem)]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <CfHeroImage
            src={APARTMENT_HERO_IMAGE_SRC}
            alt={t("heroImageAlt")}
            width={1920}
            height={1080}
            quality={85}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-r from-black/65 via-black/35 to-black/10" />
          <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="relative z-20 mx-auto max-w-6xl px-6 pb-8 pt-8 sm:pb-12 sm:pt-10 lg:pb-14">
          <div className="max-w-xl space-y-4">
            <span className="block text-xs uppercase tracking-widest text-white/75 sm:text-sm">
              {t("heroTagline")}
            </span>
            <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {t("heroTitle")}
            </h2>
            <p className="text-base text-white/90 sm:text-lg">
              {t("heroIntro")}
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {bookingUrl ? (
                bookingUrl.startsWith("/") ? (
                  <Link
                    href={bookingUrl}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors hover:bg-brand-primary hover:text-brand-on-primary"
                  >
                    {ctaLabel}
                  </Link>
                ) : (
                  <a
                    href={bookingUrl}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors hover:bg-brand-primary hover:text-brand-on-primary"
                  >
                    {ctaLabel}
                  </a>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => onBookingCtaClick?.()}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors hover:bg-brand-primary hover:text-brand-on-primary"
                >
                  {ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(ApartmentHeroSection);
export { ApartmentHeroSection };
