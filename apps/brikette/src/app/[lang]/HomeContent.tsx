"use client";

// src/app/[lang]/HomeContent.tsx
// Client component for home page
import { Fragment, memo, Suspense, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

import { Section } from "@acme/ui/atoms";
import HeroSection from "@acme/ui/organisms/LandingHeroSection";
import QuickLinksSection from "@acme/ui/organisms/QuickLinksSection";

import BookingWidget from "@/components/landing/BookingWidget";
import FaqStrip from "@/components/landing/FaqStrip";
import LocationMiniBlock from "@/components/landing/LocationMiniBlock";
import SocialProofSection from "@/components/landing/SocialProofSection";
import WhyStaySection from "@/components/landing/WhyStaySection";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { useOptionalModal } from "@/context/ModalContext";
import { type Room,roomsData } from "@/data/roomsData";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { preloadI18nNamespaces,preloadNamespacesWithFallback } from "@/utils/loadI18nNs";

// Lazy load heavy components
const IntroTextBox = dynamic(() => import("@/components/landing/IntroTextBox"), {
  ssr: false,
  loading: () => null,
});
const CarouselSlides = dynamic(() => import("@/components/accommodations-carousel/CarouselSlides"), {
  ssr: false,
  loading: () => null,
});

type Props = {
  lang: AppLanguage;
};

function HomeContent({ lang }: Props) {
  const { openModal } = useOptionalModal();

  // Preload namespaces
  useEffect(() => {
    const loadNamespaces = async () => {
      await preloadNamespacesWithFallback(lang, [
        "landingPage",
        "guides",
        "testimonials",
        "faq",
      ]);
      await preloadI18nNamespaces(lang, ["_tokens", "roomsPage", "ratingsBar", "modals"], {
        optional: true,
      });
      await i18n.changeLanguage(lang);
    };
    void loadNamespaces();
  }, [lang]);

  const handleReserve = useCallback(() => {
    openModal("booking");
  }, [openModal]);

  // Handler for opening modal for a specific room/rate type
  const handleOpenModalForRate = useCallback(
    (room: Room, rateType: "nonRefundable" | "refundable") => {
      openModal("booking", { room, rateType });
    },
    [openModal]
  );

  // Rooms data for carousel
  const roomsForCarousel = useMemo<Room[]>(() => roomsData.slice(0, 6), []);

  return (
    <Fragment>
      <HomeStructuredData />
      <AboutStructuredData />
      <SiteSearchStructuredData lang={lang} />

      {/* Hero Section */}
      <HeroSection
        lang={lang}
        onPrimaryCtaClick={handleReserve}
      />

      {/* Booking Widget - uses useSearchParams, needs Suspense for static export */}
      <Section padding="narrow" className="relative z-10 -mt-8">
        <Suspense fallback={null}>
          <BookingWidget lang={lang} />
        </Suspense>
      </Section>

      {/* Intro */}
      <Section padding="default">
        <Suspense fallback={null}>
          <IntroTextBox lang={lang} />
        </Suspense>
      </Section>

      {/* Why Stay */}
      <WhyStaySection lang={lang} />

      {/* Rooms Carousel */}
      <Suspense fallback={null}>
        <CarouselSlides
          roomsData={roomsForCarousel}
          openModalForRate={handleOpenModalForRate}
          lang={lang}
        />
      </Suspense>

      {/* Social Proof */}
      <SocialProofSection lang={lang} />

      {/* Quick Links */}
      <QuickLinksSection lang={lang} />

      {/* Location */}
      <LocationMiniBlock lang={lang} />

      {/* FAQ */}
      <FaqStrip lang={lang} />
    </Fragment>
  );
}

export default memo(HomeContent);
