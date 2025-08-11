"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.elements as any;
    const customerId = (form.namedItem("customerId") as HTMLInputElement).value;
    const token = (form.namedItem("token") as HTMLInputElement).value;
    const password = (form.namedItem("password") as HTMLInputElement).value;
    const csrfToken =
      typeof document !== "undefined"
        ? document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") ??
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
        : undefined;
    const res = await fetch("/api/account/reset/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ customerId, token, password }),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="customerId" placeholder="Customer ID" className="border p-1" />
      <input name="token" placeholder="Token" className="border p-1" />
      <input
        name="password"
        type="password"
        placeholder="New password"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">
        Reset password
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
