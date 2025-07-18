import * as React from "react";
import { cn } from "../../utils/cn";
import { drawerWidthProps } from "../../utils/drawerWidth";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../atoms-shadcn";
import { Product } from "./ProductCard";

export interface WishlistDrawerProps {
  /** Button or element that toggles the drawer */
  trigger: React.ReactNode;
  /** Products marked as favourites */
  items: Product[];
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
          "bg-background fixed top-0 right-0 z-50 h-full max-w-full translate-x-full overflow-y-auto border-l p-6 shadow-lg transition-transform data-[state=open]:translate-x-0",
          widthClass
        )}
      >
        <DialogTitle className="mb-4">Wishlist</DialogTitle>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Your wishlist is empty.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0"
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
