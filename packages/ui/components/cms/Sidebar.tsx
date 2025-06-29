// packages/ui/components/cms/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/");
  const shopIndex = segments.indexOf("shop");
  const shop = shopIndex >= 0 ? segments[shopIndex + 1] : null;

  const links = [
    { href: shop ? `/shop/${shop}` : "", label: "Dashboard", icon: "📊" },
    {
      href: shop ? `/products/shop/${shop}` : "/products",
      label: "Products",
      icon: "📦",
    },
    {
      href: shop ? `/pages/shop/${shop}` : "/pages",
      label: "Pages",
      icon: "📄",
    },
    {
      href: shop ? `/media/shop/${shop}` : "/media",
      label: "Media",
      icon: "🖼️",
    },
    {
      href: shop ? `/settings/shop/${shop}` : "/settings",
      label: "Settings",
      icon: "⚙️",
    },
    { href: "/live", label: "Live", icon: "🌐" },
    ...(role === "admin"
      ? [
          {
            href: "/rbac",
            label: "RBAC",
            icon: "🛡️",
            title: "Manage user roles",
          },
          {
            href: "/wizard",
            label: "Create Shop",
            icon: "🛍️",
            title: "Create a new shop",
          },
        ]
      : []),
  ];

  const dashboardBase = shop ? `/cms/shop/${shop}` : "/cms";
  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800">
      <h1 className="px-4 py-6 text-lg font-semibold tracking-tight">CMS</h1>
      <nav className="flex flex-col gap-1 px-2">
        {links.map(({ href, label, icon, title }) => {
          const fullHref = `/cms${href}`;
          const altHref =
            shop && href.includes(`/shop/${shop}`)
              ? `/cms/shop/${shop}${href.replace(`/shop/${shop}`, "")}`
              : null;
          const active =
            href === ""
              ? pathname === dashboardBase
              : pathname.startsWith(fullHref) ||
                (altHref ? pathname.startsWith(altHref) : false);
          return (
            <Link
              key={href}
              href={fullHref}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? "bg-primary/10 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800"} `}
              title={title}
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
