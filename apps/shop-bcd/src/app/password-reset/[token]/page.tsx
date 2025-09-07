"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function PasswordResetPage() {
  const { token } = useParams<{ token: string }>();
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const res = await fetch(`/api/password-reset/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : data.error || "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
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
