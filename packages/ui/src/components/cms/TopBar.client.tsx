// packages/ui/components/cms/TopBar.tsx
"use client";

import { useLayout } from "@acme/platform-core/contexts/LayoutContext";
import { getShopFromPath } from "@acme/shared-utils";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";
import { Button, Card } from "../atoms/shadcn";
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

  return (
    <header className="relative z-10 border-b border-border/10 bg-slate-950/60 px-6 py-3 text-foreground backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,_rgba(79,70,229,0.25),_rgba(244,114,182,0.12))] opacity-60" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Button
            variant="ghost"
            className="h-9 w-9 shrink-0 rounded-lg border border-border/20 bg-background/60 text-foreground sm:hidden"
            onClick={toggleNav}
          >
            <span className="sr-only">Toggle navigation</span>
            ☰
          </Button>
          <Link
            href="/cms"
            className="rounded-lg border border-border/10 bg-background/60 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10"
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
          <Button
            variant="outline"
            className="h-9 rounded-lg border-border/30 text-foreground hover:bg-muted/10"
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
        <Card className="w-full border-border/10 bg-background/60">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <ShopSelector />
          </div>
        </Card>
      </div>
    </header>
  );
}

export default memo(TopBarInner);
