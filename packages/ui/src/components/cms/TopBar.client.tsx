// packages/ui/components/cms/TopBar.tsx
"use client";

import { useLayout } from "@acme/platform-core/contexts/LayoutContext";
import { getShopFromPath } from "@acme/shared-utils";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button, Card } from "../atoms/shadcn";
import { Switch } from "../atoms";
import Breadcrumbs from "./Breadcrumbs.client";
import ShopSelector from "./ShopSelector";

function TopBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleNav } = useLayout();

  const segments = pathname.split("/").filter(Boolean);
  const shop = getShopFromPath(pathname);
  const last = segments[segments.length - 1];

  const showNewProduct = shop && last === "products";
  const showNewPage = shop && last === "pages";

  // CMS theme toggle (light/dark) using html.theme-dark + localStorage("theme")
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsDark(document.documentElement.classList.contains("theme-dark"));
  }, []);
  // Theme toggling is handled inline on the Switch below

  return (
    <header className="relative z-10 border-b border-border-1 bg-surface-2 px-6 py-3 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-hero opacity-10" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            className="h-9 w-9 shrink-0 rounded-lg border border-border-2 bg-surface-2 text-foreground sm:hidden"
            onClick={toggleNav}
          >
            <span className="sr-only">Toggle navigation</span>
            ☰
          </Button>
          <Link
            href="/cms"
            className="rounded-lg border border-border-1 bg-surface-2 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-3"
          >
            Dashboard
          </Link>
          <Breadcrumbs />
          <div className="hidden sm:flex">
            <ShopSelector />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {showNewProduct && (
            <Button asChild className="h-9 rounded-lg bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-400">
              <Link href={`/cms/shop/${shop}/products/new`}>New product</Link>
            </Button>
          )}
          {showNewPage && (
            <Button asChild className="h-9 rounded-lg bg-sky-500 px-3 py-2 text-white hover:bg-sky-400">
              <Link href={`/cms/shop/${shop}/pages/new/builder`}>New page</Link>
            </Button>
          )}
          {/* Theme toggle (left of Refresh) */}
          <div className="flex items-center gap-2 pr-2" role="group" aria-labelledby="cms-theme-label">
            <span className="sr-only" id="cms-theme-label">Toggle theme</span>
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
            Refresh
          </Button>
          <Button
            variant="ghost"
            className="h-9 rounded-lg text-foreground hover:bg-muted/10"
            onClick={() =>
              signOut({ redirect: false }).then(() => router.push("/login"))
            }
          >
            Sign out
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
