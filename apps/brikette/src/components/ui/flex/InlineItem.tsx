// src/components/ui/flex/InlineItem.tsx
import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { PolymorphicProps } from "./types";

export function InlineItem<T extends ElementType = "li">({
  as,
  className,
  ...rest
}: PolymorphicProps<T>): JSX.Element {
  const Component = (as ?? "li") as ElementType;

  return (
    <Component
      className={clsx("flex", "items-start", className)}
      {...(rest as ComponentPropsWithoutRef<T>)}
    />
  );
}
