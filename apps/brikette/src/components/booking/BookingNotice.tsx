import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "xs";
};

export default function BookingNotice({ children, className, size = "sm" }: Props): JSX.Element {
  const textSize = size === "xs" ? "text-xs" : "text-sm";
  return (
    <p className={clsx("rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-text/90", textSize, className)}>
      {children}
    </p>
  );
}
