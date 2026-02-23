import type { MediaItem } from "@acme/types";

import {
  formatLaunchCatalogMediaValidation,
  LAUNCH_REQUIRED_MEDIA_SLOTS,
  validateLaunchCatalogMedia,
  validateLaunchSkuMedia,
} from "@/lib/launchMediaContract";

function imageSlot(role: string): MediaItem {
  return {
    url: `https://cdn.example.com/${role}.jpg`,
    type: "image",
    altText: `${role} image`,
    tags: [`slot:${role}`],
  };
}

describe("launchMediaContract", () => {
  it("passes when all required launch slots are present", () => {
    const result = validateLaunchSkuMedia({
      id: "sku-1",
      slug: "bag-alpha",
      media: LAUNCH_REQUIRED_MEDIA_SLOTS.map((role) => imageSlot(role)),
    });

    expect(result.ok).toBe(true);
    expect(result.missingRequiredSlots).toEqual([]);
    expect(result.typedSlots.map((slot) => slot.role)).toEqual(
      LAUNCH_REQUIRED_MEDIA_SLOTS,
    );
  });

  it("fails with explicit sku + slot message when a required slot is missing", () => {
    const media = LAUNCH_REQUIRED_MEDIA_SLOTS.filter(
      (role) => role !== "on_body",
    ).map((role) => imageSlot(role));

    const result = validateLaunchCatalogMedia([
      {
        id: "sku-2",
        slug: "bag-beta",
        media,
      },
    ]);
    const report = formatLaunchCatalogMediaValidation(result);

    expect(result.ok).toBe(false);
    expect(report).toContain("bag-beta");
    expect(report).toContain("on_body");
    expect(
      result.failingSkus[0]?.errors.some(
        (error) =>
          error.code === "missing_required_slot" && error.role === "on_body",
      ),
    ).toBe(true);
  });

  it("rejects unknown slot roles as schema errors", () => {
    const media: MediaItem[] = [
      imageSlot("hero"),
      imageSlot("detail"),
      imageSlot("on_body"),
      imageSlot("scale"),
      imageSlot("alternate"),
      {
        url: "https://cdn.example.com/unknown.jpg",
        type: "image",
        altText: "unknown role",
        tags: ["slot:unknown-role"],
      },
    ];

    const result = validateLaunchSkuMedia({
      id: "sku-3",
      slug: "bag-gamma",
      media,
    });

    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (error) =>
          error.code === "unknown_slot_role" && error.role === "unknown-role",
      ),
    ).toBe(true);
  });
});
