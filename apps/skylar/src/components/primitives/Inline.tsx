import type { HTMLAttributes } from "react";

const classes = (...args: Array<string | undefined | boolean | null>) =>
  args.filter((item) => Boolean(item)).join(" ");

type InlineProps = HTMLAttributes<HTMLElement> & {
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  alignY?: "start" | "center" | "end" | "baseline";
  wrap?: boolean;
};

export function Inline({
  gap = 3,
  alignY = "center",
  wrap = true,
  className,
  ...rest
}: InlineProps) {
  const alignClass =
    alignY === "start"
      ? "items-start"
      : alignY === "center"
      ? "items-center"
      : alignY === "end"
      ? "items-end"
      : "items-baseline";
  const gapClass = `gap-${gap}`;
  const wrapClass = wrap ? "flex-wrap" : "flex-nowrap";
  return (
    <div className={classes("flex", wrapClass, gapClass, alignClass, className)} {...rest} />
  );
}
