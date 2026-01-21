// src/components/ui/cta/SecondaryLinkButton.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

type SecondaryLinkButtonProps = {
  to: string;
  children: ReactNode;
  ariaLabel?: string | null;
  prefetch?: boolean;
  className?: string;
};

export function SecondaryLinkButton({
  to,
  children,
  ariaLabel,
  prefetch = true,
  className,
}: SecondaryLinkButtonProps): JSX.Element {
  return (
    <Link
      href={to}
      prefetch={prefetch}
      aria-label={ariaLabel || undefined}
      className={clsx(
        "rounded-full",
        "border",
        "border-brand-outline/20",
        "px-5",
        "py-2",
        "text-sm",
        "font-semibold",
        "text-brand-heading",
        "transition",
        "hover:bg-brand-secondary/20",
        "focus-visible:outline",
        "focus-visible:outline-2",
        "focus-visible:outline-offset-2",
        "focus-visible:outline-brand-outline",
        "dark:border-brand-heading/60",
        "dark:text-brand-heading",
        "dark:hover:bg-brand-heading/15",
        "dark:focus-visible:outline-brand-heading",
        className,
      )}
    >
      {children}
    </Link>
  );
}
