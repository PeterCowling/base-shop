"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = {
      token: (form.elements.namedItem("token") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };
    const res = await fetch("/api/account/reset/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : data.error || "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="token" placeholder="Reset token" className="border p-1" />
      <input name="password" type="password" placeholder="New password" className="border p-1" />
      <button type="submit" className="border px-2 py-1">Reset password</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
