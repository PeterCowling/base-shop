"use client";

import { useState } from "react";

export default function PasswordResetRequestPage() {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Check your email for a reset link" : data.error || "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">
        Send reset link
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
