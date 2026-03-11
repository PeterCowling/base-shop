import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { getBookPath } from "@/utils/localizedRoutes";

const mockRouterPush = jest.fn();
const mockResolveHeaderPrimaryCtaTarget = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: {
      language: "en",
      hasResourceBundle: () => true,
      getFixedT: () => (k: string) => k,
      getResource: () => undefined,
    },
    ready: true,
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@acme/design-system/atoms", () => ({
  Section: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
}));

jest.mock("@acme/design-system/primitives", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@acme/ui/shared", () => ({
  resolvePrimaryCtaLabel: (_tTokens: unknown, options: { fallback: () => string }) => options.fallback(),
}));

jest.mock("@acme/ui/organisms/CarouselSlides", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/QuickLinksSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@acme/ui/organisms/LandingHeroSection", () => ({
  __esModule: true,
  default: ({ onPrimaryCtaClick }: { onPrimaryCtaClick?: () => void }) => (
    <button type="button" onClick={onPrimaryCtaClick}>
      Hero CTA
    </button>
  ),
}));

jest.mock("@/components/landing/FaqStrip", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/FeaturedGuidesSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/IntroTextBox", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/LocationMiniBlock", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/SocialProofSection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/landing/WhyStaySection", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/seo/AboutStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/seo/HomeStructuredData", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/seo/SiteSearchStructuredData", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/useAvailability", () => ({
  useAvailability: () => ({ rooms: [] }),
}));
jest.mock("@/hooks/usePagePreload", () => ({
  usePagePreload: () => {},
}));
jest.mock("@/utils/primeAppI18nBundles", () => ({
  primeAppI18nBundles: () => {},
}));

jest.mock("../../components/header/DesktopHeader", () => ({
  __esModule: true,
  default: ({
    primaryCtaHref,
    onPrimaryCtaClick,
  }: {
    primaryCtaHref?: string;
    onPrimaryCtaClick?: () => void;
  }) => (
    <a href={primaryCtaHref} onClick={onPrimaryCtaClick}>
      Desktop CTA
    </a>
  ),
}));

jest.mock("../../components/header/MobileNav", () => ({
  __esModule: true,
  default: ({
    primaryCtaHref,
    onPrimaryCtaClick,
  }: {
    primaryCtaHref?: string;
    onPrimaryCtaClick?: () => void;
  }) => (
    <a href={primaryCtaHref} onClick={onPrimaryCtaClick}>
      Mobile CTA
    </a>
  ),
}));

jest.mock("../../components/header/MobileMenu", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/context/NotificationBannerContext", () => ({
  useBannerHeightOrZero: () => 0,
}));

jest.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

jest.mock("@/hooks/useEntryAttribution", () => ({
  useEntryAttribution: () => null,
}));

jest.mock("@/hooks/useScrollProgress", () => ({
  useScrollProgress: () => ({ scrolled: false, mouseNearTop: false, progress: 0 }),
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ theme: "light" }),
}));

jest.mock("@/utils/entryAttribution", () => ({
  writeAttribution: jest.fn(),
}));

jest.mock("@/utils/headerPrimaryCtaTarget", () => ({
  resolveHeaderPrimaryCtaTarget: (...args: unknown[]) => mockResolveHeaderPrimaryCtaTarget(...args),
}));

const Header = require("../../components/header/Header").default as typeof import("../../components/header/Header").default;
const BookingWidget = require("../../components/landing/BookingWidget").default as typeof import("../../components/landing/BookingWidget").default;
const HomeContent = require("../../app/[lang]/HomeContent").default as typeof import("../../app/[lang]/HomeContent").default;

describe("GA4 cta_click coverage (GA4-cta-click)", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveHeaderPrimaryCtaTarget.mockReturnValue({
      href: getBookPath("en"),
    });
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
    window.history.replaceState(null, "", "/en");
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("fires cta_click for rendered desktop header and mobile nav CTAs", () => {
    render(<Header lang="en" />);

    const desktopCta = screen.getByRole("link", { name: "Desktop CTA" });
    const mobileCta = screen.getByRole("link", { name: "Mobile CTA" });

    expect(desktopCta).toHaveAttribute("href", getBookPath("en"));
    expect(mobileCta).toHaveAttribute("href", getBookPath("en"));

    fireEvent.click(desktopCta);
    fireEvent.click(mobileCta);

    const ctaCalls = gtagMock.mock.calls.filter((args) => args[0] === "event" && args[1] === "cta_click");
    expect(ctaCalls).toEqual(
      expect.arrayContaining([
        ["event", "cta_click", expect.objectContaining({ cta_id: "header_check_availability", cta_location: "desktop_header" })],
        ["event", "cta_click", expect.objectContaining({ cta_id: "mobile_nav_check_availability", cta_location: "mobile_nav" })],
      ]),
    );
  });

  it("fires cta_click and navigates when the rendered hero CTA is clicked", () => {
    render(<HomeContent lang="en" />);

    fireEvent.click(screen.getByRole("button", { name: "Hero CTA" }));

    const ctaCall = gtagMock.mock.calls.find(
      (args) =>
        args[0] === "event" &&
        args[1] === "cta_click" &&
        (args[2] as Record<string, unknown>)?.cta_id === "hero_check_availability",
    );

    expect(ctaCall).toBeTruthy();
    expect(mockRouterPush).toHaveBeenCalledWith(`${getBookPath("en")}?pax=1`);
  });

  it("fires cta_click and navigates when the booking widget submit CTA is clicked", () => {
    render(<BookingWidget lang="en" />);

    fireEvent.click(screen.getByRole("button", { name: "Check availability" }));

    const ctaCall = gtagMock.mock.calls.find(
      (args) =>
        args[0] === "event" &&
        args[1] === "cta_click" &&
        (args[2] as Record<string, unknown>)?.cta_id === "booking_widget_check_availability",
    );

    expect(ctaCall).toBeTruthy();
    expect(mockRouterPush).toHaveBeenCalledWith(`${getBookPath("en")}?pax=1`);
  });
});
