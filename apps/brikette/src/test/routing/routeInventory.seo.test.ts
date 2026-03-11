import { describe, expect, it } from "@jest/globals";

import { listLocalizedCanonicalAppUrls, listLocalizedPublicUrls } from "@/routing/routeInventory";

describe("listLocalizedPublicUrls SEO contract", () => {
  it("excludes hostel booking pages that are intentionally noindex", () => {
    const urls = listLocalizedPublicUrls();

    expect(urls).not.toContain("/en/book-dorm-bed");
    expect(urls).not.toContain("/it/prenota");
  });

  it("excludes private-room booking helper routes that redirect to the top-level private booking page", () => {
    const urls = listLocalizedPublicUrls();

    expect(urls).not.toContain("/en/private-rooms/book");
    expect(urls).not.toContain("/it/camere-private/book");
  });

  it("keeps the top-level private booking route indexable", () => {
    const urls = listLocalizedPublicUrls();

    expect(urls).toContain("/en/book-private-accommodations");
    expect(urls).toContain("/it/prenota-alloggi-privati");
    expect(urls).not.toContain("/en/private-rooms");
    expect(urls).not.toContain("/it/camere-private");
  });

  it("uses localized private-room child canonicals instead of English child aliases", () => {
    const urls = listLocalizedPublicUrls();

    expect(urls).toContain("/en/private-rooms/sea-view-apartment");
    expect(urls).toContain("/it/camere-private/appartamento-vista-mare");
    expect(urls).toContain("/it/camere-private/camera-doppia");
    expect(urls).not.toContain("/it/camere-private/apartment");
    expect(urls).not.toContain("/it/camere-private/double-room");
  });
});

describe("listLocalizedCanonicalAppUrls internal-link contract", () => {
  it("keeps transactional localized booking routes as valid canonical link targets", () => {
    const urls = listLocalizedCanonicalAppUrls();

    expect(urls).toContain("/en/book");
    expect(urls).toContain("/it/prenota");
    expect(urls).toContain("/en/book-private-accommodations");
    expect(urls).toContain("/it/prenota-alloggi-privati");
  });

  it("excludes redirect-source aliases that should never be linked internally", () => {
    const urls = listLocalizedCanonicalAppUrls();

    expect(urls).not.toContain("/");
    expect(urls).not.toContain("/it/book");
    expect(urls).not.toContain("/privacy-policy");
    expect(urls).not.toContain("/cookie-policy");
    expect(urls).not.toContain("/en/private-rooms");
    expect(urls).not.toContain("/it/camere-private");
    expect(urls).not.toContain("/en/private-rooms/book");
  });
});
