"use client";

import ShopChooser from "@/components/cms/ShopChooser";

export default function ShopIndexShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Operations · Shop overviews"
      heading="Shop overviews"
      subheading="Jump into analytics, configuration, and automation for each storefront."
      shops={shops}
      card={{
        icon: "🏪",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => `Coordinate configuration, launches, and health checks for ${shop}.`,
        ctaLabel: () => "Open shop overview",
        href: (shop) => `/cms/shop/${shop}`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "shop", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "Create your first shop",
        description:
          "Launch the configurator to set up products, media, and settings for a new storefront.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "shop" },
      }}
    />
  );
}

