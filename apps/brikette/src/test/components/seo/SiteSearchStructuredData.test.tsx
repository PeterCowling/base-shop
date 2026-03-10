import "@testing-library/jest-dom";

import { renderWithProviders } from "@tests/renderers";

import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  const raw = script.innerHTML;
  return JSON.parse(raw) as Record<string, unknown>;
};

describe("SiteSearchStructuredData", () => {
  it("does not emit a SearchAction until a real localized results page exists (English)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="en" />);
    const json = getJsonLd(container);
    expect(json.potentialAction).toBeUndefined();
  });

  it("does not emit a SearchAction until a real localized results page exists (German)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="de" />);
    const json = getJsonLd(container);
    expect(json.potentialAction).toBeUndefined();
  });

  it("does not emit a SearchAction until a real localized results page exists (French)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="fr" />);
    const json = getJsonLd(container);
    expect(json.potentialAction).toBeUndefined();
  });

  it("keeps the same WebSite contract across supported locales", () => {
    const testLocales: AppLanguage[] = ["en", "es", "de", "fr", "it", "ja"];

    testLocales.forEach((lang) => {
      const { container } = renderWithProviders(<SiteSearchStructuredData lang={lang} />);
      const json = getJsonLd(container);
      expect(json.potentialAction).toBeUndefined();
      expect(json.inLanguage).toBe(lang);
    });
  });

  it("includes the required WebSite schema fields", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="en" />);
    const json = getJsonLd(container);

    expect(json["@type"]).toBe("WebSite");
    expect(json["@context"]).toBe("https://schema.org");
    expect(json.url).toBe(BASE_URL);
    expect(json.inLanguage).toBe("en");
    expect(json.potentialAction).toBeUndefined();
  });
});
