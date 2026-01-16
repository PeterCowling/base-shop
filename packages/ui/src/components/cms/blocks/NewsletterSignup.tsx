"use client";

import { NewsletterForm } from "./molecules";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";
import { resolveText } from "@acme/i18n/resolveText";

interface Props {
  /** API endpoint to submit the email to */
  action?: string;
  /** Placeholder text for the email input */
  placeholder?: TranslatableText;
  /** Label for the submit button */
  submitLabel?: TranslatableText;
  /** Optional text displayed above the form */
  text?: TranslatableText;
  /** Current locale for resolving inline values */
  locale?: Locale;
}

export default function NewsletterSignup({ action, placeholder, submitLabel, text, locale = "en" }: Props) {
  const tNode = useTranslations();
  const t = (key: string, params?: Record<string, unknown>): string => {
    const result = tNode(key, params as never);
    return typeof result === "string" ? result : String(result ?? "");
  };

  const resolveMaybe = (v?: TranslatableText, fallback = ""): string => {
    if (!v) return fallback;
    if (typeof v === "string") return v;
    if (v.type === "key") return t(v.key, v.params);
    if (v.type === "inline") return resolveText(v, locale, t);
    return fallback;
  };
  // Prefer shared keys for defaults instead of literals
  const ph = resolveMaybe(placeholder, t("newsletter.placeholder"));
  const submit = resolveMaybe(submitLabel, t("newsletter.subscribe"));
  const heading = resolveMaybe(text);
  return (
    <div className="space-y-2">
      {heading && <p data-token="--color-fg">{heading}</p>}
      <NewsletterForm action={action} placeholder={ph} submitLabel={submit} />
    </div>
  );
}
