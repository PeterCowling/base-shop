// packages/ui/src/organisms/ApartmentHeroSection.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { useModal } from "@acme/ui/context/ModalContext";
import { i18nConfig } from "@acme/ui/i18n.config";

import { Button } from "../atoms/Button";
import { CfHeroImage } from "../atoms/CfHeroImage";
import { Section } from "../atoms/Section";
import { resolveBookingCtaLabel } from "../shared";

const APARTMENT_HERO_IMAGE_SRC = "/img/facade.avif";

interface HeroSectionProps {
  bookingUrl?: string;
  lang?: string;
}

function ApartmentHeroSection({ bookingUrl, lang }: HeroSectionProps): JSX.Element {
  const { t, ready } = useTranslation("apartmentPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { openModal } = useModal();

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
    <section className="relative isolate h-[var(--apartment-hero-height,60vh)] w-full overflow-hidden">
      <CfHeroImage
        src={APARTMENT_HERO_IMAGE_SRC}
        alt={t("heroImageAlt")}
        width={1920}
        height={1080}
        quality={85}
        fetchPriority="high"
        className="h-full w-full object-cover"
      />
      <div aria-hidden className="hero-gradient-overlay" />

      <div className="absolute inset-0 flex items-center justify-center">
        <Section as="div" padding="none" className="hero-panel max-w-md space-y-4 px-6 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">{t("heroTitle")}</h2>
          <p className="mx-auto text-sm sm:text-base">{t("heroIntro")}</p>
          {(() => {
            if (bookingUrl) {
              return (
                <Button asChild className="cta-light dark:cta-dark">
                  {bookingUrl.startsWith("/") ? (
                    <Link href={bookingUrl}>{ctaLabel}</Link>
                  ) : (
                    <a href={bookingUrl}>{ctaLabel}</a>
                  )}
                </Button>
              );
            }
            return (
              <Button onClick={() => openModal("booking")} className="cta-light dark:cta-dark">
                {ctaLabel}
              </Button>
            );
          })()}
        </Section>
      </div>
    </section>
  );
}

export default memo(ApartmentHeroSection);
export { ApartmentHeroSection };
