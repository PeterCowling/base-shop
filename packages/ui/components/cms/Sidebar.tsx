"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/media", label: "Media", icon: "🖼️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800">
      <h1 className="px-4 py-6 text-lg font-semibold tracking-tight">CMS</h1>
      <nav className="flex flex-col gap-1 px-2">
        {links.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm
                ${active ? "bg-primary/10 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800"}
              `}
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
