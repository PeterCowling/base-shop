// packages/ui/components/atoms/primitives/dropdown-menu.tsx
 
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  ChevronRightIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";

import { cn } from "../utils/style";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = (
  {
    ref,
    className,
    inset,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>>;
    inset?: boolean;
  }
) => (<DropdownMenuPrimitive.SubTrigger
  ref={ref}
  className={cn(
    "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent-soft data-[highlighted]:bg-accent-soft",
    inset && "ps-8",
    className
  )}
  {...props}
>
  {children}
  <ChevronRightIcon className="ms-auto h-4 w-4" />
</DropdownMenuPrimitive.SubTrigger>);

export const DropdownMenuSubContent = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>;
  }
) => (<DropdownMenuPrimitive.SubContent
  ref={ref}
  className={cn(
    "bg-panel text-foreground z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-elevation-3 border-border-2",
    className
  )}
  // Hard fallback ensures solid background even if tokens are missing
  style={{
    backgroundColor: "hsl(var(--panel, var(--color-panel, var(--surface-2, var(--color-bg)))))",
    color: "hsl(var(--popover-foreground, var(--color-fg, 0 0% 10%)))",
    borderColor: "hsl(var(--border-2, var(--color-fg, 0 0% 10%) / 0.22))",
  }}
  {...props}
/>);

export const DropdownMenuContent = (
  {
    ref,
    className,
    sideOffset = 4,
    container,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content>>;
    container?: HTMLElement | null;
  }
) => {
  // Only portal into an explicit container if provided by the caller.
  // Default behavior: Radix portals to document.body to avoid aria-hidden warnings
  // when the container is not an ancestor of the trigger.
  return (
  <DropdownMenuPrimitive.Portal {...(container ? { container } : {})}>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
    className={cn(
      "bg-panel text-foreground z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-elevation-3 border-border-2",
      className
    )}
      // Hard fallback ensures solid background even if tokens are missing
      style={{
        backgroundColor: "hsl(var(--panel, var(--color-panel, var(--surface-2, var(--color-bg)))))",
        color: "hsl(var(--popover-foreground, var(--color-fg, 0 0% 10%)))",
        borderColor: "hsl(var(--border-2, var(--color-fg, 0 0% 10%) / 0.22))",
      }}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
  );
};

export const DropdownMenuItem = (
  {
    ref,
    className,
    inset,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item>>;
    inset?: boolean;
  }
) => (<DropdownMenuPrimitive.Item
  ref={ref}
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent-soft data-[highlighted]:bg-accent-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    inset && "ps-8",
    className
  )}
  {...props}
/>);

export const DropdownMenuCheckboxItem = (
  {
    ref,
    className,
    children,
    checked,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>;
  }
) => (<DropdownMenuPrimitive.CheckboxItem
  ref={ref}
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none transition-colors hover:bg-accent-soft data-[highlighted]:bg-accent-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
  checked={checked}
  {...props}
>
  {/* Relative wrapper ensures the absolute indicator has a positioned ancestor */}
  <div className="relative"> {/* i18n-exempt: class names */}
    <span className="absolute ms-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </div>
</DropdownMenuPrimitive.CheckboxItem>);

export const DropdownMenuRadioItem = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>>;
  }
) => (<DropdownMenuPrimitive.RadioItem
  ref={ref}
  className={cn(
    "relative flex cursor-default select-none items-center rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none transition-colors hover:bg-accent-soft data-[highlighted]:bg-accent-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className
  )}
  {...props}
>
  {/* Relative wrapper ensures the absolute indicator has a positioned ancestor */}
  <div className="relative"> {/* i18n-exempt: class names */}
    <span className="absolute ms-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <DotFilledIcon className="h-4 w-4 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </div>
</DropdownMenuPrimitive.RadioItem>);

export const DropdownMenuLabel = (
  {
    ref,
    className,
    inset,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label>>;
    inset?: boolean;
  }
) => (<DropdownMenuPrimitive.Label
  ref={ref}
  className={cn("px-2 py-1.5 text-sm font-semibold", inset && "ps-8", className)}
  {...props}
/>);

export const DropdownMenuSeparator = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
    ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>;
  }
) => (<DropdownMenuPrimitive.Separator
  ref={ref}
  className={cn("bg-muted -mx-1 my-1 h-px", className)}
  {...props}
/>);

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ms-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
