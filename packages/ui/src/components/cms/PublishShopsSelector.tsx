// packages/ui/src/components/cms/PublishShopsSelector.tsx
"use client";

import { Button, Input } from "../atoms/shadcn";
import { toggleItem } from "@acme/shared-utils";
import { memo, useCallback, useEffect, useState } from "react";

export interface PublishShopsSelectorProps {
  selectedIds: string[];
  onChange: (nextSelectedIds: string[]) => void;
  showReload?: boolean;
}

const equal = (
  p: PublishShopsSelectorProps,
  n: PublishShopsSelectorProps
) =>
  p.selectedIds === n.selectedIds &&
  p.onChange === n.onChange &&
  p.showReload === n.showReload;

function PublishShopsSelectorInner({
  selectedIds,
  onChange,
  showReload = false,
}: PublishShopsSelectorProps) {
  const [shops, setShops] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/shops");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) {
        setShops(data as string[]);
        setStatus("ready");
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("Error loading shops", err);
      setStatus("error");
      setShops([]);
      setErrorMsg(err instanceof Error ? err.message : "Failed to load shops");
    }
  }, []);

  useEffect(() => {
    void fetchShops();
  }, [fetchShops]);

  const toggle = useCallback(
    (id: string) => {
      onChange(toggleItem(selectedIds, id));
    },
    [selectedIds, onChange]
  );

  if (status === "loading")
    return <span className="text-sm">Loading shops…</span>;
  if (status === "error")
    return (
      <span className="text-sm text-danger" data-token="--color-danger">
        {errorMsg ?? "Failed to load shops"}
      </span>
    );

  return (
    <>
      <div className="flex flex-col gap-2">
        {shops.map((id) => (
          <label
            key={id}
            className="flex cursor-pointer items-start gap-2 select-none"
          >
            <Input
              type="checkbox"
              checked={selectedIds.includes(id)}
              onChange={() => toggle(id)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="font-medium">{id}</span>
            </span>
          </label>
        ))}
        {shops.length === 0 && (
          <span className="text-muted-foreground text-sm">No shops found.</span>
        )}
      </div>

      {showReload && (
        <Button
          type="button"
          onClick={fetchShops}
          variant="outline"
          className="mt-4 inline-flex items-center rounded-2xl p-2 text-sm shadow"
        >
          Refresh list
        </Button>
      )}
    </>
  );
}

export default memo(PublishShopsSelectorInner, equal);

