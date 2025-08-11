"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement)
      .value;
    let csrfToken =
      typeof document !== "undefined"
        ? document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ??
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
        : undefined;
    if (typeof document !== "undefined" && !csrfToken) {
      csrfToken = crypto.randomUUID();
      document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${
        location.protocol === "https:" ? "; secure" : ""
      }`;
    }
    const res = await fetch("/api/account/reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ email }),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "If the email exists, a token was sent." : "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="email" type="email" placeholder="Email" className="border p-1" />
      <button type="submit" className="border px-2 py-1">Send reset link</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
