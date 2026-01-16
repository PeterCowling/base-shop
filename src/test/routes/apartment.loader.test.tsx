import { screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { renderRouteModule } from "@tests/renderers";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import * as loadI18nNs from "@/utils/loadI18nNs";
import apartmentPageEn from "@/locales/en/apartmentPage.json";
import * as ApartmentRoute from "@/routes/apartment";

vi.mock("@acme/ui/organisms/ApartmentHeroSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="apartment-hero">Hero {lang}</div>,
}));

vi.mock("@acme/ui/organisms/ApartmentHighlightsSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="apartment-highlights">Highlights {lang}</div>,
}));

vi.mock("@acme/ui/organisms/ApartmentAmenitiesSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="apartment-amenities">Amenities {lang}</div>,
}));

vi.mock("@acme/ui/organisms/ApartmentDetailsSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="apartment-details">Details {lang}</div>,
}));

vi.mock("@/components/apartment/GallerySection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <div data-testid="apartment-gallery">Gallery {lang}</div>,
}));

vi.mock("@acme/ui/atoms/Section", () => ({
  __esModule: true,
  Section: ({ children }: { children?: React.ReactNode }) => <section>{children}</section>,
}));

vi.mock("@/components/seo/ApartmentStructuredData", () => ({
  __esModule: true,
  default: () => <script data-testid="apartment-json" />,
}));

vi.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

const renderApartment = async (route = "/en/apartment") => {
  const view = await renderRouteModule(ApartmentRoute, { route });
  await view.ready();
  await screen.findByTestId("apartment-hero");
  return view;
};

describe("apartment clientLoader", () => {
  it("preloads namespaces and resolves metadata", async () => {
    const preloadSpy = vi.spyOn(loadI18nNs, "preloadNamespacesWithFallback");
    const changeSpy = vi.spyOn(i18n, "changeLanguage");

    const data = await ApartmentRoute.clientLoader({
      request: new Request("https://example.com/it/apartment"),
    } as Parameters<NonNullable<typeof ApartmentRoute.clientLoader>>[0]);

    expect(preloadSpy).toHaveBeenCalledWith("it", ["apartmentPage"]);
    expect(changeSpy).toHaveBeenCalledWith("it");
    expect(data).toMatchObject({
      lang: "it",
      title: expect.any(String),
      desc: expect.any(String),
    });

    preloadSpy.mockRestore();
    changeSpy.mockRestore();
  });
});

describe("apartment route", () => {
  it("renders localized sections and structured data", async () => {
    await renderApartment();

    expect(screen.getByTestId("apartment-hero")).toHaveTextContent("Hero en");
    expect(screen.getByTestId("apartment-highlights")).toHaveTextContent("Highlights en");
    expect(screen.getByTestId("apartment-gallery")).toHaveTextContent("Gallery en");
    expect(screen.getByTestId("apartment-amenities")).toHaveTextContent("Amenities en");
    expect(screen.getByTestId("apartment-json")).toBeInTheDocument();

    assertRouteHead({
      title: (apartmentPageEn.meta?.title as string | undefined) ?? "",
      description: (apartmentPageEn.meta?.description as string | undefined) ?? "",
      path: "/en/apartment",
      lang: "en",
    });
  });
});