import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("swiper/css", () => "");
jest.mock("swiper/css/navigation", () => "");

jest.mock("@acme/ui/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

jest.mock("../../components/header/DesktopHeader", () => ({
  __esModule: true,
  default: ({ onPrimaryCtaClick }: { onPrimaryCtaClick?: () => void }) => (
    <button type="button" onClick={onPrimaryCtaClick}>
      Desktop CTA
    </button>
  ),
}));

jest.mock("../../components/header/MobileNav", () => ({
  __esModule: true,
  default: ({ onPrimaryCtaClick }: { onPrimaryCtaClick?: () => void }) => (
    <button type="button" onClick={onPrimaryCtaClick}>
      Mobile CTA
    </button>
  ),
}));

jest.mock("../../components/header/MobileMenu", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: (_ns?: string) => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? "Check availability",
    i18n: { language: "en", hasResourceBundle: () => true, getFixedT: () => (k: string) => k },
    ready: true,
  }),
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("@/hooks/useScrollProgress", () => ({
  useScrollProgress: () => ({ scrolled: false, mouseNearTop: true, progress: 0 }),
}));

jest.mock("@/context/ModalContext", () => ({
  useOptionalModal: () => ({
    activeModal: null,
    modalData: null,
    openModal: jest.fn(),
    closeModal: jest.fn(),
  }),
}));

jest.mock("@/hooks/usePagePreload", () => ({
  usePagePreload: () => {},
}));

jest.mock("@/components/seo/HomeStructuredData", () => () => null);
jest.mock("@/components/seo/AboutStructuredData", () => () => null);
jest.mock("@/components/seo/SiteSearchStructuredData", () => () => null);

jest.mock("@/components/landing/IntroTextBox", () => () => null);
jest.mock("@/components/landing/WhyStaySection", () => () => null);
jest.mock("@/components/landing/SocialProofSection", () => () => null);
jest.mock("@/components/landing/LocationMiniBlock", () => () => null);
jest.mock("@/components/landing/FaqStrip", () => () => null);

jest.mock("@acme/ui/organisms/CarouselSlides", () => () => null);
jest.mock("@acme/ui/organisms/DesktopHeader", () => ({
  __esModule: true,
  default: ({ onPrimaryCtaClick }: { onPrimaryCtaClick?: () => void }) => (
    <button type="button" onClick={onPrimaryCtaClick}>
      Desktop CTA
    </button>
  ),
}));
jest.mock("@acme/ui/organisms/LandingHeroSection", () => ({
  __esModule: true,
  default: ({ onPrimaryCtaClick }: { onPrimaryCtaClick?: () => void }) => (
    <button type="button" onClick={onPrimaryCtaClick}>
      Hero CTA
    </button>
  ),
}));
jest.mock("@acme/ui/organisms/QuickLinksSection", () => () => null);

const Header = require("@/components/header/Header").default as typeof import("@/components/header/Header").default;
const HomeContent = require("@/app/[lang]/HomeContent").default as typeof import("@/app/[lang]/HomeContent").default;
const BookingWidget = require("@/components/landing/BookingWidget").default as typeof import("@/components/landing/BookingWidget").default;

describe("GA4 cta_click coverage (GA4-cta-click)", () => {
  let originalGtag: typeof window.gtag;

  beforeEach(() => {
    originalGtag = window.gtag;
    window.gtag = jest.fn();
    window.history.pushState({}, "", "/en?checkin=2026-06-10&checkout=2026-06-12&guests=2");
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires cta_click for desktop header and mobile nav CTAs", () => {
    render(<Header lang="en" />);

    const gtag = window.gtag as unknown as jest.Mock;

    fireEvent.click(screen.getByRole("button", { name: "Mobile CTA" }));
    fireEvent.click(screen.getByRole("button", { name: "Desktop CTA" }));

    const ctaCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "cta_click");
    expect(ctaCalls).toEqual(
      expect.arrayContaining([
        ["event", "cta_click", expect.objectContaining({ cta_id: "header_check_availability", cta_location: "desktop_header" })],
        ["event", "cta_click", expect.objectContaining({ cta_id: "mobile_nav_check_availability", cta_location: "mobile_nav" })],
      ]),
    );
  });

  it("fires cta_click for hero CTA and booking widget submit", () => {
    render(
      <>
        <HomeContent lang="en" />
        <BookingWidget lang="en" />
      </>,
    );

    const gtag = window.gtag as unknown as jest.Mock;

    fireEvent.click(screen.getByRole("button", { name: "Hero CTA" }));

    const bookingSection = document.getElementById("booking");
    expect(bookingSection).toBeTruthy();
    const widgetButton = within(bookingSection as HTMLElement).getByRole("button", {
      name: /check availability/i,
    });
    fireEvent.click(widgetButton);

    const ctaCalls = gtag.mock.calls.filter((args) => args[0] === "event" && args[1] === "cta_click");
    expect(ctaCalls).toEqual(
      expect.arrayContaining([
        ["event", "cta_click", expect.objectContaining({ cta_id: "hero_check_availability", cta_location: "home_hero" })],
        ["event", "cta_click", expect.objectContaining({ cta_id: "booking_widget_check_availability", cta_location: "home_booking_widget" })],
      ]),
    );
  });
});
