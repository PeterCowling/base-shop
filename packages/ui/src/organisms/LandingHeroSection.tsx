// packages/ui/src/organisms/LandingHeroSection.tsx
import { CfHeroImage } from "../atoms/CfHeroImage";
import { Section } from "@/atoms/Section";
import { CONTACT_EMAIL } from "@/config/hotel";
import { useOptionalModal } from "@/context/ModalContext";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { translatePath } from "@/utils/translate-path";
import { FC, memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { type LinkDescriptor, type LinksFunction } from "react-router";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { resolveBookingCtaLabel } from "@acme/ui/shared";

const heroOriginal = "/img/landing-xl.webp";
// i18n-exempt -- UI-1000 [ttl=2026-12-31] Address is used only to build a Maps URL.
const HOSTEL_ADDRESS = "Via Guglielmo Marconi, 358, 84017 Positano SA";
const MAPS_URL = `https://www.google.com/maps/place/${encodeURIComponent(HOSTEL_ADDRESS)}`;

const LandingHeroSection: FC<{ lang?: AppLanguage }> = ({ lang: explicitLang }) => {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t, ready } = useTranslation("landingPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { openModal } = useOptionalModal();

  const reserveLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return "Reserve Now";
    }
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const direct = t("heroSection.reserveNow") as string;
          if (direct && direct.trim() && direct !== "heroSection.reserveNow") {
            return direct;
          }
          const fallback = t("heroSection.reserveNow", { lng: i18nConfig.fallbackLng }) as string;
          if (fallback && fallback.trim() && fallback !== "heroSection.reserveNow") {
            return fallback;
          }
          return "Reserve Now";
        },
      }) ?? "Reserve Now"
    );
  }, [t, tTokens, ready, tokensReady]);

  const text = {
    brandName: t("heroSection.brandName"),
    cityName: t("heroSection.cityName"),
    hostelAddress: t("heroSection.address"),
    locationBtnLabel: t("heroSection.locationButton"),
    contactBtnLabel: t("heroSection.contactButton"),
    helpBtnLabel: t("heroSection.helpButton"),
    reserveNowLabel: reserveLabel,
  };

  const handleReserve = useCallback(() => openModal("booking"), [openModal]);

  return (
    <section className="w-full">
      {/* 1️⃣  Panoramic image */}
      <div className="relative isolate h-[var(--landing-hero-height,60vh)] w-full overflow-hidden sm:h-[var(--landing-hero-height-sm,70vh)] lg:h-[var(--landing-hero-height-lg,85vh)]">
        <CfHeroImage
          src={heroOriginal}
          alt={t("heroSection.imageAlt")}
          quality={85}
          width={1920}
          height={1080}
          priority
          className="h-full w-full object-cover"
        />
        <div aria-hidden className="hero-gradient-overlay" />
      </div>

      {/* 2️⃣  Brand card */}
      <div className="bg-brand-bg/90 px-4 py-10 dark:bg-brand-text">
        <Section
          as="div"
          padding="none"
          width="full"
          className="hero-panel mx-auto flex w-full max-w-[var(--landing-hero-panel-max-w,92vw)] flex-col items-center px-6 py-8 sm:max-w-xl sm:px-10 md:max-w-2xl md:py-10 lg:max-w-3xl text-center text-white"
        >
          <span className="mb-2 block text-xs uppercase tracking-widest text-white/80">
            {text.brandName}
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight drop-shadow-lg text-white text-balance">
            <span className="sr-only" aria-hidden>
              {t("heroSection.brandSrOnlyPrefix", { defaultValue: "hostel brikette" })}&nbsp;
            </span>
            <span>{text.cityName}</span>
          </h1>

          <span className="mt-3 block break-words text-lg text-white/90 md:text-xl">
            {text.hostelAddress}
          </span>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-12 sm:gap-y-4 text-sm md:text-base">
            {[
              { href: MAPS_URL, label: text.locationBtnLabel },
              { href: `mailto:${CONTACT_EMAIL}`, label: text.contactBtnLabel },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={
                  href.startsWith("http")
                    ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] rel attribute value */
                      "noopener noreferrer"
                    : undefined
                }
                className="group relative inline-flex min-h-10 min-w-10 items-center justify-center pb-0.5 px-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-current after:transition-transform after:duration-200 hover:after:scale-x-0"
              >
                {label}
              </a>
            ))}

            <Link
              to={`/${lang}/${translatePath("assistance", lang)}`}
              className="group relative inline-flex min-h-10 min-w-10 items-center justify-center pb-0.5 px-2 text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-current after:transition-transform after:duration-200 hover:after:scale-x-0"
            >
              {text.helpBtnLabel}
            </Link>
          </div>

          <button
            type="button"
            onClick={handleReserve}
            className="mt-8 rounded-full bg-brand-secondary px-10 py-4 min-h-10 min-w-10 font-bold tracking-wide text-neutral-900 shadow-md transition-colors duration-200 hover:bg-brand-primary hover:text-white focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
          >
            {text.reserveNowLabel}
          </button>
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
