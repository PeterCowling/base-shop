// src/components/ui/cta/PrimaryLinkButton.tsx
import clsx from "clsx";
import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type PrimaryLinkButtonProps = {
  to: LinkProps["to"];
  children: ReactNode;
  ariaLabel?: string | null;
  prefetch?: LinkProps["prefetch"];
  className?: string;
  tone?: "default" | "surface";
};

export function PrimaryLinkButton({
  to,
  children,
  ariaLabel,
  prefetch = "intent",
  className,
  tone = "default",
}: PrimaryLinkButtonProps): JSX.Element {
  return (
    <Link
      to={to}
      prefetch={prefetch}
      aria-label={ariaLabel || undefined}
      className={clsx(
        "rounded-full",
        "bg-brand-primary",
        "px-5",
        "py-2",
        "text-sm",
        "font-semibold",
        "text-brand-bg",
        "transition",
        "hover:bg-brand-secondary",
        "hover:text-brand-heading",
        "focus-visible:outline",
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-brand-outline",
        tone === "surface" ? "dark:bg-brand-surface" : "dark:bg-brand-heading",
        "dark:text-brand-primary",
        "dark:hover:bg-brand-secondary/20",
        "dark:hover:text-brand-primary",
        "dark:focus-visible:outline-brand-heading",
        className,
      )}
    >
      {children}
    </Link>
  );
}
