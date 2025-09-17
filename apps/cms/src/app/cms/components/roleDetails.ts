// apps/cms/src/app/cms/components/roleDetails.ts

import type { Role } from "@cms/auth/roles";

export interface RoleDetail {
  title: string;
  description: string;
}

export const ROLE_DETAILS: Record<Role, RoleDetail> = {
  admin: {
    title: "Administrator",
    description:
      "Full access to storefront operations, analytics, and permission management.",
  },
  viewer: {
    title: "Viewer",
    description:
      "Read-only visibility into dashboards, orders, and merchandising data.",
  },
  ShopAdmin: {
    title: "Shop admin",
    description:
      "Manages storefront settings, orders, sessions, and customer support tasks.",
  },
  CatalogManager: {
    title: "Catalog manager",
    description:
      "Controls product data, pricing, and availability across channels.",
  },
  ThemeEditor: {
    title: "Theme editor",
    description:
      "Updates visual theming, layouts, and content blocks without code deployments.",
  },
  customer: {
    title: "Customer",
    description:
      "Shopper role with purchasing, account management, and order history capabilities.",
  },
} as const;
