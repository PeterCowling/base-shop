"use client";

// src/app/[lang]/HomeContent.tsx
// Client component for home page
import "swiper/css";
import "swiper/css/navigation";

import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";
import CarouselSlides from "@acme/ui/organisms/CarouselSlides";
import HeroSection from "@acme/ui/organisms/LandingHeroSection";
import QuickLinksSection from "@acme/ui/organisms/QuickLinksSection";
import type { RoomCardPrice } from "@acme/ui/types/roomCard";

import BookingWidget from "@/components/landing/BookingWidget";
import FaqStrip from "@/components/landing/FaqStrip";
import FeaturedGuidesSection from "@/components/landing/FeaturedGuidesSection";
import IntroTextBox from "@/components/landing/IntroTextBox";
import LocationMiniBlock from "@/components/landing/LocationMiniBlock";
import SocialProofSection from "@/components/landing/SocialProofSection";
import WhyStaySection from "@/components/landing/WhyStaySection";
import AboutStructuredData from "@/components/seo/AboutStructuredData";
import HomeStructuredData from "@/components/seo/HomeStructuredData";
import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { type Room, roomsData } from "@/data/roomsData";
import { useAvailability } from "@/hooks/useAvailability";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { hydrateBookingSearch, persistBookingSearch } from "@/utils/bookingSearch";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { fireCtaClick, fireViewItemList } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
};

function HomeContent({ lang }: Props) {
  const router = useRouter();
  const [bookingQuery, setBookingQuery] = useState<{ checkIn: string; checkOut: string; pax: string }>({
    checkIn: "",
    checkOut: "",
    pax: "1",
  });
  usePagePreload({
    lang,
    namespaces: ["landingPage", "guides", "testimonials", "faq"],
    optionalNamespaces: ["_tokens", "roomsPage", "ratingsBar", "modals"],
  });

  const buildBookHref = useCallback(() => {
    const params = new URLSearchParams();
    if (bookingQuery.checkIn) params.set("checkin", bookingQuery.checkIn);
    if (bookingQuery.checkOut) params.set("checkout", bookingQuery.checkOut);
    if (bookingQuery.pax) params.set("pax", bookingQuery.pax);
    const queryString = params.toString();
    return `/${lang}/book${queryString ? `?${queryString}` : ""}`;
  }, [bookingQuery.checkIn, bookingQuery.checkOut, bookingQuery.pax, lang]);

  const availabilityCheckin = bookingQuery.checkIn || getTodayIso();
  const availabilityCheckout = bookingQuery.checkOut || getDatePlusTwoDays(availabilityCheckin);
  const availabilityPax = bookingQuery.pax || "1";
  const { rooms: availabilityRooms } = useAvailability({
    checkin: availabilityCheckin,
    checkout: availabilityCheckout,
    pax: availabilityPax,
  });

  const roomPrices = useMemo<Record<string, RoomCardPrice> | undefined>(() => {
    if (!availabilityRooms.length) return undefined;
    const prices: Record<string, RoomCardPrice> = {};
    for (const availabilityRoom of availabilityRooms) {
      const roomMatch = roomsData.find((room) => room.widgetRoomCode === availabilityRoom.octorateRoomId);
      if (!roomMatch) continue;
      if (!availabilityRoom.available) {
        prices[roomMatch.id] = { soldOut: true };
      } else if (availabilityRoom.priceFrom !== null) {
        prices[roomMatch.id] = {
          formatted: `From €${availabilityRoom.priceFrom.toFixed(2)}`,
          soldOut: false,
        };
      }
    }
    return Object.keys(prices).length > 0 ? prices : undefined;
  }, [availabilityRooms]);

  const handleReserve = useCallback(() => {
    fireCtaClick({ ctaId: "hero_check_availability", ctaLocation: "home_hero" });
    router.push(buildBookHref());
  }, [buildBookHref, router]);

  const handleBookingDatesChange = useCallback(
    ({ checkIn, checkOut, guests }: { checkIn: string; checkOut: string; guests: number }) => {
      const pax = String(guests);
      setBookingQuery((previous) => {
        if (previous.checkIn === checkIn && previous.checkOut === checkOut && previous.pax === pax) {
          return previous;
        }
        return { checkIn, checkOut, pax };
      });
    },
    []
  );

  // Handler for opening room rate CTA — navigates to /book (TASK-27 will add direct Octorate link)
  const handleOpenModalForRate = useCallback(
    (_room: Room, _rateType: "nonRefundable" | "refundable") => {
      router.push(buildBookHref());
    },
    [buildBookHref, router]
  );

  // Rooms data for carousel
  const roomsForCarousel = roomsData.slice(0, 6);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hydrated = hydrateBookingSearch(new URLSearchParams(window.location.search));
    if (!hydrated.search) return;
    setBookingQuery({
      checkIn: hydrated.search.checkin,
      checkOut: hydrated.search.checkout,
      pax: String(hydrated.search.pax),
    });
  }, []);

  useEffect(() => {
    if (!bookingQuery.checkIn || !bookingQuery.checkOut) return;
    const timer = window.setTimeout(() => {
      persistBookingSearch({
        checkin: bookingQuery.checkIn,
        checkout: bookingQuery.checkOut,
        pax: parseInt(bookingQuery.pax, 10) || 1,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [bookingQuery.checkIn, bookingQuery.checkOut, bookingQuery.pax]);

  useEffect(() => {
    fireViewItemList({
      itemListId: "home_rooms_carousel",
      rooms: roomsForCarousel,
    });
  }, []);

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
        <BookingWidget
          lang={lang}
          onDatesChange={handleBookingDatesChange}
        />
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
        roomPrices={roomPrices}
        lang={lang}
      />

      {/* Social Proof */}
      <SocialProofSection lang={lang} />

      {/* Quick Links */}
      <QuickLinksSection lang={lang} />

      {/* Featured Guides */}
      <FeaturedGuidesSection lang={lang} />

      {/* Location */}
      <LocationMiniBlock lang={lang} />

      {/* FAQ */}
      <FaqStrip lang={lang} />
    </Fragment>
  );
}

export default memo(HomeContent);
