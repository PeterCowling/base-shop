/**
 * Tests for @acme/seo/jsonld — structured data builders (SEO-04)
 *
 * TC-01: serializeJsonLdValue XSS safety
 * TC-03: organizationJsonLd
 * TC-04: productJsonLd
 * TC-05: articleJsonLd
 * TC-06: faqJsonLd
 * TC-07: breadcrumbJsonLd
 */

import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  serializeJsonLdValue,
  websiteSearchJsonLd,
} from "../jsonld";

describe("serializeJsonLdValue (TC-01)", () => {
  it("escapes < and > to prevent XSS", () => {
    const result = serializeJsonLdValue({
      name: '<script>alert("xss")</script>',
    });
    expect(result).not.toContain("<script>");
    expect(result).toContain("\\u003c");
    expect(result).toContain("\\u003e");
  });

  it("handles nested objects", () => {
    const result = serializeJsonLdValue({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Test",
    });
    const parsed = JSON.parse(result.replace(/\\u003c/g, "<").replace(/\\u003e/g, ">"));
    expect(parsed["@type"]).toBe("Organization");
  });

  it("handles null input", () => {
    const result = serializeJsonLdValue(null);
    expect(result).toBe("null");
  });

  it("handles string input", () => {
    const result = serializeJsonLdValue("plain string");
    expect(result).toBe('"plain string"');
  });
});

describe("organizationJsonLd (TC-03)", () => {
  it("produces valid Organization schema", () => {
    const result = organizationJsonLd({
      name: "Test Corp",
      url: "https://test.com",
      logo: "https://test.com/logo.png",
    });
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("Test Corp");
    expect(result.url).toBe("https://test.com");
    expect(result.logo).toBe("https://test.com/logo.png");
  });

  it("omits optional fields when not provided", () => {
    const result = organizationJsonLd({ name: "Test Corp" });
    expect(result.url).toBeUndefined();
    expect(result.logo).toBeUndefined();
  });
});

describe("productJsonLd (TC-04)", () => {
  it("produces valid Product schema with offers", () => {
    const result = productJsonLd({
      name: "Widget",
      price: 2999,
      priceCurrency: "EUR",
      sku: "WDG-001",
    });
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Product");
    expect(result.name).toBe("Widget");
    expect(result.offers).toBeDefined();
    const offers = result.offers as Record<string, unknown>;
    expect(offers["@type"]).toBe("Offer");
    expect(offers.price).toBe("29.99");
    expect(offers.priceCurrency).toBe("EUR");
  });

  it("includes availability when provided", () => {
    const result = productJsonLd({
      name: "Widget",
      price: 1000,
      priceCurrency: "EUR",
      availability: "InStock",
    });
    const offers = result.offers as Record<string, unknown>;
    expect(offers.availability).toBe("https://schema.org/InStock");
  });

  it("omits offers when price is missing", () => {
    const result = productJsonLd({ name: "Widget" });
    expect(result.offers).toBeUndefined();
  });
});

describe("articleJsonLd (TC-05)", () => {
  it("produces valid Article schema", () => {
    const result = articleJsonLd({
      headline: "Test Article",
      datePublished: "2026-01-01",
      author: "John Doe",
    });
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Article");
    expect(result.headline).toBe("Test Article");
    expect(result.datePublished).toBe("2026-01-01");
    expect(result.author).toEqual({ "@type": "Person", name: "John Doe" });
  });

  it("omits optional fields when not provided", () => {
    const result = articleJsonLd({ headline: "Test" });
    expect(result.datePublished).toBeUndefined();
    expect(result.author).toBeUndefined();
  });
});

describe("faqJsonLd (TC-06)", () => {
  it("produces valid FAQPage schema", () => {
    const result = faqJsonLd([
      { question: "What is this?", answer: "A test" },
      { question: "How does it work?", answer: "Like magic" },
    ]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("FAQPage");
    const entities = result.mainEntity as Array<Record<string, unknown>>;
    expect(entities).toHaveLength(2);
    expect(entities[0]["@type"]).toBe("Question");
    expect(entities[0].name).toBe("What is this?");
    const answer = entities[0].acceptedAnswer as Record<string, unknown>;
    expect(answer["@type"]).toBe("Answer");
    expect(answer.text).toBe("A test");
  });

  it("returns null for empty entries", () => {
    const result = faqJsonLd([]);
    expect(result).toBeNull();
  });
});

describe("breadcrumbJsonLd (TC-07)", () => {
  it("produces valid BreadcrumbList schema", () => {
    const result = breadcrumbJsonLd([
      { name: "Home", url: "https://example.com/" },
      { name: "Rooms", url: "https://example.com/rooms/" },
    ]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    const items = result.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe("Home");
    expect(items[1].position).toBe(2);
    expect(items[1].name).toBe("Rooms");
  });

  it("returns null for empty items", () => {
    const result = breadcrumbJsonLd([]);
    expect(result).toBeNull();
  });
});

describe("websiteSearchJsonLd", () => {
  it("produces valid WebSite+SearchAction schema", () => {
    const result = websiteSearchJsonLd({
      name: "Test Site",
      url: "https://test.com",
      searchUrlTemplate: "https://test.com/search?q={search_term_string}",
    });
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("WebSite");
    expect(result.name).toBe("Test Site");
    const action = result.potentialAction as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    expect(action.target).toBe("https://test.com/search?q={search_term_string}");
  });
});
