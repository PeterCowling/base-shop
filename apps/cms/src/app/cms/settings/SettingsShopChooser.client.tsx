"use client";

import ShopChooser from "@/components/cms/ShopChooser";

export default function SettingsShopChooser({ shops }: { shops: string[] }) {
  return (
    <ShopChooser
      tag="Settings · Configuration hubs"
      heading="Configuration hubs"
      subheading="Update policies, integrations, and access controls tailored to each storefront."
      shops={shops}
      card={{
        icon: "⚙️",
        title: (shop) => shop.toUpperCase(),
        description: (shop) =>
          `Keep ${shop}'s operations, policies, and integrations aligned.`,
        ctaLabel: () => "Open settings",
        href: (shop) => `/cms/shop/${shop}/settings`,
        analyticsEventName: "shopchooser:navigate",
        analyticsPayload: (shop) => ({ area: "settings", shop }),
      }}
      emptyState={{
        tagLabel: "No shops yet",
        title: "Create your first shop",
        description:
          "Create a storefront to configure payments, policies, and integrations for your teams.",
        ctaLabel: "Create shop",
        ctaHref: "/cms/configurator",
        analyticsEventName: "shopchooser:create",
        analyticsPayload: { area: "settings" },
      }}
    />
  );
}

