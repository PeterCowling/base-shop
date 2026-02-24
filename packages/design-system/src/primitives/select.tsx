// packages/ui/components/atoms/primitives/select.tsx
"use client";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — purely structural primitive, no user-facing copy

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";

import { cn, overflowContainmentClass } from "../utils/style";

import { type PrimitiveRadius, type PrimitiveShape, resolveShapeRadiusClass } from "./shape-radius";

export const Select = SelectPrimitive.Root;
export type SelectProps = SelectPrimitive.SelectProps;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  /** Semantic surface shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  /** Semantic item shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const SelectTrigger = (
  {
    ref,
    className,
    children,
    shape,
    radius,
    ...props
  }: SelectTriggerProps & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger>>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (<SelectPrimitive.Trigger
  ref={ref}
  className={cn(
    "flex h-10 w-full items-center justify-between border border-input bg-input px-3 py-2 text-sm text-foreground", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    shapeRadiusClass,
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
};

export const SelectContent = (
  {
    ref,
    className,
    children,
    shape,
    radius,
    ...props
  }: SelectContentProps & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Content>>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (<SelectPrimitive.Portal>
  <SelectPrimitive.Content
    ref={ref}
    className={cn(
      "min-w-32 border border-border-2 bg-panel p-1 text-foreground shadow-elevation-2", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      overflowContainmentClass("menuSurface"),
      shapeRadiusClass,
      className
    )}
    {...props}
  >
    <SelectPrimitive.Viewport className="p-1 bg-panel">
      {children}
    </SelectPrimitive.Viewport>
  </SelectPrimitive.Content>
</SelectPrimitive.Portal>);
};

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
    shape,
    radius,
    ...props
  }: SelectItemProps & {
    ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Item>>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "sm",
  });

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full min-w-0 cursor-default select-none items-center py-1.5 pe-2 ps-8 text-sm text-fg outline-none break-words data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        shapeRadiusClass,
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
      <SelectPrimitive.ItemText>
        <span className="min-w-0 break-words">{children}</span>
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
};

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
