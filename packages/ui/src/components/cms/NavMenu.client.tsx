// packages/ui/src/components/cms/NavMenu.client.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { getShopFromPath } from "@acme/shared-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../atoms/primitives/dropdown-menu";
import { Button } from "../atoms/shadcn";
import { useCmsNavItems } from "./nav/useCmsNavItems";
import { PlusIcon } from "@radix-ui/react-icons";

interface NavMenuProps {
  role?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
  label?: string;
  variant?: "cms" | "shop";
}

function NavMenu({ role, onConfiguratorStartNew, label = "Menu", variant = "cms" }: NavMenuProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const items = useCmsNavItems({ pathname, role });
  const filteredItems = (() => {
    if (variant === "shop") {
      return items.filter(
        (i) =>
          !(
            i.fullHref.endsWith("/pages/new/componenteditor") ||
            i.fullHref.endsWith("/pages/new/componentcreator") ||
            i.fullHref.endsWith("/components/new") ||
            i.fullHref.endsWith("/pages/new/component") ||
            i.isConfigurator
          ),
      );
    }
    // CMS-level menu: show all available items so you can
    // see the full navigation without selecting a shop first.
    if (variant === "cms") return items;
    return items;
  })();

  const handleOpenPageBuilder = useCallback(() => {
    const shop = getShopFromPath(pathname);
    if (!shop) return;
    router.push(`/cms/shop/${shop}/pages/new/page`);
  }, [pathname, router]);

  const handleConfiguratorClick = useCallback(() => {
    try {
      const result = onConfiguratorStartNew?.();
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch {}
  }, [onConfiguratorStartNew]);

  // Cache shop for conditional rendering
  const shop = getShopFromPath(pathname);
  const baseShopPath = shop ? `/cms/shop/${shop}` : null;
  const newPageHref = shop ? `${baseShopPath}/pages/new/page` : null;
  const pagesRootHref = shop ? `${baseShopPath}/pages` : null;
  const onNewPage = newPageHref ? pathname === newPageHref : false;
  const isPagesRoot = (href: string) => (pagesRootHref ? href === pagesRootHref : false);
  const isActive = (active: boolean, href: string) => {
    // When on the explicit New page route, suppress any other active indicator
    // for the Pages root entry so only the New page shows the green dot.
    if (onNewPage && isPagesRoot(href)) return false;
    return active;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-lg border-border-2 text-foreground hover:bg-surface-3"
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        <DropdownMenuLabel>Navigate</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {variant === "cms" && (
          <DropdownMenuItem
            key="add-shop"
            onSelect={() => {
              try {
                window.location.href = "http://localhost:3006/cms/configurator";
              } catch {}
            }}
          >
            <span className="mr-2" aria-hidden>
              <PlusIcon className="h-4 w-4" />
            </span>
            <span className="flex-1">Add Shop</span>
          </DropdownMenuItem>
        )}
        {variant === "shop" ? (
          <>
            {filteredItems.length > 0 && (
              <DropdownMenuItem
                key={`${filteredItems[0].fullHref}|${filteredItems[0].label}`}
                className={isActive(filteredItems[0].active, filteredItems[0].fullHref) ? "bg-surface-3 text-foreground" : ""}
                onSelect={() => {
                  if (filteredItems[0].isConfigurator) {
                    handleConfiguratorClick();
                  }
                  router.push(filteredItems[0].fullHref);
                }}
              >
                <span className="mr-2" aria-hidden>
                  {filteredItems[0].icon}
                </span>
                <span className="flex-1">{filteredItems[0].label}</span>
                {isActive(filteredItems[0].active, filteredItems[0].fullHref) ? (
                  <span className="ml-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            )}
            {shop && (
              <DropdownMenuItem
                key="page-builder-special"
                className={onNewPage ? "bg-surface-3 text-foreground" : ""}
                onSelect={handleOpenPageBuilder}
              >
                <span className="mr-2" aria-hidden>
                  <PlusIcon className="h-4 w-4" />
                </span>
                <span className="flex-1">New page</span>
                {onNewPage ? (
                  <span className="ml-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            )}
            {filteredItems.slice(1).map((item) => (
              <DropdownMenuItem
                key={`${item.fullHref}|${item.label}`}
                className={isActive(item.active, item.fullHref) ? "bg-surface-3 text-foreground" : ""}
                onSelect={() => {
                  if (item.isConfigurator) {
                    handleConfiguratorClick();
                  }
                  router.push(item.fullHref);
                }}
              >
                <span className="mr-2" aria-hidden>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive(item.active, item.fullHref) ? (
                  <span className="ml-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          filteredItems.map((item) => (
            <DropdownMenuItem
              key={`${item.fullHref}|${item.label}`}
              className={item.active ? "bg-surface-3 text-foreground" : ""}
              onSelect={() => {
                if (item.isConfigurator) {
                  handleConfiguratorClick();
                }
                router.push(item.fullHref);
              }}
            >
              <span className="mr-2" aria-hidden>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.active ? (
                <span className="ml-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default memo(NavMenu);
