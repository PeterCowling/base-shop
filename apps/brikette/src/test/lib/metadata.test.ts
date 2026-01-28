import { buildAppMetadata } from "@/app/_lib/metadata";

describe("buildAppMetadata", () => {
  it("sets robots noindex when isPublished is false", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Draft Page",
      description: "Internal draft page",
      path: "/en/draft",
      isPublished: false,
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("does not set robots when isPublished is true (default)", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Public Page",
      description: "Public page",
      path: "/en/public",
    });

    // When isPublished is true (default), robots should not be set (allows indexing)
    expect(metadata.robots).toBeUndefined();
  });

  it("does not set robots when isPublished is explicitly true", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Public Page",
      description: "Public page",
      path: "/en/public",
      isPublished: true,
    });

    expect(metadata.robots).toBeUndefined();
  });

  it("sets canonical URL correctly regardless of isPublished", () => {
    const published = buildAppMetadata({
      lang: "en",
      title: "Page",
      description: "Desc",
      path: "/en/test",
      isPublished: true,
    });

    const unpublished = buildAppMetadata({
      lang: "en",
      title: "Page",
      description: "Desc",
      path: "/en/test",
      isPublished: false,
    });

    expect(published.alternates?.canonical).toBe("https://hostel-positano.com/en/test/");
    expect(unpublished.alternates?.canonical).toBe("https://hostel-positano.com/en/test/");
  });

  it("generates localized hreflang alternates for rooms page", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Rooms",
      description: "Our rooms",
      path: "/en/rooms",
    });

    // Verify localized slugs (not naive string replacement)
    expect(metadata.alternates?.languages?.de).toBe("https://hostel-positano.com/de/zimmer/");
    expect(metadata.alternates?.languages?.fr).toBe("https://hostel-positano.com/fr/chambres/");
    expect(metadata.alternates?.languages?.it).toBe("https://hostel-positano.com/it/camere/");
    expect(metadata.alternates?.languages?.es).toBe("https://hostel-positano.com/es/habitaciones/");
  });

  it("generates localized hreflang alternates for deals page", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Deals",
      description: "Special offers",
      path: "/en/deals",
    });

    expect(metadata.alternates?.languages?.de).toBe("https://hostel-positano.com/de/angebote/");
    expect(metadata.alternates?.languages?.fr).toBe("https://hostel-positano.com/fr/offres/");
    expect(metadata.alternates?.languages?.it).toBe("https://hostel-positano.com/it/offerte/");
  });

  it("includes x-default alternate", () => {
    const metadata = buildAppMetadata({
      lang: "en",
      title: "About",
      description: "About us",
      path: "/en/about",
    });

    expect(metadata.alternates?.languages?.["x-default"]).toBeDefined();
    expect(metadata.alternates?.languages?.["x-default"]).toContain("https://hostel-positano.com/");
  });

  it("handles assistance guide hreflang alternates", () => {
    // Note: "assistance" key maps to "help" slug in English
    const metadata = buildAppMetadata({
      lang: "en",
      title: "Arriving by Ferry",
      description: "Ferry guide",
      path: "/en/help/arriving-by-ferry",
    });

    // Verify assistance slug is translated (help → aide/assistenza)
    expect(metadata.alternates?.languages?.fr).toContain("/fr/aide/");
    expect(metadata.alternates?.languages?.it).toContain("/it/assistenza/");

    // Verify guide slug is also translated
    expect(metadata.alternates?.languages?.fr).toContain("/arriver-en-ferry/");
    expect(metadata.alternates?.languages?.it).toContain("/arrivo-in-traghetto/");
  });
});
