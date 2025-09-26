"use client";

import * as React from "react";

export interface DSARSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: string;
  explanation?: string;
  adapter?: (req: { type: "export" | "delete"; email: string }) => Promise<{ ok: boolean; message?: string }>;
}

export default function DSARSection({ headline = "Data requests", explanation = "You can request a copy of your personal data or ask us to delete it.", adapter, className, ...rest }: DSARSectionProps) {
  const [type, setType] = React.useState<"export" | "delete">("export");
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adapter) return;
    setStatus("loading");
    try {
      const res = await adapter({ type, email });
      setStatus(res.ok ? "ok" : "error");
      setMessage(res.message);
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
      setMessage("Could not submit request.");
    }
  };

  return (
    <section className={className} {...rest}>
      <div className="mx-auto max-w-xl space-y-4">
        <h2 className="text-xl font-semibold">{headline}</h2>
        <p className="text-sm text-neutral-700">{explanation}</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" name="dsar" value="export" checked={type === "export"} onChange={() => setType("export")} />
              Export my data
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="dsar" value="delete" checked={type === "delete"} onChange={() => setType("delete")} />
              Delete my data
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="dsar-email">Email</label>
            <input id="dsar-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={!adapter || status === "loading"} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
            {type === "export" ? "Request export" : "Request deletion"}
          </button>
        </form>
        {status === "loading" ? <div className="text-xs text-neutral-600">Sending…</div> : null}
        {status === "ok" ? <div className="text-xs text-emerald-700">Request received{message ? ` — ${message}` : ""}</div> : null}
        {status === "error" ? <div className="text-xs text-red-600">Error submitting request{message ? ` — ${message}` : ""}</div> : null}
      </div>
    </section>
  );
}

