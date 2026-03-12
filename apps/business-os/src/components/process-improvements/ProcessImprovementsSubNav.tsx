"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Inline } from "@acme/design-system/primitives/Inline";
import { cn } from "@acme/design-system/utils/style";

const tabs = [
  { href: "/process-improvements/new-ideas", label: "New Ideas" },
  { href: "/process-improvements/in-progress", label: "In Progress" },
];

export function ProcessImprovementsSubNav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-border bg-surface-1">
      <Inline gap={1} className="mx-auto w-full px-4 py-2 md:px-6" style={{ maxWidth: "88rem" }}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === tab.href
                ? "bg-surface-2 text-fg"
                : "text-muted hover:text-fg hover:bg-surface-2/60"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </Inline>
    </nav>
  );
}
