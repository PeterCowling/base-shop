/**
 * Breadcrumb Navigation Component
 * Shows navigation path with clickable links and current page indicator
 * BOS-UX-03
 */

/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind, ds/container-widths-only-at -- BOS-UX-03: Phase 0 scaffold UI */
"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {/* Separator before each item except first */}
              {index > 0 && (
                <span className="mx-2 text-muted-foreground/50" aria-hidden="true">
                  /
                </span>
              )}

              {/* Link or plain text depending on href presence */}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
