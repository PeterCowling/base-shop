"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stack } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";

type NavLinkProps = {
  href: string;
  label: string;
  description: string;
  compact?: boolean;
};

export default function NavLink({
  href,
  label,
  description,
  compact = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "min-h-12",
        "min-w-12",
        "rounded-2xl",
        "border",
        "px-4",
        "py-3",
        "transition",
        isActive
          ? [
              "border-transparent",
              "bg-primary",
              "text-primary-foreground",
              "shadow-elevation-2",
            ]
          : [
              "border-transparent",
              "bg-surface-1",
              "text-foreground",
              "hover:border-border-2",
            ],
        compact ? "w-auto" : "w-full"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Stack gap={1}>
        <div className="text-sm font-semibold tracking-wide">{label}</div>
        {!compact && (
          <div
            className={cn(
              "text-xs",
              isActive ? "text-primary-foreground/80" : "text-foreground/60"
            )}
          >
            {description}
          </div>
        )}
      </Stack>
    </Link>
  );
}
