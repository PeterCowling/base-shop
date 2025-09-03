import { getStructuredData, serializeJsonLd } from "../src/lib/seo";

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

describe("getStructuredData", () => {
  test("builds product schema", () => {
    const data = getStructuredData({
      type: "Product",
      name: "Eco Runner",
      description: "Lightweight shoe",
      url: "/en/product/eco-runner",
      image: "https://example.com/img.jpg",
      brand: "ACME",
      offers: {
        price: 10,
        priceCurrency: "USD",
        availability: "InStock",
        url: "/en/product/eco-runner",
      },
      aggregateRating: { ratingValue: 4.5, reviewCount: 20 },
    });
    expect(data).toMatchObject({
      "@type": "Product",
      brand: { "@type": "Brand", name: "ACME" },
      offers: {
        "@type": "Offer",
        price: 10,
        priceCurrency: "USD",
        availability: "InStock",
        url: "/en/product/eco-runner",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.5,
        reviewCount: 20,
      },
    });
  });

  test("builds product schema with multiple images", () => {
    const data = getStructuredData({
      type: "Product",
      name: "Multi",
      image: ["/img1.jpg", "/img2.jpg"],
    });

    expect(data).toMatchObject({
      "@type": "Product",
      image: ["/img1.jpg", "/img2.jpg"],
    });
  });

  test("builds product schema without optional fields", () => {
    const data = getStructuredData({ type: "Product", name: "Simple" });
    expect(data).toMatchObject({ "@type": "Product", name: "Simple" });
    expect(data).not.toHaveProperty("brand");
    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("aggregateRating");
  });

  test("builds webpage schema", () => {
    const data = getStructuredData({
      type: "WebPage",
      name: "Home",
      description: "Welcome page",
      url: "/en",
    });
    expect(data).toMatchObject({
      "@type": "WebPage",
      name: "Home",
      description: "Welcome page",
      url: "/en",
    });
  });

  test("serializeJsonLd escapes '<'", () => {
    const raw = { text: "<script>" };
    const serialized = serializeJsonLd(raw);
    expect(serialized).toContain("\\u003cscript>");
    expect(serialized).not.toContain("<");
  });
});
