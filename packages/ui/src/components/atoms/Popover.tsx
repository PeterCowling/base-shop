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
  // Ensure a non-transparent background even if theme vars are missing by
  // providing robust CSS variable fallbacks like other primitives do.
  const { style: styleFromProps, ...restProps } = props;
  const safeStyle: React.CSSProperties = {
    backgroundColor: "hsl(var(--panel, var(--color-panel, var(--surface-2, var(--color-bg)))))",
    color: "hsl(var(--color-fg, 0 0% 10%))",
    ...(styleFromProps as React.CSSProperties | undefined),
  };
  // If a container is provided, render within a Portal targeting it.
  if (container) {
    return (
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          align={align}
          className={cn(
            "bg-panel text-foreground z-50 rounded-md border p-4 shadow-elevation-2 outline-none pointer-events-auto border-border-2",
            className
          )}
          style={safeStyle}
          {...restProps}
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
        "bg-panel text-foreground z-50 rounded-md border p-4 shadow-elevation-2 outline-none pointer-events-auto border-border-2",
        className
      )}
      style={safeStyle}
      {...restProps}
    />
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
