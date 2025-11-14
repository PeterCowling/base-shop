import type { HTMLAttributes } from "react";

type GridProps = HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
};

const classes = (...args: Array<string | undefined | boolean | null>) =>
  args.filter((item) => Boolean(item)).join(" ");

export function Grid({ cols = 1, gap = 4, className, ...rest }: GridProps) {
  return (
    <div
      className={classes(
        "grid",
        `grid-cols-${cols}`,
        `gap-${gap}`,
        className
      )}
      {...rest}
    />
  );
}
