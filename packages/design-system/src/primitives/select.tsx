// packages/ui/components/atoms/primitives/select.tsx
"use client";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — purely structural primitive, no user-facing copy

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";

import { cn } from "../utils/style";

export const Select = SelectPrimitive.Root;
export type SelectProps = SelectPrimitive.SelectProps;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>;
  }
) => (<SelectPrimitive.Trigger
  ref={ref}
  className={cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "placeholder:text-muted-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    className
  )}
  {...props}
>
  {children}
  <SelectPrimitive.Icon asChild>
    <ChevronDownIcon className="ms-2 h-4 w-4 opacity-50" />
  </SelectPrimitive.Icon>
</SelectPrimitive.Trigger>);
export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;

export const SelectContent = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Content>>;
  }
) => (<SelectPrimitive.Portal>
  <SelectPrimitive.Content
    ref={ref}
    className={cn(
      "min-w-32 overflow-hidden rounded-md border border-border-2 bg-panel p-1 text-foreground shadow-elevation-2", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      className
    )}
    {...props}
  >
    <SelectPrimitive.Viewport className="p-1 bg-panel">
      {children}
    </SelectPrimitive.Viewport>
  </SelectPrimitive.Content>
</SelectPrimitive.Portal>);

export const SelectLabel = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Label>>;
  }
) => (<SelectPrimitive.Label
  ref={ref}
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  className={cn("px-2 py-1.5 text-sm font-semibold", className)}
  {...props}
/>);

export const SelectItem = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Item>>;
  }
) => (<SelectPrimitive.Item
  ref={ref}
  className={cn(
    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pe-2 ps-8 text-sm text-fg outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    "hover:bg-surface-3 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    className
  )}
  {...props}
>
  {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
  <span className="relative ms-2 flex h-3.5 w-3.5 items-center justify-center">
    <span className="absolute inset-0 flex items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </span>
  <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
</SelectPrimitive.Item>);

export const SelectSeparator = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Separator>>;
  }
) => (<>
  {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */, className)}
    {...props}
  />
</>);
