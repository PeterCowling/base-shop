"use client";

import * as React from "react";

export interface CertificateCheckProps extends React.HTMLAttributes<HTMLDivElement> {
  productId?: string;
  placeholder?: string;
  adapter?: (opts: { productId?: string; serial?: string }) => Promise<{ valid: boolean; message?: string }>;
}

export default function CertificateCheck({ productId, placeholder = "Enter serial / certificate #", adapter, className, ...rest }: CertificateCheckProps) {
  const [serial, setSerial] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const check = async () => {
    if (!adapter || !serial) return;
    setStatus("checking");
    try {
      const res = await adapter({ productId, serial });
      setStatus(res.valid ? "ok" : "fail");
      setMessage(res.message);
    } catch {
      setStatus("fail");
      setMessage("Verification failed. Try again later.");
    }
  };

  return (
    <div className={className} {...rest}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder={placeholder}
          className="w-60 rounded border px-2 py-1 text-sm"
        />
        <button type="button" onClick={check} disabled={!adapter || !serial} className="rounded border px-3 py-1 text-sm disabled:opacity-50">
          Verify
        </button>
      </div>
      {status === "checking" ? <p className="mt-2 text-xs text-neutral-600">Checking…</p> : null}
      {status === "ok" ? <p className="mt-2 text-xs text-green-600">Certificate valid{message ? ` — ${message}` : ""}</p> : null}
      {status === "fail" ? <p className="mt-2 text-xs text-red-600">Invalid certificate{message ? ` — ${message}` : ""}</p> : null}
    </div>
  );
}

