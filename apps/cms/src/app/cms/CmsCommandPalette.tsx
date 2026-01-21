"use client";

import { useCallback,useMemo, useState } from "react";
import { usePathname,useRouter } from "next/navigation";
import {
  FileText,
  Home,
  LayoutGrid,
  Moon,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Store,
  Sun,
} from "lucide-react";

import { getShopFromPath } from "@acme/lib/shop";
import {
  type CommandGroup,
  CommandPalette,
} from "@acme/ui/operations";

export function CmsCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const shop = getShopFromPath(pathname);
  const baseShopPath = shop ? `/cms/shop/${shop}` : null;

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("theme-dark");
    const next = isDark ? "base" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    root.style.colorScheme = next === "dark" ? "dark" : "light";
    root.classList.toggle("theme-dark", !isDark);
    try {
      window.dispatchEvent(new CustomEvent("pb:theme-changed"));
    } catch {}
  }, []);

  const groups = useMemo<CommandGroup[]>(() => {
    const navigationCommands = [
      {
        id: "home",
        label: "Home",
        description: "Go to CMS home",
        icon: Home,
        onSelect: () => router.push("/cms"),
        keywords: ["dashboard", "main"],
      },
      {
        id: "shops",
        label: "Shops",
        description: "View all shops",
        icon: Store,
        onSelect: () => router.push("/cms"),
        keywords: ["stores", "list"],
      },
    ];

    const shopCommands = baseShopPath
      ? [
          {
            id: "products",
            label: "Products",
            description: `View ${shop} products`,
            icon: Package,
            onSelect: () => router.push(`${baseShopPath}/products`),
            keywords: ["inventory", "items"],
          },
          {
            id: "pages",
            label: "Pages",
            description: `View ${shop} pages`,
            icon: FileText,
            onSelect: () => router.push(`${baseShopPath}/pages`),
            keywords: ["content", "builder"],
          },
          {
            id: "design",
            label: "Design",
            description: `Edit ${shop} design settings`,
            icon: Palette,
            onSelect: () => router.push(`${baseShopPath}/design`),
            keywords: ["theme", "colors", "branding"],
          },
          {
            id: "settings",
            label: "Shop Settings",
            description: `Configure ${shop}`,
            icon: Settings,
            onSelect: () => router.push(`${baseShopPath}/settings`),
            keywords: ["config", "options"],
          },
          {
            id: "sections",
            label: "Sections",
            description: `Manage ${shop} sections`,
            icon: LayoutGrid,
            onSelect: () => router.push(`${baseShopPath}/sections`),
            keywords: ["blocks", "components"],
          },
        ]
      : [];

    const createCommands = baseShopPath
      ? [
          {
            id: "new-product",
            label: "New Product",
            description: `Create a new product in ${shop}`,
            icon: Plus,
            shortcut: "⌘N",
            onSelect: () => router.push(`${baseShopPath}/products/new`),
            keywords: ["add", "create"],
          },
          {
            id: "new-page",
            label: "New Page",
            description: `Create a new page in ${shop}`,
            icon: Plus,
            onSelect: () => router.push(`${baseShopPath}/pages/new/page`),
            keywords: ["add", "create"],
          },
        ]
      : [];

    const actionCommands = [
      {
        id: "refresh",
        label: "Refresh Page",
        description: "Reload the current page",
        icon: RefreshCw,
        shortcut: "⌘R",
        onSelect: () => router.refresh(),
        keywords: ["reload"],
      },
      {
        id: "toggle-theme",
        label: "Toggle Theme",
        description: "Switch between light and dark mode",
        icon: document.documentElement.classList.contains("theme-dark")
          ? Sun
          : Moon,
        shortcut: "⌘⇧D",
        onSelect: toggleTheme,
        keywords: ["dark", "light", "mode"],
      },
    ];

    const groups: CommandGroup[] = [
      {
        id: "navigation",
        heading: "Navigation",
        commands: navigationCommands,
      },
    ];

    if (shopCommands.length > 0) {
      groups.push({
        id: "shop",
        heading: `Shop: ${shop}`,
        commands: shopCommands,
      });
    }

    if (createCommands.length > 0) {
      groups.push({
        id: "create",
        heading: "Create",
        commands: createCommands,
      });
    }

    groups.push({
      id: "actions",
      heading: "Actions",
      commands: actionCommands,
    });

    return groups;
  }, [router, shop, baseShopPath, toggleTheme]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={setOpen}
      groups={groups}
      placeholder="Search commands..."
    />
  );
}
