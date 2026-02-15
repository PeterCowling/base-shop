"use client";

// src/app/[lang]/HomeContent.tsx
// Client component for home page
import "swiper/css";
import "swiper/css/navigation";

import { Fragment, memo, useCallback } from "react";

import { Section } from "@acme/design-system/atoms";
import CarouselSlides from "@acme/ui/organisms/CarouselSlides";
import HeroSection from "@acme/ui/organisms/LandingHeroSection";
import QuickLinksSection from "@acme/ui/organisms/QuickLinksSection";

import BookingWidget from "@/components/landing/BookingWidget";
import FaqStrip from "@/components/landing/FaqStrip";
import IntroTextBox from "@/components/landing/IntroTextBox";
import LocationMiniBlock from "@/components/landing/LocationMiniBlock";
import SocialProofSection from "@/components/landing/SocialProofSection";
import WhyStaySection from "@/components/landing/WhyStaySection";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { useOptionalModal } from "@/context/ModalContext";
import { type Room,roomsData } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { fireCtaClick } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
};

function HomeContent({ lang }: Props) {
  const { openModal } = useOptionalModal();
  usePagePreload({
    lang,
    namespaces: ["landingPage", "guides", "testimonials", "faq"],
    optionalNamespaces: ["_tokens", "roomsPage", "ratingsBar", "modals"],
  });

  const handleReserve = useCallback(() => {
    fireCtaClick({ ctaId: "hero_check_availability", ctaLocation: "home_hero" });
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
  const roomsForCarousel = roomsData.slice(0, 6);

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

      {/* Booking Widget */}
      <Section padding="narrow">
        <BookingWidget lang={lang} />
      </Section>

      {/* Intro */}
      <Section padding="default">
        <IntroTextBox lang={lang} />
      </Section>

      {/* Why Stay */}
      <WhyStaySection lang={lang} />

      {/* Rooms Carousel */}
      <CarouselSlides
        roomsData={roomsForCarousel}
        openModalForRate={handleOpenModalForRate}
        lang={lang}
      />

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
