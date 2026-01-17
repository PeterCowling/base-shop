"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "@acme/i18n/Translations";

export default function PasswordResetRequestPage() {
  const t = useTranslations();
  const [msg, setMsg] = useState<ReactNode>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? t("Check your email for a reset link") : data.error || t("Error"));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        name="email"
        type="email"
        placeholder={String(t("Email"))}
        className="border p-2"
      />
      <button type="submit" className="border px-4 py-2 min-h-11 min-w-11 inline-flex items-center justify-center">
        {t("Send reset link")}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
