import { act, screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { renderRouteModule } from "@tests/renderers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import landingPageEn from "@/locales/en/landingPage.json";
import * as loadI18nNs from "@/utils/loadI18nNs";
import * as HomeRoute from "@/routes/home";

const heroLinksState = vi.hoisted(() => ({ current: [] as unknown }));
const isDesktopState = vi.hoisted(() => ({ current: false }));
const openModalMock = vi.hoisted(() => vi.fn());
const guideSlugMock = vi.hoisted(() => vi.fn((lang: string, key: string) => `${lang}-${key}`));
const getSlugMock = vi.hoisted(() => vi.fn((segment: string, lang: string) => `${segment}-${lang}`));
const room = vi.hoisted(() => ({ value: { id: "room-1", title: "Seaview suite" } }));

vi.mock("@/context/ModalContext", () => ({
  __esModule: true,
  useModal: () => ({ openModal: openModalMock }),
  useOptionalModal: () => ({ openModal: openModalMock }),
  ModalProvider: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@acme/ui/organisms/LandingHeroSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="hero">Hero {lang}</div>,
  links: () =>
    typeof heroLinksState.current === "function"
      ? (heroLinksState.current as () => unknown)()
      : heroLinksState.current,
}));

vi.mock("@acme/ui/organisms/QuickLinksSection", () => ({
  __esModule: true,
  default: ({
    onLocationClick,
    onFacilitiesClick,
  }: {
    onLocationClick: () => void;
    onFacilitiesClick: () => void;
  }) => (
    <div data-testid="quick-links">
      <button type="button" onClick={onLocationClick}>
        Open location modal
      </button>
      <button type="button" onClick={onFacilitiesClick}>
        Open facilities modal
      </button>
    </div>
  ),
}));

vi.mock("@/routes/home.module-specifiers", () => ({
  __esModule: true,
  loadIntroTextBox: () =>
    Promise.resolve({
      __esModule: true,
      default: ({ lang }: { lang: string }) => <div data-testid="intro">Intro {lang}</div>,
    }),
  loadCarouselSlides: () =>
    Promise.resolve({
      __esModule: true,
      default: ({
        openModalForRate,
        lang,
      }: {
        openModalForRate: (room: typeof room.value, rateType: string) => void;
        lang: string;
      }) => (
        <button type="button" onClick={() => openModalForRate(room.value, "standard")}>
          Open rate modal ({lang})
        </button>
      ),
    }),
  loadDestinationSlideshow: () =>
    Promise.resolve({
      __esModule: true,
      default: ({ lang }: { lang: string }) => <div data-testid="destination">Destination {lang}</div>,
    }),
}));

vi.mock("@acme/ui/atoms/Section", () => ({
  __esModule: true,
  Section: ({ children, ...props }: { children?: React.ReactNode }) => (
    <section data-testid="section" {...props}>
      {children}
    </section>
  ),
}));

vi.mock("@acme/ui/atoms/RatingsBar", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="ratings">Ratings {lang}</div>,
}));

vi.mock("@acme/ui/organisms/StickyBookNow", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="sticky-cta">Sticky {lang}</div>,
}));

vi.mock("@/components/seo/HomeStructuredData", () => ({
  __esModule: true,
  default: () => <div data-testid="home-json" />,
}));

vi.mock("@/components/seo/AboutStructuredData", () => ({
  __esModule: true,
  default: () => <div data-testid="about-json" />,
}));

vi.mock("@/components/seo/SiteSearchStructuredData", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="search-json">{lang}</div>,
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => isDesktopState.current,
}));

vi.mock("@/data/roomsData", () => ({
  roomsData: [room.value],
}));

vi.mock("@/routes.guides-helpers", () => ({
  guideSlug: (lang: string, key: string) => guideSlugMock(lang, key),
}));

vi.mock("@/utils/slug", () => ({
  getSlug: (segment: string, lang: string) => getSlugMock(segment, lang),
}));

vi.mock("@/config", () => ({
  DOMAIN: "https://fallback.example",
}));

const renderHome = async (route = "/en") => {
  let view: Awaited<ReturnType<typeof renderRouteModule>> | undefined;
  await act(async () => {
    view = await renderRouteModule(HomeRoute, { route });
    await view.ready();
  });
  if (!view) throw new Error("renderHome failed to resolve view");
  await screen.findByTestId("hero");
  await screen.findByTestId("intro");
  await screen.findByTestId("destination");
  return view;
};

const HOME_TITLE = (landingPageEn.meta?.title as string | undefined) ?? "";
const HOME_DESCRIPTION = (landingPageEn.meta?.description as string | undefined) ?? "";

beforeEach(() => {
  heroLinksState.current = [];
  isDesktopState.current = false;
  openModalMock.mockClear();
  guideSlugMock.mockClear();
  getSlugMock.mockClear();
});

describe("home clientLoader", () => {
  it("preloads namespaces and resolves metadata", async () => {
    const fallbackSpy = vi.spyOn(loadI18nNs, "preloadNamespacesWithFallback");
    const optionalSpy = vi.spyOn(loadI18nNs, "preloadI18nNamespaces");
    const changeSpy = vi.spyOn(i18n, "changeLanguage");

    const data = await HomeRoute.clientLoader?.({
      request: new Request("https://example.com/it"),
    } as Parameters<NonNullable<typeof HomeRoute.clientLoader>>[0]);

    expect(fallbackSpy).toHaveBeenCalledWith("it", ["landingPage"]);
    expect(optionalSpy).toHaveBeenCalledWith(
      "it",
      ["roomsPage", "ratingsBar", "modals", "guides"],
      { optional: true },
    );
    expect(changeSpy).toHaveBeenCalledWith("it");
    expect(data).toMatchObject({
      lang: "it",
      title: expect.any(String),
      desc: expect.any(String),
    });

    fallbackSpy.mockRestore();
    optionalSpy.mockRestore();
    changeSpy.mockRestore();
  });
});

describe("home route", () => {
  it("renders guide links and opens the booking modal", async () => {
    const view = await renderHome();

    expect(screen.getByTestId("hero")).toHaveTextContent("Hero en");

    const rateButton = await screen.findByRole("button", { name: /open rate modal/i });
    await view.user.click(rateButton);
    expect(openModalMock).toHaveBeenCalledWith(
      "booking",
      expect.objectContaining({ room: room.value, rateType: "standard" }),
    );

    const guideLinks = screen
      .getAllByRole("link")
      .filter((link) => (link.getAttribute("href") ?? "").startsWith("/en/guides-en/"));
    expect(guideLinks.length).toBeGreaterThanOrEqual(4);
    expect(guideSlugMock).toHaveBeenCalledWith("en", "onlyHostel");

    assertRouteHead({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: "/en",
      lang: "en",
    });
  });

  it("falls back to the configured domain when window origin is unavailable", async () => {
    const originalLocation = window.location;
    const stubLocation = {
      assign: originalLocation.assign,
      reload: originalLocation.reload,
      replace: originalLocation.replace,
      ancestorOrigins: originalLocation.ancestorOrigins,
      hash: originalLocation.hash,
      host: originalLocation.host,
      hostname: originalLocation.hostname,
      href: originalLocation.href,
      origin: undefined,
      pathname: originalLocation.pathname,
      port: originalLocation.port,
      protocol: originalLocation.protocol,
      search: originalLocation.search,
    } as unknown as Location;

    Object.defineProperty(window, "location", {
      configurable: true,
      value: stubLocation,
    });

    try {
      await renderHome();
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical?.getAttribute("href")).toBe("https://fallback.example/en");
      expect(screen.queryByTestId("sticky-cta")).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it("renders the sticky booking CTA on desktop", async () => {
    isDesktopState.current = true;

    await renderHome();

    expect(screen.getByTestId("sticky-cta")).toHaveTextContent("Sticky en");
  });
});

describe("home links export", () => {
  it("merges hero descriptors when provided as an array", () => {
    heroLinksState.current = [{ rel: "preload", as: "image" }];

    const descriptors = HomeRoute.links?.() ?? [];

    expect(descriptors[0]).toEqual({ rel: "preload", as: "image" });
    expect(
      descriptors.some(
        (descriptor) =>
          typeof descriptor === "object" &&
          descriptor !== null &&
          "href" in descriptor &&
          typeof (descriptor as { href?: string }).href === "string" &&
          (descriptor as { href?: string }).href?.includes("landing"),
      ),
    ).toBe(true);
  });

  it("invokes hero links when provided as a function", () => {
    const baseLinks = [{ rel: "stylesheet", href: "/hero.css" }];
    heroLinksState.current = () => baseLinks;

    const descriptors = HomeRoute.links?.() ?? [];

    expect(descriptors[0]).toEqual(baseLinks[0]);
  });
});