import type { SKU } from "@acme/types";

import {
  buildLaunchFamilyAnchors,
  filterSkusByLaunchFamily,
} from "./launchMerchandising";

function makeSku(args: {
  id: string;
  slug: string;
  title: string;
  familyTag?: "top-handle" | "shoulder" | "mini";
}): SKU {
  const media = [
    {
      url: "/images/hbag/silver-hero.jpeg",
      type: "image" as const,
      altText: `${args.title} hero`,
      ...(args.familyTag ? { tags: [`family:${args.familyTag}`] } : {}),
    },
  ];

  return {
    id: args.id,
    slug: args.slug,
    title: args.title,
    price: 9900,
    deposit: 0,
    stock: 5,
    forSale: true,
    forRental: false,
    media: media as SKU["media"],
    sizes: [],
    description: `${args.title} description`,
  };
}

describe("launchMerchandising family routing", () => {
  test("prefers media family tags for filtering", () => {
    const skus = [
      makeSku({
        id: "sku-1",
        slug: "unstyled-slug-one",
        title: "Mini One",
        familyTag: "mini",
      }),
      makeSku({
        id: "sku-2",
        slug: "unstyled-slug-two",
        title: "Top One",
        familyTag: "top-handle",
      }),
    ];

    const miniSkus = filterSkusByLaunchFamily(skus, "mini");
    const topHandleSkus = filterSkusByLaunchFamily(skus, "top-handle");

    expect(miniSkus).toHaveLength(1);
    expect(miniSkus[0]?.slug).toBe("unstyled-slug-one");
    expect(topHandleSkus).toHaveLength(1);
    expect(topHandleSkus[0]?.slug).toBe("unstyled-slug-two");
  });

  test("falls back to slug classification when media tags are missing", () => {
    const skus = [
      makeSku({
        id: "sku-3",
        slug: "mini-facade-example",
        title: "Mini Fallback",
      }),
    ];

    const miniSkus = filterSkusByLaunchFamily(skus, "mini");
    expect(miniSkus).toHaveLength(1);
    expect(miniSkus[0]?.slug).toBe("mini-facade-example");
  });

  test("applies copy overrides in family anchors", () => {
    const skus = [
      makeSku({
        id: "sku-4",
        slug: "mini-facade-anchor",
        title: "Mini Anchor",
        familyTag: "mini",
      }),
    ];

    const anchors = buildLaunchFamilyAnchors(skus, "en", {
      mini: {
        label: "Mini Launch",
        description: "Structured mini charms for launch.",
      },
    });

    const miniAnchor = anchors.find((anchor) => anchor.key === "mini");
    expect(miniAnchor?.label).toBe("Mini Launch");
    expect(miniAnchor?.description).toBe("Structured mini charms for launch.");
    expect(miniAnchor?.productCount).toBe(1);
  });
});
