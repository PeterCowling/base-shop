"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";

export interface DSARSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: string;
  explanation?: string;
  adapter?: (req: { type: "export" | "delete"; email: string }) => Promise<{ ok: boolean; message?: string }>;
}

export default function DSARSection({ headline, explanation, adapter, className, ...rest }: DSARSectionProps) {
  const t = useTranslations();
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
      setMessage(t("dsar.submit.errorMessage") as string);
    }
  };

  return (
    <section className={className} {...rest}>
      <div className="mx-auto w-full space-y-4">
        <h2 className="text-xl font-semibold">{headline ?? t("dsar.headline")}</h2>
        <p className="text-sm text-muted-foreground">{explanation ?? t("dsar.explanation")}</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="dsar"
                value="export"
                checked={type === "export"}
                onChange={() => setType("export")}
                className="min-h-10 min-w-10"
              />
              {t("dsar.export")}
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="dsar"
                value="delete"
                checked={type === "delete"}
                onChange={() => setType("delete")}
                className="min-h-10 min-w-10"
              />
              {t("dsar.delete")}
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="dsar-email">{t("dsar.email")}</label>
            <input
              id="dsar-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-10 min-w-10 rounded border px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!adapter || status === "loading"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded bg-foreground px-4 text-foreground disabled:opacity-50"
          >
            {type === "export" ? t("dsar.submit.export") : t("dsar.submit.delete")}
          </button>
        </form>
        {status === "loading" ? <div className="text-xs text-muted-foreground">{t("dsar.sending")}</div> : null}
        {status === "ok" ? <div className="text-xs text-primary">{t("dsar.ok")} {message ? `— ${message}` : ""}</div> : null}
        {status === "error" ? <div className="text-xs text-destructive">{t("dsar.error")} {message ? `— ${message}` : ""}</div> : null}
      </div>
    </section>
  );
}
