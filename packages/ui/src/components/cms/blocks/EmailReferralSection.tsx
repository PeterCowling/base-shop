"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { resolveText } from "@i18n/resolveText";

export interface EmailReferralSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  headline?: TranslatableText;
  subtitle?: TranslatableText;
  giveLabel?: TranslatableText; // e.g., "$10 for your friend"
  getLabel?: TranslatableText; // e.g., "$10 for you"
  termsHref?: string;
  locale?: Locale;
  /** Adapter to submit referral. Receive { email, friendEmail }. */
  adapter?: (payload: { email: string; friendEmail: string }) => Promise<{ ok: boolean; message?: string }>;
}

export default function EmailReferralSection({ headline, subtitle, giveLabel, getLabel, termsHref, adapter, locale = "en", className, ...rest }: EmailReferralSectionProps) {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  const [email, setEmail] = React.useState("");
  const [friend, setFriend] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState<string | undefined>(undefined);
  const resolveMaybe = (v?: TranslatableText, fallbackKey?: string): string => {
    if (!v) return fallbackKey ? (t(fallbackKey) as string) : "";
    if (typeof v === "string") return v;
    if (v.type === "key") return t(v.key, v.params) as string;
    if (v.type === "inline") return resolveText(v, locale, t);
    return fallbackKey ? (t(fallbackKey) as string) : "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adapter) return;
    setStatus("loading");
    try {
      const res = await adapter({ email, friendEmail: friend });
      setStatus(res.ok ? "ok" : "error");
      setMessage(res.message);
      if (res.ok) { setEmail(""); setFriend(""); }
    } catch {
      setStatus("error");
      setMessage(t("referral.submit.errorMessage") as string);
    }
  };

  return (
    <section className={["bg-neutral-50", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="mx-auto flex flex-col items-center gap-4 px-4 py-8 text-center">
        <h2 className="text-2xl font-semibold">{resolveMaybe(headline, "referral.headline")}</h2>
        <p className="text-neutral-700">{resolveMaybe(subtitle, "referral.subtitle")}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">{resolveMaybe(giveLabel, "referral.give")}</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">{resolveMaybe(getLabel, "referral.get")}</span>
        </div>
        <form onSubmit={submit} className="mt-2 flex w-full flex-col items-stretch gap-2 sm:flex-row">
          <input
            type="email"
            required
            placeholder={t("referral.email.placeholder") as string}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-h-10 min-w-10 rounded border px-3"
          />
          <input
            type="email"
            required
            placeholder={t("referral.friend.placeholder") as string}
            value={friend}
            onChange={(e) => setFriend(e.target.value)}
            className="flex-1 min-h-10 min-w-10 rounded border px-3"
          />
          <button
            type="submit"
            disabled={!adapter || status === "loading"}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded bg-black px-4 text-white disabled:opacity-50"
          >
            {t("referral.submit")}
          </button>
        </form>
        {termsHref ? (
          <a href={termsHref} className="inline-flex min-h-10 min-w-10 items-center text-xs text-neutral-600 underline">{t("referral.terms")}</a>
        ) : null}
        {status === "loading" ? <div className="text-xs text-neutral-600">{t("referral.sending")}</div> : null}
        {status === "ok" ? <div className="text-xs text-emerald-700">{t("referral.ok")} {message ? `— ${message}` : ""}</div> : null}
        {status === "error" ? <div className="text-xs text-red-600">{t("referral.error")} {message ? `— ${message}` : ""}</div> : null}
      </div>
    </section>
  );
}
