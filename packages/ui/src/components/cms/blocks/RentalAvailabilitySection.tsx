"use client";

import React from "react";
import { getAvailability } from "@acme/platform-core/rental/availability";

const t = (s: string) => s;

export interface RentalAvailabilitySectionProps extends React.HTMLAttributes<HTMLDivElement> {
  sku: string;
  locationId?: string;
}

export default function RentalAvailabilitySection({ sku, locationId, className, ...rest }: RentalAvailabilitySectionProps) {
  const [start, setStart] = React.useState<string>("");
  const [end, setEnd] = React.useState<string>("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [result, setResult] = React.useState<{ available: boolean; blocks: string[]; capacity?: number } | null>(null);

  const disabled = !start || !end;

  const check = async () => {
    if (disabled) return;
    setStatus("loading");
    try {
      const data = await getAvailability(sku, { start, end }, locationId);
      setResult(data);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  };

  const notConfigured = result && result.blocks.length === 0 && status === "loaded" && result.available === false;

  return (
    <div className={className} {...rest}>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div>
            <label className="block text-sm">{t("Start")}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border px-2 py-1 min-h-10" />
          </div>
          <div>
            <label className="block text-sm">{t("End")}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border px-2 py-1 min-h-10" />
          </div>
          <div className="self-end">
            <button type="button" onClick={check} disabled={disabled} className="rounded bg-black px-3 py-1 text-white disabled:opacity-50 min-h-10 min-w-10">{t("Check")}</button>
          </div>
        </div>
        {status === "loading" && <p className="text-sm text-neutral-600">{t("Checking availability…")}</p>}
        {status === "error" && <p className="text-sm text-red-600">{t("Failed to check availability.")}</p>}
        {status === "loaded" && result && (
          <div className="text-sm">
            <p>
              {t("Available:")} <strong>{String(result.available)}</strong>
              {result.capacity != null ? (
                <>
                  {" \u00B7 "}
                  {t("Capacity:")} {result.capacity}
                </>
              ) : null}
            </p>
            {notConfigured && <p className="text-neutral-600">{t("Availability provider not configured. This is a demo stub.")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
