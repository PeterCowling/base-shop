"use client";

import ShopChooser from "@/components/cms/ShopChooser";

export default function ThemesShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Themes · Studios"
      heading="Theme studios"
      subheading="Apply curated experiences, manage theme versions, and schedule releases for each storefront."
      shops={shops}
      card={{
        icon: "🎨",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => `Fine-tune layouts, palettes, and typography for ${shop}.`,
        ctaLabel: () => "Customize theme",
        href: (shop) => `/cms/shop/${shop}/themes`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "themes", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "Create your first shop",
        description:
          "Configure a storefront to unlock theme controls, scheduling, and preview environments.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "themes" },
      }}
    />
  );
}

