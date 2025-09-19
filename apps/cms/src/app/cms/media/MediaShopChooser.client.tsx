"use client";

import ShopChooser from "@/components/cms/ShopChooser";

export default function MediaShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Media · Libraries"
      heading="Media libraries"
      subheading="Review uploads, tag assets, and maintain brand consistency for every storefront."
      shops={shops}
      card={{
        icon: "🎞️",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => `Organise imagery, video, and rich media powering ${shop}.`,
        ctaLabel: () => "Open media library",
        href: (shop) => `/cms/shop/${shop}/media`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "media", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "Create your first shop",
        description:
          "Set up a storefront to begin curating media collections and asset rights.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "media" },
      }}
    />
  );
}

