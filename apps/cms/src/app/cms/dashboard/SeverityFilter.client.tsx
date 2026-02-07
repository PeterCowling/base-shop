"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SeverityFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const severity = searchParams.get("severity") ?? "all";

  const setSeverity = (next: "all" | "broken") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("severity");
    } else {
      params.set("severity", next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span>Filter:</span>
      <button
        type="button"
        className={`rounded-full px-2 py-1 border ${
          severity === "all"
            ? "border-primary text-primary"
            : "border-border text-foreground"
        }`}
        onClick={() => setSeverity("all")}
      >
        All issues
      </button>
      <button
        type="button"
        className={`rounded-full px-2 py-1 border ${
          severity === "broken"
            ? "border-primary text-primary"
            : "border-border text-foreground"
        }`}
        onClick={() => setSeverity("broken")}
      >
        Broken only
      </button>
    </div>
  );
}

