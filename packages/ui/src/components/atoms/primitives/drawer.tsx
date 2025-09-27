// packages/ui/components/atoms/primitives/drawer.tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "../../../utils/style";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerPortal = DialogPrimitive.Portal;
export const DrawerOverlay = DialogPrimitive.Overlay;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right";
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
    "fixed top-0 z-50 h-full max-w-full overflow-y-auto border-border-2 shadow-elevation-4 data-[state=open]:translate-x-0 transition-transform";
  const sideClass =
    side === "left"
      ? "start-0 translate-x-[-100%] border-e"
      : "end-0 translate-x-[100%] border-s";

  return (
    <DialogPrimitive.Content
      ref={ref}
      className={cn("bg-panel", common, sideClass, widthClass, className)}
      style={{ ...inlineStyle, ...style }}
      {...props}
    />
  );
});
DrawerContent.displayName = DialogPrimitive.Content.displayName;
