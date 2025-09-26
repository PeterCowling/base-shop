// packages/ui/components/atoms/primitives/overlayScrim.tsx
"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "../../../utils/style";

export type OverlayScrimProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;

export const OverlayScrim = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  OverlayScrimProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-40 bg-[hsl(var(--overlay-scrim-1))]", className)}
    {...props}
  />
));
OverlayScrim.displayName = "OverlayScrim";

