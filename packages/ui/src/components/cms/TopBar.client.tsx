// packages/ui/components/cms/TopBar.tsx
"use client";
 

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";

import { useTranslations } from "@acme/i18n";
import { getShopFromPath } from "@acme/lib/shop";

import { Switch } from "../atoms";
import { Button, Card } from "../atoms/shadcn";

import Breadcrumbs from "./Breadcrumbs.client";
import NavMenu from "./NavMenu.client";
import ShopSelector from "./ShopSelector";

interface TopBarProps {
  role?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
}

function TopBarInner({ role, onConfiguratorStartNew }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  const segments = pathname.split("/").filter(Boolean);
  const shop = getShopFromPath(pathname);
  const last = segments[segments.length - 1];
  const baseShopPath = shop ? `/cms/shop/${shop}` : null;

  const showNewProduct = shop && last === "products";
  // Show "New page" when anywhere within the Pages area
  const showNewPage = !!(shop && baseShopPath && pathname.startsWith(`${baseShopPath}/pages`));

  // CMS theme toggle (light/dark) using html.theme-dark + localStorage("theme")
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const dark = root.classList.contains("theme-dark");
    setIsDark(dark);
    // Ensure native form controls (like <select>) adopt dark appearance on load
    try {
      root.style.colorScheme = dark ? "dark" : "light";
    } catch {}
  }, []);
  // Theme toggling is handled inline on the Switch below

  return (
    <header className="relative border-b border-border-1 bg-surface-2 px-6 py-3 text-foreground">
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Link
            href="/cms"
            className="rounded-lg border border-border-1 bg-surface-2 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-3"
          >
            {t("Home")}
          </Link>
          <NavMenu role={role} onConfiguratorStartNew={onConfiguratorStartNew} label={String(t("CMS"))} variant="cms" />
          {shop && (
            <NavMenu role={role} onConfiguratorStartNew={onConfiguratorStartNew} label={String(t("Shop"))} variant="shop" />
          )}
          <Breadcrumbs />
          <div className="hidden sm:flex">
            <ShopSelector />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {showNewProduct && (
            <Button asChild className="h-9 rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90">
              <Link href={`/cms/shop/${shop}/products/new`}>{t("New product")}</Link>
            </Button>
          )}
          {showNewPage && (
            <Button asChild className="h-9 rounded-lg bg-secondary px-3 py-2 text-secondary-foreground hover:bg-secondary/80">
              <Link href={`/cms/shop/${shop}/pages/new/page`}>{t("New page")}</Link>
            </Button>
          )}
          {/* Theme toggle (left of Refresh) */}
          <div className="flex items-center gap-2 pe-2" role="group" aria-labelledby="cms-theme-label">
            <span className="sr-only" id="cms-theme-label">{t("Toggle theme")}</span>
            <SunIcon
              aria-hidden
              className={
                "h-4 w-4 " + (isDark ? "text-muted-foreground" : "text-foreground")
              }
            />
            <Switch
              aria-labelledby="cms-theme-label"
              checked={isDark}
              onChange={(e) => {
                const next = e.currentTarget.checked ? "dark" : "base";
                try {
                  localStorage.setItem("theme", next);
                } catch {}
                const root = document.documentElement;
                root.style.colorScheme = next === "dark" ? "dark" : "light";
                root.classList.toggle("theme-dark", next === "dark");
                setIsDark(next === "dark");
                try {
                  window.dispatchEvent(new CustomEvent("pb:theme-changed"));
                } catch {}
              }}
            />
            <MoonIcon
              aria-hidden
              className={
                "h-4 w-4 " + (isDark ? "text-foreground" : "text-muted-foreground")
              }
            />
          </div>
          <Button
            variant="outline"
            className="h-9 rounded-lg border-border-2 text-foreground hover:bg-surface-3"
            onClick={() => router.refresh()}
          >
            {t("Refresh")}
          </Button>
          <Button
            variant="ghost"
            className="h-9 rounded-lg text-foreground hover:bg-muted/10"
            onClick={() =>
              signOut({ redirect: false }).then(() => router.push("/login"))
            }
          >
            {t("Sign out")}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 sm:hidden">
        <Card className="w-full border-border-1 bg-surface-2">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <ShopSelector />
          </div>
        </Card>
      </div>
    </header>
  );
}

export default memo(TopBarInner);
