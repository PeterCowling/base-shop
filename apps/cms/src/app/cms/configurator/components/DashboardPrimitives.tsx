"use client";

import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ElementType,
} from "react";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Progress, Tag } from "@/components/atoms";
import { cn } from "@ui/utils/style";

export const CardRoot: ElementType = Card ?? "div";
export const CardSection: ElementType = CardContent ?? "div";
export const ProgressBar: ElementType = Progress ?? "div";
export const TagElement: ElementType = Tag ?? "span";

type ButtonElementProps = ComponentProps<typeof Button> & {
  asChild?: boolean;
};

const isRealButton =
  typeof Button === "function" &&
  (Button as unknown as { $$typeof?: symbol }).$$typeof ===
    Symbol.for("react.forward_ref");

export function ButtonElement(props: ButtonElementProps) {
  if (isRealButton) {
    return <Button {...props} />;
  }

  const baseProps = (props ?? {}) as ButtonElementProps & Record<string, unknown>;
  const { asChild, children, className, type, ...restProps } = baseProps;
  const cleanProps: Record<string, unknown> = { ...restProps };

  if ("variant" in cleanProps) {
    delete cleanProps.variant;
  }

  if (asChild && isValidElement(children)) {
    return cloneElement(children as any, {
      ...(cleanProps as any),
      className: cn((children as any).props?.className, className),
    } as any);
  }

  return (
    <button {...cleanProps} className={className} type={type ?? "button"}>
      {children}
    </button>
  );
}
