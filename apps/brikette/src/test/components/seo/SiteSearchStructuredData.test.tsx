import "@testing-library/jest-dom";

import { renderWithProviders } from "@tests/renderers";

import SiteSearchStructuredData from "@/components/seo/SiteSearchStructuredData";
import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

const getJsonLd = (container: HTMLElement): Record<string, unknown> => {
  const script = container.querySelector('script[type="application/ld+json"]');
  if (!script) {
    throw new Error("Missing JSON-LD script");
  }
  const raw = script.innerHTML;
  return JSON.parse(raw) as Record<string, unknown>;
};

describe("SiteSearchStructuredData", () => {
  it("uses localized slug for assistance page in SearchAction target (English)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="en" />);
    const json = getJsonLd(container);
    const action = json.potentialAction as Record<string, unknown>;

    const expectedSlug = getSlug("assistance", "en");
    const expectedTarget = `${BASE_URL}/en/${expectedSlug}?q={search_term_string}`;

    expect(action.target).toBe(expectedTarget);
  });

  it("uses localized slug for assistance page in SearchAction target (German)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="de" />);
    const json = getJsonLd(container);
    const action = json.potentialAction as Record<string, unknown>;

    const expectedSlug = getSlug("assistance", "de");
    const expectedTarget = `${BASE_URL}/de/${expectedSlug}?q={search_term_string}`;

    expect(action.target).toBe(expectedTarget);
  });

  it("uses localized slug for assistance page in SearchAction target (French)", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="fr" />);
    const json = getJsonLd(container);
    const action = json.potentialAction as Record<string, unknown>;

    const expectedSlug = getSlug("assistance", "fr");
    const expectedTarget = `${BASE_URL}/fr/${expectedSlug}?q={search_term_string}`;

    expect(action.target).toBe(expectedTarget);
  });

  it("uses localized slug for assistance page in SearchAction target (all supported locales)", () => {
    const testLocales: AppLanguage[] = ["en", "es", "de", "fr", "it", "ja"];

    testLocales.forEach((lang) => {
      const { container } = renderWithProviders(<SiteSearchStructuredData lang={lang} />);
      const json = getJsonLd(container);
      const action = json.potentialAction as Record<string, unknown>;

      const expectedSlug = getSlug("assistance", lang);
      const expectedTarget = `${BASE_URL}/${lang}/${expectedSlug}?q={search_term_string}`;

      expect(action.target).toBe(expectedTarget);
    });
  });

  it("includes required SearchAction schema fields", () => {
    const { container } = renderWithProviders(<SiteSearchStructuredData lang="en" />);
    const json = getJsonLd(container);

    expect(json["@type"]).toBe("WebSite");
    expect(json["@context"]).toBe("https://schema.org");
    expect(json.url).toBe(BASE_URL);

    const action = json.potentialAction as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    expect(action["query-input"]).toBe("required name=search_term_string");
    expect(action.target).toBeDefined();
  });
});
