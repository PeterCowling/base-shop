import clsx from "clsx";
import type { JSX } from "react";

type SectionProps = JSX.IntrinsicElements["section"];

type GridProps = JSX.IntrinsicElements["div"];

export function Section({ className, ...props }: SectionProps): JSX.Element {
  const baseClass = ["mx-auto", "w-full", "px-4", "sm:px-6", "lg:px-8"];
  return <section className={clsx(baseClass, className)} {...props} />;
}

export function Grid({ className, ...props }: GridProps): JSX.Element {
  const baseClass = ["grid", "gap-4", "sm:grid-cols-2"];
  return <div className={clsx(baseClass, className)} {...props} />;
}
