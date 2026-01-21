// packages/ui/components/atoms/primitives/dialog.tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";

import { useTranslations } from "@acme/i18n";

import { cn } from "../utils/style";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 backdrop-blur-sm bg-surface-2/60", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
  <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Add overflow-x-hidden to prevent inner content from bleeding horizontally
        // out of the dialog when children use full-width inputs inside flex rows.
        // Slightly wider default dialog to give editors more breathing room
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 start-1/2 z-50 grid w-full sm:max-w-xl -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-elevation-4 duration-200 overflow-x-hidden relative", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — class names; include relative to scope absolute close button
        "bg-panel border-border-2 text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className
      )}
      aria-modal="true"
      {...props}
    >
      {children}
      {/* Relative wrapper ensures absolute close button has a positioned ancestor */}
      <div className="relative"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
        <DialogPrimitive.Close className="absolute top-4 me-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
          <Cross2Icon className="h-4 w-4" />
          <DialogCloseLabel />
        </DialogPrimitive.Close>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-start", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      className
    )}
    {...props}
  />
);

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      className
    )}
    {...props}
  />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)} // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-muted-foreground text-sm", className)} // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

function DialogCloseLabel() {
  const t = useTranslations();
  return <span className="sr-only">{t("actions.close")}</span>;
}
