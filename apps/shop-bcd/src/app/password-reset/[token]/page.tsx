"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "@i18n/Translations";

export default function PasswordResetPage() {
  const t = useTranslations();
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [msg, setMsg] = useState<ReactNode>("");

  if (!token) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const res = await fetch(`/api/password-reset/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? t("Password updated") : data.error || t("Error"));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        name="password"
        type="password"
        placeholder={String(t("New password"))}
        className="border p-2"
      />
      <button type="submit" className="border px-4 py-2 min-h-10 min-w-10 inline-flex items-center justify-center">
        {t("Reset password")}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
