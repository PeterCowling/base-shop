// src/components/ui/flex/Inline.tsx
import type { ComponentPropsWithoutRef, ElementType } from "react";
import clsx from "clsx";

import type { PolymorphicProps } from "./types";

export function Inline<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: PolymorphicProps<T>): JSX.Element {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={clsx("inline-flex", "items-center", className)}
      {...(rest as ComponentPropsWithoutRef<T>)}
    />
  );
}
