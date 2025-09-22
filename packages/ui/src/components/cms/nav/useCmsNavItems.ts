// packages/ui/src/components/cms/nav/useCmsNavItems.ts
"use client";

import { getShopFromPath } from "@acme/shared-utils";
import { features } from "@acme/platform-core/features";
import { useMemo } from "react";

export interface CmsNavItem {
  href: string; // base href without /cms prefix
  label: string;
  icon: string;
  title?: string;
  fullHref: string; // prefixed with /cms
  active: boolean;
  isConfigurator?: boolean;
}

export function useCmsNavItems({
  pathname = "",
  role,
}: {
  pathname?: string;
  role?: string;
}): CmsNavItem[] {
  return useMemo(() => {
    const shop = getShopFromPath(pathname);
    const base = shop ? `/shop/${shop}` : "";
    const dashboardBase = shop ? `/cms/shop/${shop}` : "/cms";

    const links: Array<{
      href: string;
      label: string;
      icon: string;
      title?: string;
      isConfigurator?: boolean;
    }> = [
      { href: base, label: "Dashboard", icon: "📊" },
      ...(shop ? [] : [{ href: "/shop", label: "Shops", icon: "🏬" }]),
      { href: shop ? `${base}/products` : "/products", label: "Products", icon: "📦" },
      ...(shop ? [{ href: `${base}/products/new`, label: "New Product", icon: "➕" }] : []),
      { href: shop ? `${base}/pages` : "/pages", label: "Pages", icon: "📄" },
      ...(shop ? [{ href: `${base}/pages/new/builder`, label: "Create new page", icon: "📝" }] : []),
      { href: shop ? `${base}/media` : "/media", label: "Media", icon: "🖼️" },
      ...(shop ? [{ href: `${base}/edit-preview`, label: "Edit Preview", icon: "🧪" }] : []),
      ...(shop && role && ["admin", "ShopAdmin", "ThemeEditor"].includes(role)
        ? [{ href: `${base}/themes`, label: "Themes", icon: "🎨" }]
        : []),
      { href: shop ? `${base}/settings` : "/settings", label: "Settings", icon: "⚙️" },
      ...(shop
        ? [
            { href: `${base}/settings/seo`, label: "SEO", icon: "🔍" },
            { href: `${base}/settings/deposits`, label: "Deposits", icon: "💰" },
          ]
        : []),
      ...(features.raTicketing ? [{ href: "/ra", label: "RA", icon: "↩️" }] : []),
      { href: "/live", label: "Live", icon: "🌐" },
      ...(role === "admin"
        ? [
            { href: "/rbac", label: "RBAC", icon: "🛡️", title: "Manage user roles" },
            {
              href: "/account-requests",
              label: "Account Requests",
              icon: "📥",
              title: "Approve new users",
            },
            {
              href: "/configurator",
              label: "New Shop (Configurator)",
              icon: "🛠️",
              title: "Launch configurator to create a new shop",
              isConfigurator: true,
            },
          ]
        : []),
    ];

    return links.map((link) => {
      const fullHref = `/cms${link.href}`;
      const isDashboardLink = link.label === "Dashboard";
      const isShopIndexLink = link.label === "Shops";
      const active = isDashboardLink
        ? pathname === dashboardBase
        : isShopIndexLink
          ? pathname === fullHref
          : pathname.startsWith(fullHref);
      return { ...link, fullHref, active } as CmsNavItem;
    });
  }, [pathname, role]);
}
