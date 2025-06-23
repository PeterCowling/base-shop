// packages/ui/components/cms/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { cn } from "../../utils/cn";

function BreadcrumbsInner() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean); // ["products","123","edit"]

  let href = "";
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm">
      {parts.map((part, idx) => {
        href += `/${part}`;
        const last = idx === parts.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            {idx > 0 && <span>/</span>}
            {last ? (
              <span className="capitalize">{part}</span>
            ) : (
              <Link
                href={href}
                className={cn(
                  "capitalize hover:underline",
                  "text-muted-foreground"
                )}
              >
                {part}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default memo(BreadcrumbsInner);
