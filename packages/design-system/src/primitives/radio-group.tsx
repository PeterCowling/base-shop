"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "../utils/style";

export const RadioGroup = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
  ref?: React.Ref<HTMLDivElement>;
}) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-2", className)}
    {...props}
  />
);

export const RadioGroupItem = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  ref?: React.Ref<HTMLButtonElement>;
}) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
);
