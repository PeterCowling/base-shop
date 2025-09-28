"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";

export interface CertificateCheckProps extends React.HTMLAttributes<HTMLDivElement> {
  productId?: string;
  placeholder?: TranslatableText;
  locale?: Locale;
  adapter?: (opts: { productId?: string; serial?: string }) => Promise<{ valid: boolean; message?: string }>;
}

export default function CertificateCheck({ productId, placeholder, locale = "en", adapter, className, ...rest }: CertificateCheckProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const [serial, setSerial] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);
  const effectivePlaceholder = (() => {
    if (!placeholder) return t("cert.placeholder");
    if (typeof placeholder === "string") return placeholder;
    if (placeholder.type === "key") return t(placeholder.key, placeholder.params);
    if (placeholder.type === "inline") return resolveText(placeholder, locale, t);
    return t("cert.placeholder");
  })();

  const check = async () => {
    if (!adapter || !serial) return;
    setStatus("checking");
    try {
      const res = await adapter({ productId, serial });
      setStatus(res.valid ? "ok" : "fail");
      setMessage(res.message);
    } catch {
      setStatus("fail");
      setMessage(t("cert.verify.failed"));
    }
  };

  return (
    <div className={className} {...rest}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder={effectivePlaceholder}
          className="w-60 rounded border px-2 py-1 text-sm min-h-10"
        />
        <button type="button" onClick={check} disabled={!adapter || !serial} className="rounded border px-3 py-1 text-sm min-h-10 min-w-10 disabled:opacity-50">
          {t("actions.verify")}
        </button>
      </div>
      {status === "checking" ? <p className="mt-2 text-xs text-neutral-600">{t("cert.checking")}</p> : null}
      {status === "ok" ? <p className="mt-2 text-xs text-green-600">{t("cert.valid")}{message ? ` — ${message}` : ""}</p> : null}
      {status === "fail" ? <p className="mt-2 text-xs text-red-600">{t("cert.invalid")}{message ? ` — ${message}` : ""}</p> : null}
    </div>
  );
}
