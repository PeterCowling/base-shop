// packages/ui/src/components/cms/nav/useCmsNavItems.tsx
"use client";

import { getShopFromPath } from "@acme/shared-utils";
import { features } from "@acme/platform-core/features";
import { useMemo } from "react";
import {
  BoxIcon,
  EnvelopeClosedIcon,
  GearIcon,
  ImageIcon,
  LayersIcon,
  MagnifyingGlassIcon,
  MixIcon,
  PlusIcon,
  ReaderIcon,
  ResetIcon,
  RocketIcon,
  TokensIcon,
  UpdateIcon,
  PersonIcon,
} from "@radix-ui/react-icons";

export interface CmsNavItem {
  href: string; // base href without /cms prefix
  label: string;
  icon: React.ReactNode;
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

    const iconCls = "h-4 w-4";
    const links: Array<{
      href: string;
      label: string;
      icon: React.ReactNode;
      title?: string;
      isConfigurator?: boolean;
    }> = [
      // Dashboard
      { href: shop ? `${base}` : "", label: "Dashboard", icon: <LayersIcon className={iconCls} /> },
      ...(shop ? [] : [{ href: "/shop", label: "Shops", icon: <LayersIcon className={iconCls} /> }]),
      // Reordered for Shop menu: Pages (under New page), then New Product, then Products
      // In the shop-specific menu, show "Edit Pages" to clarify action
      { href: shop ? `${base}/pages` : "/pages", label: shop ? "Edit Pages" : "Pages", icon: <ReaderIcon className={iconCls} /> },
      ...(shop ? [{ href: `${base}/products/new`, label: "New Product", icon: <PlusIcon className={iconCls} /> }] : []),
      { href: shop ? `${base}/products` : "/products", label: "Products", icon: <BoxIcon className={iconCls} /> },
      // Shop-specific Orders
      ...(shop ? [{ href: `/orders/${shop}`, label: "Orders", icon: <ReaderIcon className={iconCls} /> }] : []),
      ...(shop
        ? [
            {
              href: `${base}/pages/new/component`,
              label: "New Component",
              icon: <PlusIcon className={iconCls} />,
            },
            {
              href: `${base}/pages/edit/component`,
              label: "Component Editor",
              icon: <MixIcon className={iconCls} />,
            },
          ]
        : []),
      // Since "Pages" routes directly to the builder when a shop is selected,
      // avoid adding a separate "Create new page" entry to prevent duplicate keys.
      { href: shop ? `${base}/media` : "/media", label: "Media", icon: <ImageIcon className={iconCls} /> },
      // Global marketing workspace (email, discounts, segments)
      { href: "/marketing", label: "Marketing", icon: <EnvelopeClosedIcon className={iconCls} /> },
      ...(shop ? [{ href: `${base}/edit-preview`, label: "Edit Preview", icon: <UpdateIcon className={iconCls} /> }] : []),
      ...(shop && role && ["admin", "ShopAdmin", "ThemeEditor"].includes(role)
        ? [{ href: `${base}/themes`, label: "Theme", icon: <TokensIcon className={iconCls} /> }]
        : []),
      // Settings (shop settings) removed; we will use Configurator as Settings
      ...(shop
        ? [
            { href: `${base}/settings/seo`, label: "SEO", icon: <MagnifyingGlassIcon className={iconCls} /> },
            { href: `${base}/settings/deposits`, label: "Deposits", icon: <TokensIcon className={iconCls} /> },
          ]
        : []),
      ...(features.raTicketing ? [{ href: "/ra", label: "RA", icon: <ResetIcon className={iconCls} /> }] : []),
      { href: "/live", label: "Live", icon: <RocketIcon className={iconCls} /> },
      // Global admin tools
      ...(role === "admin" ? [{ href: "/rbac", label: "RBAC", icon: <PersonIcon className={iconCls} /> }] : []),
      ...(role === "admin" ? [{ href: "/account-requests", label: "Account Requests", icon: <EnvelopeClosedIcon className={iconCls} /> }] : []),
      ...(role === "admin" ? [{ href: "/plugins", label: "Plugins", icon: <MixIcon className={iconCls} /> }] : []),
      // Blog (shop-scoped via querystring)
      ...(shop ? [{ href: `/blog/posts?shopId=${shop}`, label: "Blog", icon: <ReaderIcon className={iconCls} /> }] : []),
      ...(role === "admin"
        ? [
            // RBAC and Account Requests removed
            {
              href: "/configurator",
              label: "New Shop (Configurator)",
              icon: <GearIcon className={iconCls} />,
              title: "Open configurator",
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
