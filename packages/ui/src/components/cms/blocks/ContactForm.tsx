"use client";

import { useTranslations } from "@acme/i18n";

export default function ContactForm({
  action = "#",
  method = "post",
}: {
  action?: string;
  method?: string;
}) {
  const t = useTranslations();
  return (
    <form className="space-y-2" action={action} method={method}>
      <input
        type="text"
        name="name"
        placeholder={String(t("contact.name"))}
        className="w-full rounded border p-2 min-h-10"
      />
      <input
        type="email"
        name="email"
        placeholder={String(t("contact.email"))}
        className="w-full rounded border p-2 min-h-10"
      />
      <textarea
        name="message"
        placeholder={String(t("contact.message"))}
        className="w-full rounded border p-2 min-h-10"
      />
      <button
        type="submit"
        className="rounded bg-primary px-4 py-2 text-primary-fg min-h-10 min-w-10"
      >
        {t("contact.submit")}
      </button>
    </form>
  );
}
