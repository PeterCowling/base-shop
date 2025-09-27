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
import { PlusIcon, MixIcon } from "@radix-ui/react-icons";
import { useTranslations } from "@acme/i18n";

interface NavMenuProps {
  role?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
  label?: string;
  variant?: "cms" | "shop";
}

function NavMenu({ role, onConfiguratorStartNew, label, variant = "cms" }: NavMenuProps) {
  const t = useTranslations();
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
            i.fullHref.endsWith("/pages/edit/component") ||
            i.isConfigurator
          ),
      );
    }
    // CMS-level menu: include global items and suppress duplicates of
    // component edit/create and configurator (we add explicit entries below).
    if (variant === "cms")
      return items.filter((i) => {
        // Fully separate CMS vs Shop menus:
        // - Drop shop-scoped entries (anything under /cms/shop/<shop>/...)
        // - Drop configurator duplicates (we add a custom New Shop above)
        // - Drop component editor duplicates (we add custom items above)
        // - Drop "Edit Pages" from CMS menu
        const isShopScoped = i.fullHref.startsWith("/cms/shop/");
        if (isShopScoped) return false;
        if (i.isConfigurator) return false;
        return true;
      });
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

  const onConfigurator = pathname.startsWith("/cms/configurator");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-lg border-border-2 text-foreground hover:bg-surface-3"
        >
          {label ?? t("nav.menu")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        <DropdownMenuLabel>{t("nav.navigate")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* eslint-disable ds/no-hardcoded-copy -- ABC-123: route paths, keys and style classes are not UI copy */}
        {variant === "cms" && (
          <DropdownMenuItem
            key="add-shop"
            className={onConfigurator ? "bg-surface-3 text-foreground" : ""}
            onSelect={() => {
              router.push("/cms/configurator"); // i18n-exempt -- route path
            }}
          >
            <span className="me-2" aria-hidden>
              <PlusIcon className="h-4 w-4" />
            </span>
            <span className="flex-1">{t("nav.newShop")}</span>
            {onConfigurator ? (
              <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        )}
        {variant === "cms" && (
          <>
            <DropdownMenuItem
              key="cms-new-component"
              onSelect={() => {
                router.push("/cms/pages/new/component"); // i18n-exempt -- route path
              }}
            >
              <span className="me-2" aria-hidden>
                <PlusIcon className="h-4 w-4" />
              </span>
              <span className="flex-1">{t("nav.newComponent")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              key="cms-edit-component"
              onSelect={() => {
                router.push("/cms/pages/edit/component"); // i18n-exempt -- route path
              }}
            >
              <span className="me-2" aria-hidden>
                <MixIcon className="h-4 w-4" />
              </span>
              <span className="flex-1">{t("nav.editComponent")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
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
                <span className="me-2" aria-hidden>
                  {filteredItems[0].icon}
                </span>
                <span className="flex-1">{filteredItems[0].label}</span>
                {isActive(filteredItems[0].active, filteredItems[0].fullHref) ? (
                  <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            )}
            {shop && (
              <DropdownMenuItem
                key="page-builder-special"
                className={onNewPage ? "bg-surface-3 text-foreground" : ""}
                onSelect={handleOpenPageBuilder}
              >
                <span className="me-2" aria-hidden>
                  <PlusIcon className="h-4 w-4" />
                </span>
                <span className="flex-1">{t("nav.newPage")}</span>
                {onNewPage ? (
                  <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
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
                <span className="me-2" aria-hidden>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive(item.active, item.fullHref) ? (
                  <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
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
              <span className="me-2" aria-hidden>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.active ? (
                <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))
        )}
        {/* eslint-enable ds/no-hardcoded-copy */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default memo(NavMenu);
