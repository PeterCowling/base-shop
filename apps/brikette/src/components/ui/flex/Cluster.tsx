// src/components/ui/flex/Cluster.tsx
import clsx from "clsx";
import type { ComponentPropsWithoutRef, ElementType } from "react";

import type { PolymorphicProps } from "./types";

export function Cluster<T extends ElementType = "div">({
  as,
  className,
  ...rest
}: PolymorphicProps<T>): JSX.Element {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={clsx("flex", "flex-wrap", "gap-2", className)}
      {...(rest as ComponentPropsWithoutRef<T>)}
    />
  );
}
