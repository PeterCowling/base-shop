/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy contact sidebar pending design/i18n overhaul */
import Link from "next/link";

import { customerServiceSidebarLinks } from "./content";

export function ContactUsSidebar({ activeHref }: { activeHref: string }) {
  return (
    <aside>
      <div className="sticky top-28 space-y-3">
        <div className="text-sm font-semibold text-muted-foreground">Customer Service</div>
        <div className="flex flex-col gap-2">
          {customerServiceSidebarLinks.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "rounded border px-3 py-2 text-sm hover:border-foreground hover:text-foreground",
                  isActive ? "border-foreground text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
