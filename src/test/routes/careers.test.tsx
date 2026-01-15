import { screen } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";
import { renderRouteModule } from "@tests/renderers";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import * as loadI18nNs from "@/utils/loadI18nNs";
import careersPageEn from "@/locales/en/careersPage.json";
import * as CareersRoute from "@/routes/careers";

const CAREERS_TITLE = (careersPageEn.meta?.title as string | undefined) ?? "Careers";
const CAREERS_DESCRIPTION =
  (careersPageEn.meta?.description as string | undefined) ?? "Join the team.";

vi.mock("@/components/careers/CareersHero", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <section data-testid="careers-hero">Hero {lang}</section>,
}));

vi.mock("@/components/careers/CareersSection", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => (
    <section data-testid="careers-section">Section {lang}</section>
  ),
}));

vi.mock("@/components/seo/CareersStructuredData", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => <script data-testid="careers-json">{lang}</script>,
}));

vi.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

vi.mock("@/utils/slug", () => ({
  getSlug: (segment: string, lang: string) => `${segment}-${lang}`,
}));

const renderCareers = async (route = "/en/careers-en") => {
  const view = await renderRouteModule(CareersRoute, { route });
  await view.ready();
  await screen.findByTestId("careers-hero");
  return view;
};

describe("careers clientLoader", () => {
  it("preloads namespaces and resolves metadata", async () => {
    const fallbackSpy = vi.spyOn(loadI18nNs, "preloadNamespacesWithFallback");
    const optionalSpy = vi.spyOn(loadI18nNs, "preloadI18nNamespaces");
    const changeSpy = vi.spyOn(i18n, "changeLanguage");

    const data = await CareersRoute.clientLoader?.({
      request: new Request("https://example.com/es/careers"),
    } as Parameters<NonNullable<typeof CareersRoute.clientLoader>>[0]);

    expect(fallbackSpy).toHaveBeenCalledWith("es", ["careersPage"]);
    expect(optionalSpy).toHaveBeenCalledWith("es", ["modals"], { optional: true });
    expect(changeSpy).toHaveBeenCalledWith("es");
    expect(data).toMatchObject({
      lang: "es",
      title: expect.any(String),
      desc: expect.any(String),
    });

    fallbackSpy.mockRestore();
    optionalSpy.mockRestore();
    changeSpy.mockRestore();
  });

  it("mutates i18n state when changeLanguage is unavailable", async () => {
    const originalChangeLanguage = i18n.changeLanguage;
    // @ts-expect-error – simulate legacy runtime that lacks changeLanguage
    delete (i18n as { changeLanguage?: typeof i18n.changeLanguage }).changeLanguage;

    const data = await CareersRoute.clientLoader?.({
      request: new Request("https://example.com/fr/careers"),
    } as Parameters<NonNullable<typeof CareersRoute.clientLoader>>[0]);

    expect(data).toMatchObject({ lang: "fr" });
    expect(i18n.language).toBe("fr");

    i18n.changeLanguage = originalChangeLanguage;
  });
});

describe("careers route", () => {
  it("renders localized sections and head metadata", async () => {
    await renderCareers();

    expect(screen.getByTestId("careers-hero")).toHaveTextContent("Hero en");
    expect(screen.getByTestId("careers-section")).toHaveTextContent("Section en");
    expect(screen.getByTestId("careers-json")).toHaveTextContent("en");

    assertRouteHead({
      title: CAREERS_TITLE,
      description: CAREERS_DESCRIPTION,
      path: "/en/careers-en",
      lang: "en",
    });
  });

  it("falls back gracefully for unsupported locale prefixes", async () => {
    await renderCareers("/xx/careers-en");
    expect(screen.getByTestId("careers-hero")).toHaveTextContent("Hero en");
  });
});