"use client";

import ShopChooser from "@/components/cms/ShopChooser";

export default function ProductsShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Catalog · Product workspaces"
      heading="Catalog workspaces"
      subheading="Manage assortments, pricing, and merchandising flows per storefront."
      shops={shops}
      card={{
        icon: "📦",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => `Plan assortments, pricing, and lifecycle updates for ${shop}.`,
        ctaLabel: () => "Manage products",
        href: (shop) => `/cms/shop/${shop}/products`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "products", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "No shops found.",
        description:
          "Create a storefront to start organising product data, bundles, and pricing tiers.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "products" },
      }}
    />
  );
}

