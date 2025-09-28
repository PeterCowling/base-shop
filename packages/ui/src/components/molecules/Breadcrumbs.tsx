/* i18n-exempt file -- UI-000: Only non-user-facing literals (class names, separators, HTML attributes). Labels are provided via props. */
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

// i18n-exempt -- UI-000: CSS utility classes only
const NAV_CLASSES = "text-xs sm:text-sm"; // i18n-exempt -- UI-000: CSS classes
const LINK_CLASSES = "capitalize hover:underline"; // i18n-exempt -- UI-000: CSS classes

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  // Prefer stable keys from href or label, fall back to per-item map
  const keyMap = new WeakMap<BreadcrumbItem, string>();
  let auto = 0;
  const getKey = (item: BreadcrumbItem) => {
    if (item.href) return item.href;
    const fromLabel =
      typeof item.label === "string" || typeof item.label === "number"
        ? String(item.label)
        : undefined;
    if (fromLabel) return fromLabel;
    const existing = keyMap.get(item);
    if (existing) return existing;
    const k = `crumb-${auto++}`;
    keyMap.set(item, k);
    return k;
  };
  return (
    <nav className={cn(NAV_CLASSES, className)} {...props}>
      <Inline gap={1} alignY="center">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <Inline key={getKey(item)} gap={1} alignY="center" className="whitespace-nowrap">
              {idx > 0 && (
                // i18n-exempt -- UI-000: symbolic separator
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
