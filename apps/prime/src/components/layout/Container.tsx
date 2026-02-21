import type { HTMLAttributes } from "react";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  const cls = ["mx-auto w-full max-w-6xl", className].filter(Boolean).join(" ");
  return <div className={cls} {...props} />;
}
