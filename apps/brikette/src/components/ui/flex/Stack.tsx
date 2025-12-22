// src/components/ui/flex/Stack.tsx
import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { PolymorphicProps } from "./types";

export function Stack<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: PolymorphicProps<T>): JSX.Element {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={clsx("flex", "flex-col", className)}
      {...(rest as ComponentPropsWithoutRef<T>)}
    />
  );
}
