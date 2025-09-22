// packages/ui/src/components/cms/NavMenu.client.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback } from "react";
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

interface NavMenuProps {
  role?: string;
  onConfiguratorStartNew?: () => void | Promise<void>;
}

function NavMenu({ role, onConfiguratorStartNew }: NavMenuProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const items = useCmsNavItems({ pathname, role });

  const handleConfiguratorClick = useCallback(() => {
    try {
      const result = onConfiguratorStartNew?.();
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).catch(() => {});
      }
    } catch {}
  }, [onConfiguratorStartNew]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-lg border-border-2 text-foreground hover:bg-surface-3"
        >
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        <DropdownMenuLabel>Navigate</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.fullHref}
            className={item.active ? "bg-surface-3 text-foreground" : ""}
            onSelect={(e) => {
              e.preventDefault();
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
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default memo(NavMenu);

