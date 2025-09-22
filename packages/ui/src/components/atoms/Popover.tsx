import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { cn } from "../../utils/style";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    container?: HTMLElement | null;
  }
>(({ className, sideOffset = 4, align = "center", container, ...props }, ref) => {
  const defaultContainer =
    typeof document !== "undefined"
      ? (document.querySelector('[data-pb-portal-root]') as HTMLElement | null)
      : null;

  return (
    <PopoverPrimitive.Portal container={container ?? defaultContainer}>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          // High z-index to float above sticky toolbars and overlays
          "bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-elevation-2 outline-none pointer-events-auto",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
