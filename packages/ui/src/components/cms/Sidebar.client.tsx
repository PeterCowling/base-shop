// packages/ui/components/cms/Sidebar.tsx
"use client";
import { getShopFromPath } from "@acme/shared-utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { features } from "@acme/platform-core/features";
import { memo, useMemo } from "react";
import { Button, Card, CardContent } from "../atoms/shadcn";
import { Tag } from "../atoms";
import { cn } from "@ui/utils/style";

interface NavigationLink {
  href: string;
  label: string;
  icon: string;
  title?: string;
}

interface SidebarProps {
  role?: string;
  pathname?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
}

function Sidebar({
  role,
  pathname: pathnameProp,
  onConfiguratorStartNew,
}: SidebarProps) {
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
              href: "/configurator",
              label: "New Shop (Configurator)",
              icon: "🛠️",
              title: "Launch configurator to create a new shop",
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
  }, [pathname, role]);

  const handleConfiguratorClick = () => {
    try {
      const result = onConfiguratorStartNew?.();
      if (result && typeof result.then === "function") {
        result.catch(() => {
          /* swallow reset errors so navigation still continues */
        });
      }
    } catch {
      /* ignore reset errors */
    }
  };

  return (
    <aside className="flex h-full w-full flex-col gap-6 px-5 py-6 text-sm">
      <div className="space-y-2">
        <Tag variant="default" className="bg-white/10 text-white/80">
          Control Center
        </Tag>
        <h1 className="text-2xl font-semibold tracking-tight">Base Shop CMS</h1>
        <p className="text-xs text-white/60">
          Configure storefronts, orchestrate launches, and monitor activity from one hub.
        </p>
        <Button
          className="mt-3 w-full justify-center bg-white/10 text-white hover:bg-white/20"
          onClick={handleConfiguratorClick}
          asChild
        >
          <Link href="/cms/configurator">Launch Configurator</Link>
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="space-y-4 px-4 py-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
            <span>Main navigation</span>
            <span>Explore</span>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ label, icon, title, fullHref, active, href }) => (
              <Link
                key={fullHref}
                href={fullHref}
                aria-current={active ? "page" : undefined}
                title={title}
                onClick={href === "/configurator" ? handleConfiguratorClick : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="text-lg" aria-hidden>
                  {icon}
                </span>
                <span className="flex-1 font-medium">{label}</span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                )}
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>

      <div className="mt-auto space-y-3 text-xs text-white/60">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="space-y-2 px-4 py-4">
            <h2 className="text-sm font-semibold text-white">Need a hand?</h2>
            <p>Visit the docs or ping the platform team for support.</p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="h-9 flex-1 border-white/30 text-white">
                <Link href="/docs">Docs</Link>
              </Button>
              <Button asChild className="h-9 flex-1 bg-white/10 text-white hover:bg-white/20">
                <Link href="/cms/support">Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <p>Build version 1.0.0 · Crafted with care for the Base Shop team.</p>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
