import { getStructuredData, serializeJsonLd } from "../src/lib/seo";

describe("getStructuredData", () => {
  test("builds product schema", () => {
    const data = getStructuredData({
      type: "Product",
      name: "Eco Runner",
      description: "Lightweight shoe",
      url: "/en/product/eco-runner",
      image: "https://example.com/img.jpg",
      brand: "ACME",
      offers: { price: 10, priceCurrency: "USD" },
      aggregateRating: { ratingValue: 4.5, reviewCount: 20 },
    });
    expect(data).toMatchObject({
      "@type": "Product",
      brand: { "@type": "Brand", name: "ACME" },
      offers: {
        "@type": "Offer",
        price: 10,
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.5,
        reviewCount: 20,
      },
    });
  });

  test("builds webpage schema", () => {
    const data = getStructuredData({
      type: "WebPage",
      name: "Home",
      url: "/en",
    });
    expect(data).toMatchObject({
      "@type": "WebPage",
      name: "Home",
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
