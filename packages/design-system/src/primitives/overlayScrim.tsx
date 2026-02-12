// packages/ui/components/atoms/primitives/overlayScrim.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../utils/style";

export type OverlayScrimProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;

export const OverlayScrim = (
  {
    ref,
    className,
    ...props
  }: OverlayScrimProps & {
    ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Overlay>>;
  }
) => (<DialogPrimitive.Overlay
  ref={ref}
  className={cn("fixed inset-0 z-40 bg-surface-2/60", className)} // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  {...props}
/>);
