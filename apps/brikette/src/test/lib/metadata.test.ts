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

    expect(published.alternates?.canonical).toBe("https://hostel-positano.com/en/test");
    expect(unpublished.alternates?.canonical).toBe("https://hostel-positano.com/en/test");
  });
});
