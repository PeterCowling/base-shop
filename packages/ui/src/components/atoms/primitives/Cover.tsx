// packages/ui/src/components/atoms/primitives/Cover.tsx
import { cn } from "../../../utils/style/cn";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  minH?: "screen" | "[60vh]" | "[80vh]";
  center?: ReactNode;
};

export function Cover({ minH = "screen", center, className, children, ...rest }: Props) {
  const minHClass = minH === "screen" ? "min-h-screen" : "";
  const inlineStyle =
    minH === "[80vh]" ? { minHeight: "80vh" } : minH === "[60vh]" ? { minHeight: "60vh" } : undefined;
  const mergedStyle = { ...(inlineStyle ?? {}), ...(rest.style as React.CSSProperties | undefined) } as React.CSSProperties | undefined;
  return (
    <div className={cn("grid", minHClass, "grid-rows-[1fr_auto_1fr]", className)} {...rest} style={mergedStyle}>
      <div />
      <div className="place-self-center w-full">{center ?? children}</div>
      <div />
    </div>
  );
}
