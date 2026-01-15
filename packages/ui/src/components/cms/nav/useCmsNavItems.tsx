// packages/ui/src/components/cms/nav/useCmsNavItems.tsx
"use client";

import { getShopFromPath } from "@acme/shared-utils";
import { features } from "@acme/platform-core/features";
import { useMemo } from "react";
import { useTranslations } from "@acme/i18n";
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
  UploadIcon,
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
  const t = useTranslations();
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
      { href: shop ? `${base}` : "", label: String(t("Dashboard")), icon: <LayersIcon className={iconCls} /> },
      ...(shop ? [] : [{ href: "/shop", label: String(t("Shops")), icon: <LayersIcon className={iconCls} /> }]),
      // Reordered for Shop menu: Pages (under New page), then New Product, then Products
      // In the shop-specific menu, show "Edit Pages" to clarify action
      { href: shop ? `${base}/pages` : "/pages", label: String(t(shop ? "Edit Pages" : "Pages")), icon: <ReaderIcon className={iconCls} /> },
      ...(shop ? [{ href: `${base}/products/new`, label: String(t("New Product")), icon: <PlusIcon className={iconCls} /> }] : []),
      { href: shop ? `${base}/products` : "/products", label: String(t("Products")), icon: <BoxIcon className={iconCls} /> },
      // Shop-specific Orders
      ...(shop ? [{ href: `/orders/${shop}`, label: String(t("Orders")), icon: <ReaderIcon className={iconCls} /> }] : []),
      ...(shop
        ? [
            {
              href: `${base}/pages/new/component`,
              label: String(t("New Component")),
              icon: <PlusIcon className={iconCls} />,
            },
            {
              href: `${base}/pages/edit/component`,
              label: String(t("Component Editor")),
              icon: <MixIcon className={iconCls} />,
            },
          ]
        : []),
      // Since "Pages" routes directly to the builder when a shop is selected,
      // avoid adding a separate "Create new page" entry to prevent duplicate keys.
      { href: shop ? `${base}/media` : "/media", label: String(t("Media")), icon: <ImageIcon className={iconCls} /> },
      ...(shop && role && ["admin", "ShopAdmin", "CatalogManager"].includes(role)
        ? [{ href: `${base}/uploads`, label: String(t("Uploads")), icon: <UploadIcon className={iconCls} /> }]
        : []),
      // Global marketing workspace (email, discounts, segments)
      { href: "/marketing", label: String(t("Marketing")), icon: <EnvelopeClosedIcon className={iconCls} /> },
      ...(shop ? [{ href: `${base}/edit-preview`, label: String(t("Edit Preview")), icon: <UpdateIcon className={iconCls} /> }] : []),
      ...(shop && role && ["admin", "ShopAdmin", "ThemeEditor"].includes(role)
        ? [{ href: `${base}/themes`, label: String(t("Theme")), icon: <TokensIcon className={iconCls} /> }]
        : []),
      // Settings (shop settings) removed; we will use Configurator as Settings
      ...(shop
        ? [
            { href: `${base}/settings/seo`, label: String(t("SEO")), icon: <MagnifyingGlassIcon className={iconCls} /> },
            { href: `${base}/settings/deposits`, label: String(t("Deposits")), icon: <TokensIcon className={iconCls} /> },
          ]
        : []),
      ...(features.raTicketing ? [{ href: "/ra", label: String(t("RA")), icon: <ResetIcon className={iconCls} /> }] : []),
      { href: "/live", label: String(t("Live")), icon: <RocketIcon className={iconCls} /> },
      // Global admin tools
      ...(role === "admin" ? [{ href: "/rbac", label: String(t("RBAC")), icon: <PersonIcon className={iconCls} /> }] : []),
      ...(role === "admin" ? [{ href: "/account-requests", label: String(t("Account Requests")), icon: <EnvelopeClosedIcon className={iconCls} /> }] : []),
      ...(role === "admin" ? [{ href: "/plugins", label: String(t("Plugins")), icon: <MixIcon className={iconCls} /> }] : []),
      // Blog (shop-scoped via querystring)
      ...(shop ? [{ href: `/blog/posts?shopId=${shop}`, label: String(t("Blog")), icon: <ReaderIcon className={iconCls} /> }] : []),
      ...(role === "admin"
        ? [
            // RBAC and Account Requests removed
            {
              href: "/configurator",
              label: String(t("New Shop (Configurator)")),
              icon: <GearIcon className={iconCls} />,
              title: String(t("Open configurator")),
              isConfigurator: true,
            },
          ]
        : []),
    ];

    return links.map((link) => {
      const fullHref = `/cms${link.href}`;
      const isDashboardLink = link.label === String(t("Dashboard"));
      const isShopIndexLink = link.label === String(t("Shops"));
      const active = isDashboardLink
        ? pathname === dashboardBase
        : isShopIndexLink
          ? pathname === fullHref
          : pathname.startsWith(fullHref);
      return { ...link, fullHref, active } as CmsNavItem;
    });
  }, [pathname, role, t]);
}
