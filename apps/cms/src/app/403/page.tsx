// apps/cms/src/app/403/page.tsx

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AccessDenied() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");
  const href = shop ? `/cms/${shop}/products` : "/products";

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-red-600">403 – Access denied</h1>
      <p className="text-muted-foreground text-sm">
        You don’t have permission to perform this action.
      </p>
      <Link
        href={href}
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white"
      >
        Back to catalogue
      </Link>
    </div>
  );
}
