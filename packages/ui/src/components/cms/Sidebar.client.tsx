// packages/ui/components/cms/Sidebar.tsx
"use client";
import { getShopFromPath } from "@acme/shared-utils";
import type { NavigationLink } from "@acme/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { features } from "@acme/platform-core/features";
import { memo, useEffect, useMemo } from "react";

interface SidebarProps {
  role?: string;
  pathname?: string;
}

function Sidebar({ role, pathname: pathnameProp }: SidebarProps) {
  const routerPathname = usePathname();

  const pathname = useMemo(
    () => pathnameProp ?? routerPathname ?? "",
    [pathnameProp, routerPathname],
  );

  const navItems = useMemo(() => {
    const shop = getShopFromPath(pathname);
    const base = shop ? `/shop/${shop}` : "";
    const dashboardBase = shop ? `/cms/shop/${shop}` : "/cms";

    const links: NavigationLink[] = [
      { href: base, label: "Dashboard", icon: "📊" },
      ...(shop ? [] : [{ href: "/shop", label: "Shops", icon: "🏬" }]),
      {
        href: shop ? `${base}/products` : "/products",
        label: "Products",
        icon: "📦",
      },
      ...(shop
        ? [
            { href: `${base}/products/new`, label: "New Product", icon: "➕" },
          ]
        : []),
      { href: shop ? `${base}/pages` : "/pages", label: "Pages", icon: "📄" },
      ...(shop
        ? [{ href: `${base}/pages/new/builder`, label: "New Page", icon: "📝" }]
        : []),
      { href: shop ? `${base}/media` : "/media", label: "Media", icon: "🖼️" },
      ...(shop
        ? [{ href: `${base}/edit-preview`, label: "Edit Preview", icon: "🧪" }]
        : []),
      ...(shop && role && ["admin", "ShopAdmin", "ThemeEditor"].includes(role)
        ? [{ href: `${base}/themes`, label: "Theme", icon: "🎨" }]
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
            {
              href: "/rbac",
              label: "RBAC",
              icon: "🛡️",
              title: "Manage user roles",
            },
            {
              href: "/account-requests",
              label: "Account Requests",
              icon: "📥",
              title: "Approve new users",
            },
            {
              href: "/wizard",
              label: "Create Shop",
              icon: "🛍️",
              title: "Create a new shop",
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
      return { ...link, fullHref, active };
    });
  }, [pathname, role, features.raTicketing]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("sidebar rendered on client");
    }
  }, []);

  const handleClick = () => {
    console.log("step 1: create shop link clicked");
  };

  return (
    <aside className="w-56 shrink-0 border-r border-muted">
      <h1 className="px-4 py-6 text-lg font-semibold tracking-tight">CMS</h1>
      <nav>
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map(({ label, icon, title, fullHref, active }) => (
            <li key={fullHref}>
              <Link href={fullHref} legacyBehavior>
                <a
                  aria-current={active ? "page" : undefined}
                  title={title}
                  className={`focus-visible:ring-primary flex items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none ${active ? "bg-primary/10 font-medium" : "hover:bg-muted"}`}
                  {...(label === "Create Shop" ? { onClick: handleClick } : {})}
                >
                  <span>{icon}</span>
                  {label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
