"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function CampaignFilter({ campaigns }: { campaigns: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = searchParams.get("campaign") ?? "";

  return (
    <select
      className="mb-4 rounded border p-1"
      value={selected}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        const value = e.target.value;
        if (value) {
          params.set("campaign", value);
        } else {
          params.delete("campaign");
        }
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <option value="">All campaigns</option>
      {campaigns.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

