// packages/ui/components/atoms/primitives/select.tsx
"use client";
// i18n-exempt: no user-facing copy; purely structural primitive

import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as React from "react";
import { cn } from "../../../utils/style";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground", // i18n-exempt: classes only
      "placeholder:text-muted-foreground", // i18n-exempt: classes only
      "focus:outline-none focus:ring-[var(--ring-width)] focus:ring-offset-[var(--ring-offset-width)] focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50", // i18n-exempt: classes only
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDownIcon className="ms-2 h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName; // i18n-exempt: component displayName

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "min-w-32 overflow-hidden rounded-md border border-border-2 bg-panel p-1 text-foreground shadow-elevation-2", // i18n-exempt: classes only
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1 bg-panel">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName; // i18n-exempt: component displayName

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    // i18n-exempt: classes only
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName; // i18n-exempt: component displayName

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pe-2 ps-8 text-sm text-fg outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // i18n-exempt: classes only
      "hover:bg-surface-3 focus:bg-accent focus:text-accent-foreground", // i18n-exempt: classes only
      className
    )}
    {...props}
  >
    {/* i18n-exempt: classes only */}
    <span className="relative ms-2 flex h-3.5 w-3.5 items-center justify-center">
      <span className="absolute inset-0 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName; // i18n-exempt: component displayName

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <>
    {/* i18n-exempt: classes only */}
    <SelectPrimitive.Separator
      ref={ref}
      className={cn("bg-muted -mx-1 my-1 h-px" /* i18n-exempt: classes only */, className)}
      {...props}
    />
  </>
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName; // i18n-exempt: component displayName
