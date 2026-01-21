"use client";

import { useState } from "react";

import { useTranslations } from "@acme/i18n";

export default function ContactForm({
  action = "/api/leads",
  method = "post",
}: {
  action?: string;
  method?: string;
}) {
  const t = useTranslations();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = {
      type: "contact",
      name: (form.elements.namedItem("name") as HTMLInputElement)?.value ?? "",
      email: (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "",
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)?.value ?? "",
    };
    try {
      const res = await fetch(action, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="space-y-2" action={action} method={method} onSubmit={handleSubmit}>
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
      {status === "ok" && <p role="status">{t("newsletter.submit.success")}</p>}
      {status === "error" && <p role="status">{t("newsletter.submit.error")}</p>}
    </form>
  );
}
