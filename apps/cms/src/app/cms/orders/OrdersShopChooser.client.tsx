"use client";

import ShopChooser from "@acme/cms-ui/ShopChooser";

export default function OrdersShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Orders · Control centers"
      heading="Order control centers"
      subheading="Monitor fulfilment, returns, and risk in context for each storefront."
      shops={shops}
      card={{
        icon: "🚚",
        title: (shop) => shop.toUpperCase(),
        description: (shop) => `Track fulfilment, returns, and alerts tailored to ${shop}.`,
        ctaLabel: () => "View orders",
        href: (shop) => `/cms/orders/${shop}`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "orders", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "Create your first shop",
        description:
          "Create a storefront to begin monitoring rentals, returns, and fulfilment alerts.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "orders" },
      }}
    />
  );
}

