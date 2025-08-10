import Link from "next/link";
import * as React from "react";
import { cn } from "../../utils/style";

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs sm:text-sm",
        className
      )}
      {...props}
    >
      {items.map((item, idx) => {
        const last = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && <span>/</span>}
            {item.href && !last ? (
              <Link
                href={item.href}
                className={cn(
                  "capitalize hover:underline",
                  "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span className="capitalize">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

Breadcrumbs.displayName = "Breadcrumbs";

export default Breadcrumbs;
