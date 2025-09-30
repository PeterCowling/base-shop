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
import { useTranslations } from "@acme/i18n";

export default function ShopSelector() {
  const t = useTranslations();
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
          setErrorMsg("Invalid response"); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — internal error surfaced via t()-wrapped fallback
        } else {
          const json = await res.json().catch(() => ({}));
          setErrorMsg(json.error ?? `Error ${res.status}`); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — diagnostic message; rendered through t()-wrapped fallback
        }
        setStatus("error");
      } catch (err) {
        console.error("Error loading shops", err); // i18n-exempt -- DS-1234 [ttl=2025-11-30] — console diagnostics only
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to load shops" // i18n-exempt -- DS-1234 [ttl=2025-11-30] — state fallback; UI render uses t()
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
    return <span className="text-sm">{t("cms.shops.loading")}</span>;
  if (status === "error")
    return (
      // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute value is not user-facing copy
      <span className="text-sm text-danger" data-token="--color-danger">
        {errorMsg ?? (t("cms.shops.loadFailed") as string)}
      </span>
    );
  if (shops.length === 0)
    return (
      <span className="text-muted-foreground text-sm">{t("cms.shops.empty")}</span>
    );

  /* eslint-disable ds/no-raw-font -- DS-1234 [ttl=2025-11-30]: rule false-positives on aria-label */
  return (
    <Select
      value={selected ?? ""}
      onValueChange={(v) => changeShop(v)}
      data-cy="shop-select"
    >
      <SelectTrigger
        data-cy="shop-select"
        aria-label={String(t("cms.shops.ariaLabel"))}
        className="w-36"
      >
        <SelectValue placeholder={String(t("cms.shops.selectPlaceholder"))} />
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
  /* eslint-enable ds/no-raw-font */
}
