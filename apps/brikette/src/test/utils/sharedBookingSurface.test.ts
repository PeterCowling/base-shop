import { describe, expect, it } from "@jest/globals";

import {
  resolveSharedBookingSurface,
  shouldUseIntentAwareSharedBookingSurface,
} from "@/utils/sharedBookingSurface";

describe("sharedBookingSurface", () => {
  it("keeps private room pages on the private booking branch", () => {
    const surface = resolveSharedBookingSurface("en", "/en/private-rooms/sea-view-apartment", null);

    expect(surface).toEqual({
      mode: "direct",
      primary: expect.objectContaining({
        href: "/en/book-private-accommodations",
        resolvedIntent: "private",
        productType: "apartment",
      }),
    });
  });

  it("keeps double-room pages on the double-room booking branch", () => {
    const surface = resolveSharedBookingSurface("en", "/en/private-rooms/double-room", null);

    expect(surface).toEqual({
      mode: "direct",
      primary: expect.objectContaining({
        href: "/en/book-double-room",
        resolvedIntent: "private",
        productType: "double_private_room",
      }),
    });
  });

  it("uses chooser routing on how-to-get-here when no intent is known", () => {
    const surface = resolveSharedBookingSurface("en", "/en/how-to-get-here", null);

    expect(surface.mode).toBe("chooser");
    if (surface.mode !== "chooser") {
      throw new Error("expected chooser");
    }

    expect(surface.hostel.href).toBe("/en/book");
    expect(surface.private.href).toBe("/en/book-private-accommodations");
  });

  it("marks deals/support/private sections as intent-aware shared booking surfaces", () => {
    expect(shouldUseIntentAwareSharedBookingSurface("/en/deals", "en", null)).toBe(true);
    expect(shouldUseIntentAwareSharedBookingSurface("/en/how-to-get-here", "en", null)).toBe(true);
    expect(shouldUseIntentAwareSharedBookingSurface("/en/private-rooms/sea-view-apartment", "en", null)).toBe(true);
    expect(shouldUseIntentAwareSharedBookingSurface("/en/experiences", "en", null)).toBe(false);
  });
});
