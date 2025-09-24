import * as React from "react";
import { cn } from "../../utils/style";
import { drawerWidthProps } from "../../utils/style/drawerWidth";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../atoms/shadcn";
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
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        style={style}
        className={cn(
          "bg-panel fixed top-0 right-0 z-50 h-full max-w-full translate-x-full overflow-y-auto border-l border-border-2 p-6 shadow-elevation-4 transition-transform data-[state=open]:translate-x-0",
          widthClass
        )}
      >
        <DialogTitle className="mb-4">Wishlist</DialogTitle>
        <DialogDescription className="sr-only">
          Items currently saved to your wishlist
        </DialogDescription>
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
      </DialogContent>
    </Dialog>
  );
}
