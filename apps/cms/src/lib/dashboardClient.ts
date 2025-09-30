// apps/cms/src/lib/dashboardClient.ts
// Client-safe dashboard helpers separated from server-only filesystem logic.

import type { Stats } from "./dashboardData";

export type QuickStat = {
  label: string;
  value: string;
  caption: string;
};

const numberFormatter = new Intl.NumberFormat();

export function buildQuickStats({ users, shops, products }: Stats): QuickStat[] {
  return [
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Active users",
      value: numberFormatter.format(users),
      caption:
        users === 0
          ? "Invite teammates to collaborate" // i18n-exempt
          : `${users === 1 ? "person" : "people"} with workspace access`,
    },
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Live shops",
      value: numberFormatter.format(shops),
      caption:
        shops === 0
          ? "Create your first shop to go live" // i18n-exempt
          : `${shops === 1 ? "storefront" : "storefronts"} active`,
    },
    {
      // i18n-exempt: ENG-1234 Pending UX copy handoff to i18n
      label: "Catalog size",
      value: numberFormatter.format(products),
      caption:
        products === 0
          ? "No products imported yet" // i18n-exempt
          : `${products === 1 ? "product" : "products"} across all shops`,
    },
  ];
}

