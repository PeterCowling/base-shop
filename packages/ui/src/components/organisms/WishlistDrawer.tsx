import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";

import { Button } from "../atoms/shadcn";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerPortal,
} from "../atoms/primitives/drawer";
import { OverlayScrim } from "../atoms";
import type { SKU } from "@acme/types";

export interface WishlistDrawerProps {
  /** Button or element that toggles the drawer */
  trigger: React.ReactNode;
  /** Products marked as favourites */
  items: SKU[];
  /**
   * Optional width for the drawer.
   * Can be a Tailwind width class or numeric pixel value.
   */
  width?: string | number;
}

/**
 * Slide-over panel listing products added to the user's wishlist.
 * Accepts an external trigger element to open the drawer.
 */
export function WishlistDrawer({
  trigger,
  items,
  width = "20rem",
}: WishlistDrawerProps) {
  const { widthClass, style } = drawerWidthProps(width);

  return (
    <Drawer>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerPortal>
        <OverlayScrim />
        <DrawerContent
        style={style}
        side="right"
        width={widthClass}
        className={cn("p-6")}
      >
        <DrawerTitle className="mb-4 text-lg font-semibold">Wishlist</DrawerTitle>
        <DrawerDescription className="sr-only">
          Items currently saved to your wishlist
        </DrawerDescription>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Your wishlist is empty.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-surface-2"
              >
                <span>{item.title}</span>
                <Button variant="outline" className="h-8 px-2">
                  View
                </Button>
              </li>
            ))}
          </ul>
        )}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
