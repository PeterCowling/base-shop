// src/components/ui/flex/types.ts
import type { ComponentPropsWithoutRef, ElementType } from "react";

export type PolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;
