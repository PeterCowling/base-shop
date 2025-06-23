// packages/ui/components/cms/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { cn } from "../../utils/cn";

const NAV = [
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/media", label: "Media", icon: "🖼️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

function SidebarInner() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-muted/30 p-4 dark:border-gray-800">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">CMS</h1>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default memo(SidebarInner);
