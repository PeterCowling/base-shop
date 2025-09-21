"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function CampaignFilter({ campaigns }: { campaigns: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.getAll("campaign");

  return (
    <select
      multiple
      className="mb-4 rounded-md border border-input bg-background p-1"
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("campaign");
        const values = Array.from(e.target.selectedOptions).map((o) => o.value);
        for (const v of values) {
          if (v) params.append("campaign", v);
        }
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      {campaigns.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
