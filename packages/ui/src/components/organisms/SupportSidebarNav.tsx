import * as React from "react";
import Link from "next/link";

import { cn } from "../../utils/style";

export type SupportSidebarNavVariant = "pill" | "underline";

export interface SupportSidebarNavItem {
  href: string;
  label: React.ReactNode;
  rel?: string;
  target?: string;
}

export interface SupportSidebarNavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  activeHref?: string;
  items: SupportSidebarNavItem[];
  title?: React.ReactNode;
  variant?: SupportSidebarNavVariant;
  sticky?: boolean;
}

function resolveTarget(href: string, target?: string) {
  if (target) return target;
  return href.startsWith("http") ? "_blank" : undefined;
}

function resolveRel(href: string, rel?: string) {
  if (rel) return rel;
  return href.startsWith("http") ? "noreferrer noopener" : undefined;
}

export function SupportSidebarNav({
  activeHref,
  className,
  items,
  title,
  variant = "pill",
  sticky,
  ...props
}: SupportSidebarNavProps) {
  const shouldStick = sticky ?? variant === "pill";
  const rootClassName =
    variant === "pill"
      ? "space-y-3"
      : "space-y-2 text-sm uppercase tracking-wide text-foreground";
  const titleClassName =
    variant === "pill"
      ? "text-sm font-semibold text-muted-foreground"
      : "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  return (
    <aside
      className={cn(
        shouldStick ? "sticky top-28" : undefined,
        rootClassName,
        className,
      )}
      {...props}
    >
      {title ? <div className={titleClassName}>{title}</div> : null}
      <div className={cn(variant === "pill" ? "flex flex-col gap-2" : undefined)}>
        {items.map((item) => {
          const isActive = item.href === activeHref;
          if (variant === "underline") {
            return (
              <div key={item.href} className="leading-relaxed">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  target={resolveTarget(item.href, item.target)}
                  rel={resolveRel(item.href, item.rel)}
                  className={cn(
                    "text-base font-medium normal-case underline",
                    isActive ? "text-foreground" : undefined,
                  )}
                >
                  {item.label}
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              target={resolveTarget(item.href, item.target)}
              rel={resolveRel(item.href, item.rel)}
              className={cn(
                "rounded border px-3 py-2 text-sm hover:border-foreground hover:text-foreground",
                isActive ? "border-foreground text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

