"use client";

import * as React from "react";

export interface RentalManageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  rentalId?: string;
  adapter?: (req: { action: "extend" | "return"; rentalId?: string; newReturnDate?: string }) => Promise<{ ok: boolean; message?: string }>;
}

export default function RentalManageSection({ rentalId, adapter, className, ...rest }: RentalManageSectionProps) {
  const [date, setDate] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const doExtend = async () => {
    if (!adapter) return;
    setStatus("loading");
    try {
      const res = await adapter({ action: "extend", rentalId, newReturnDate: date });
      setStatus(res.ok ? "ok" : "error");
      setMessage(res.message);
    } catch {
      setStatus("error"); setMessage("Could not extend rental.");
    }
  };
  const doReturn = async () => {
    if (!adapter) return;
    setStatus("loading");
    try {
      const res = await adapter({ action: "return", rentalId });
      setStatus(res.ok ? "ok" : "error");
      setMessage(res.message);
    } catch {
      setStatus("error"); setMessage("Could not start return.");
    }
  };

  return (
    <section className={className} {...rest}>
      <div className="mx-auto max-w-xl space-y-3">
        <h3 className="text-lg font-semibold">Manage rental</h3>
        <div className="space-y-1">
          <label className="text-sm">New return date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-60 rounded border px-2 py-1" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={doExtend} disabled={!adapter || !date || status === "loading"} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Extend</button>
          <button type="button" onClick={doReturn} disabled={!adapter || status === "loading"} className="rounded border px-3 py-1 text-sm disabled:opacity-50">Start return</button>
        </div>
        {status === "loading" ? <div className="text-xs text-neutral-600">Working…</div> : null}
        {status === "ok" ? <div className="text-xs text-emerald-700">Success{message ? ` — ${message}` : ""}</div> : null}
        {status === "error" ? <div className="text-xs text-red-600">Error{message ? ` — ${message}` : ""}</div> : null}
      </div>
    </section>
  );
}

