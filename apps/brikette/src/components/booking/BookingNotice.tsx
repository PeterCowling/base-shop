import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  size?: "sm" | "xs";
};

export default function BookingNotice({ children, className = "", size = "sm" }: Props): JSX.Element {
  const textSize = size === "xs" ? "text-xs" : "text-sm";
  return (
    <p className={`rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 ${textSize} text-brand-text/90 ${className}`.trim()}>
      {children}
    </p>
  );
}
