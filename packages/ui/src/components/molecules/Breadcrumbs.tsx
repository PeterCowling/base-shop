import Link from "next/link";
import * as React from "react";
import { cn } from "../../utils/style";
import { Inline } from "../atoms/primitives/Inline";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

// i18n-exempt: CSS utility classes only
const NAV_CLASSES = "text-xs sm:text-sm"; // i18n-exempt: CSS classes
const LINK_CLASSES = "capitalize hover:underline"; // i18n-exempt: CSS classes

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav className={cn(NAV_CLASSES, className)} {...props}>
      <Inline gap={1} alignY="center">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <Inline key={idx} gap={1} alignY="center" className="whitespace-nowrap">
              {idx > 0 && (
                // i18n-exempt: symbolic separator
                <span aria-hidden="true">/</span>
              )}
              {item.href && !last ? (
                <Link href={item.href} className={cn(LINK_CLASSES, "text-muted-foreground")}>
                  {item.label}
                </Link>
              ) : (
                // Labels are provided by callers; not hardcoded here
                <span className="capitalize">{item.label}</span>
              )}
            </Inline>
          );
        })}
      </Inline>
    </nav>
  );
}

Breadcrumbs.displayName = "Breadcrumbs";

export default Breadcrumbs;
