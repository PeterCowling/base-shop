// packages/ui/components/cms/TopBar.tsx
"use client";

import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "../atoms-shadcn";
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
    <header className="bg-background/60 flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 backdrop-blur dark:border-gray-800">
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="sm:hidden" onClick={toggleNav}>
          ☰
        </Button>
        <Breadcrumbs />
        <ShopSelector />
      </div>
      <div className="flex items-center gap-2">
        {showNewProduct && (
          <Link
            href={`/cms/shop/${shop}/products/new`}
            className="bg-primary hover:bg-primary/90 rounded-md px-3 py-2 text-sm text-white"
          >
            New product
          </Link>
        )}
        {showNewPage && (
          <Link
            href={`/cms/shop/${shop}/pages/new/builder`}
            className="bg-primary hover:bg-primary/90 rounded-md px-3 py-2 text-sm text-white"
          >
            New page
          </Link>
        )}
        <Button variant="outline" onClick={() => router.refresh()}>
          Refresh
        </Button>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign&nbsp;out
        </Button>
      </div>
    </header>
  );
}

export default memo(TopBarInner);
