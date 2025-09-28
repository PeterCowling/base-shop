// packages/ui/src/components/atoms/primitives/Cover.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  minH?: "screen" | "[60vh]" | "[80vh]";
  center?: ReactNode;
};

export function Cover({ minH = "screen", center, className, children, style: _style, ...rest }: Props) {
  const minHClass =
    minH === "screen" ? "min-h-screen" : minH === "[80vh]" ? "min-h-[80vh]" : minH === "[60vh]" ? "min-h-[60vh]" : "";
  return (
    <div className={cn("grid", minHClass, "grid-rows-[1fr_auto_1fr]", className)} {...rest}>
      <div />
      <div className="place-self-center w-full">{center ?? children}</div>
      <div />
    </div>
  );
}
