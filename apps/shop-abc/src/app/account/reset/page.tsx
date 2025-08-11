"use client";

import { useState } from "react";
import type { ResetCompleteInput } from "../api/account/reset/complete/route";

export default function ResetPasswordPage() {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.elements as any;
    const token = (form.namedItem("token") as HTMLInputElement).value;
    const password = (form.namedItem("password") as HTMLInputElement).value;
    const body: ResetCompleteInput = { token, password };
    const res = await fetch("/api/account/reset/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
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
