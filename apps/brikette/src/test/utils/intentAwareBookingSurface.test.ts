import { describe, expect, it } from "@jest/globals";

import { resolveIntentAwareBookingSurface } from "@/utils/intentAwareBookingSurface";

describe("resolveIntentAwareBookingSurface", () => {
  it("returns a chooser when no prior intent is known", () => {
    const result = resolveIntentAwareBookingSurface("en", null);

    expect(result.mode).toBe("chooser");
    if (result.mode !== "chooser") {
      throw new Error("expected chooser");
    }

    expect(result.hostel.href).toBe("/en/book");
    expect(result.private.href).toBe("/en/private-rooms");
    expect(result.hostel.decisionMode).toBe("chooser");
    expect(result.private.decisionMode).toBe("chooser");
  });

  it("preserves apartment intent to the apartment booking path", () => {
    const result = resolveIntentAwareBookingSurface("en", {
      source_surface: "private_summary",
      source_cta: "private_summary_cta",
      resolved_intent: "private",
      product_type: "apartment",
      decision_mode: "direct_resolution",
      destination_funnel: "private",
      locale: "en",
      fallback_triggered: false,
    });

    expect(result).toEqual({
      mode: "direct",
      primary: expect.objectContaining({
        href: "/en/book-private-accommodations",
        resolvedIntent: "private",
        productType: "apartment",
      }),
    });
  });

  it("preserves double-room private intent to the double-room booking path", () => {
    const result = resolveIntentAwareBookingSurface("en", {
      source_surface: "private_summary",
      source_cta: "private_summary_cta",
      resolved_intent: "private",
      product_type: "double_private_room",
      decision_mode: "direct_resolution",
      destination_funnel: "private",
      locale: "en",
      fallback_triggered: false,
    });

    expect(result).toEqual({
      mode: "direct",
      primary: expect.objectContaining({
        href: "/en/book-double-room",
        resolvedIntent: "private",
        productType: "double_private_room",
      }),
    });
  });

  it("preserves active hostel intent and carries deal ids on the hostel branch", () => {
    const result = resolveIntentAwareBookingSurface(
      "en",
      {
        source_surface: "home_hero",
        source_cta: "home_hero",
        resolved_intent: "hostel",
        product_type: null,
        decision_mode: "direct_resolution",
        destination_funnel: "hostel_central",
        locale: "en",
        fallback_triggered: false,
      },
      { dealId: "save25" },
    );

    expect(result).toEqual({
      mode: "direct",
      primary: expect.objectContaining({
        href: "/en/book?deal=save25",
        resolvedIntent: "hostel",
        productType: null,
      }),
    });
  });
});
