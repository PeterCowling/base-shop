"use client";

import { getShopFromPath, replaceShopInPath } from "@acme/shared-utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/shadcn";

export default function ShopSelector() {
  const [shops, setShops] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pathname = usePathname() ?? "";
  const router = useRouter();
  // No theme tracking needed here; shadcn Select is fully styled.

  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch("/api/shops");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setShops(data);
            setStatus("ready");
            return;
          }
          setErrorMsg("Invalid response");
        } else {
          const json = await res.json().catch(() => ({}));
          setErrorMsg(json.error ?? `Error ${res.status}`);
        }
        setStatus("error");
      } catch (err) {
        console.error("Error loading shops", err);
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to load shops"
        );
        setStatus("error");
        setShops([]);
      }
    }
    fetchShops();
  }, []);

  const selected = getShopFromPath(pathname);

  function changeShop(value: string) {
    const search = typeof window === "undefined" ? "" : window.location.search;
    const newPath = replaceShopInPath(pathname, value);
    router.push(`${newPath}${search}`);
  }

  if (status === "loading")
    return <span className="text-sm">Loading shops…</span>;
  if (status === "error")
    return (
      <span className="text-sm text-danger" data-token="--color-danger">
        {errorMsg ?? "Failed to load shops"}
      </span>
    );
  if (shops.length === 0)
    return (
      <span className="text-muted-foreground text-sm">No shops found.</span>
    );

  return (
    <Select
      value={selected ?? ""}
      onValueChange={(v) => changeShop(v)}
      data-cy="shop-select"
    >
      <SelectTrigger
        data-cy="shop-select"
        aria-label="Shop"
        className="w-36"
      >
        <SelectValue placeholder="Select shop" />
      </SelectTrigger>
      <SelectContent>
        {shops.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
