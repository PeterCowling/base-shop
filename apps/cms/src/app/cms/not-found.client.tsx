"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CmsNotFound() {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const shopIndex = segments.indexOf("shop");
  const shop = shopIndex >= 0 ? segments[shopIndex + 1] : null;
  const href = shop ? `/cms/shop/${shop}` : "/cms";
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">404 – Page not found</h1>
      <Link
        href={href}
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-primary-foreground"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
