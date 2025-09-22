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
  // If a container is provided, render within a Portal targeting it.
  if (container) {
    return (
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          align={align}
          className={cn(
            "bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-elevation-2 outline-none pointer-events-auto",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Portal>
    );
  }

  // Default: render Content directly (Radix will handle its own portal).
  return (
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-elevation-2 outline-none pointer-events-auto",
        className
      )}
      {...props}
    />
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
