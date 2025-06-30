"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms-shadcn";

export default function ShopSelector() {
  const [shops, setShops] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const pathname = usePathname() ?? "";
  const router = useRouter();

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
        }
        setStatus("error");
      } catch {
        setStatus("error");
        setShops([]);
      }
    }
    fetchShops();
  }, []);

  const segments = pathname.split("/");
  const shopIndex = segments.indexOf("shop");
  const selected = shopIndex >= 0 ? segments[shopIndex + 1] : undefined;

  function changeShop(value: string) {
    const next = [...segments];
    if (shopIndex >= 0) {
      next[shopIndex + 1] = value;
    } else {
      const cmsIndex = segments.indexOf("cms");
      if (cmsIndex >= 0) {
        next.splice(cmsIndex + 1, 0, "shop", value);
      } else {
        next.push("cms", "shop", value);
      }
    }
    const path = next.join("/") || "/";
    router.push(path);
  }

  if (status === "loading")
    return <span className="text-sm">Loading shops…</span>;
  if (status === "error")
    return <span className="text-sm text-red-600">Failed to load shops</span>;

  if (shops.length === 0) return null;

  return (
    <Select value={selected} onValueChange={changeShop}>
      <SelectTrigger className="w-36">
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
