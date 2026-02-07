// packages/ui/components/atoms/primitives/drawer.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../utils/style";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerPortal = DialogPrimitive.Portal;
export const DrawerOverlay = DialogPrimitive.Overlay;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right" | "bottom";
  width?: string | number;
}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, side = "right", width, style, ...props }, ref) => {
  const widthClass = typeof width === "string" ? width : undefined;
  const inlineStyle =
    typeof width === "number" ? ({ width, maxWidth: "100%" } as React.CSSProperties) : ({} as React.CSSProperties);
  const common =
    "fixed z-modal overflow-y-auto border-border-2 shadow-elevation-4 transition-transform motion-reduce:transition-none data-[state=open]:translate-x-0 data-[state=open]:translate-y-0"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const sideClass =
    side === "left"
      ? "inset-y-0 left-0 h-full w-full -translate-x-full border-r" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      : side === "right"
        ? "inset-y-0 right-0 h-full w-full translate-x-full border-l" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        : "inset-x-0 bottom-0 w-full translate-y-full border-t"; // i18n-exempt -- DS-1234 [ttl=2025-11-30]

  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn("bg-panel text-foreground", common, sideClass, widthClass, className)} // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      style={{ ...inlineStyle, ...style }}
      {...props}
    />
  );
});
DrawerContent.displayName = DialogPrimitive.Content.displayName;
