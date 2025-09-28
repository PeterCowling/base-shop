// packages/ui/src/components/cms/PublishShopsSelector.tsx
"use client";

import { Button, Input } from "../atoms/shadcn";
import { toggleItem } from "@acme/shared-utils";
import { memo, useCallback, useEffect, useState } from "react";
import { Stack, Inline } from "../atoms/primitives";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
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
        // i18n-exempt -- ABC-123 [ttl=2026-03-31] developer error; not user-facing
        console.error("Invalid shops response shape", data);
        setStatus("error");
        setShops([]);
        setErrorMsg(null);
        return;
      }
    } catch (err) {
      console.error("Error loading shops", err); // i18n-exempt -- ABC-123 [ttl=2026-03-31] developer log
      setStatus("error");
      setShops([]);
      // Avoid user-facing hardcoded fallback; defer to i18n at render time
      setErrorMsg(err instanceof Error ? err.message : null);
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
    return <span className="text-sm">{t("shops.loading")}</span>;
  if (status === "error")
    return (
      // eslint-disable-next-line ds/no-hardcoded-copy -- ABC-123: design token reference is not UI copy
      <span className="text-sm text-danger" data-token="--color-danger">
        {errorMsg ?? (t("shops.loadFailed") as string)}
      </span>
    );

  return (
    <>
      <Stack gap={2}>
        {shops.map((id) => {
          const inputId = `shop_${id}`;
          return (
            <div key={id} className="cursor-pointer select-none">
              <Inline alignY="start" gap={2}>
                <Input
                  id={inputId}
                  type="checkbox"
                  checked={selectedIds.includes(id)}
                  onChange={() => toggle(id)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <label htmlFor={inputId} className="font-medium">
                    {id}
                  </label>
                </span>
              </Inline>
            </div>
          );
        })}
        {shops.length === 0 && (
          <span className="text-muted-foreground text-sm">{t("shops.noneFound")}</span>
        )}
      </Stack>

      {showReload && (
        <Button
          type="button"
          onClick={fetchShops}
          variant="outline"
          className="mt-4 rounded-2xl p-2 text-sm shadow"
        >
          {t("actions.refreshList")}
        </Button>
      )}
    </>
  );
}

export default memo(PublishShopsSelectorInner, equal);
