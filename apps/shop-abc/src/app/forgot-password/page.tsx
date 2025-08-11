"use client";

import { useState } from "react";
import { getCsrfToken } from "@shared-utils";
import type { ResetRequestInput } from "../api/account/reset/request/route";

export default function ForgotPasswordPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;
    const csrfToken = getCsrfToken();
    const body: ResetRequestInput = { email };
    const res = await fetch("/api/account/reset/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "If the email exists, a reset link was sent." : "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="email" type="email" placeholder="Email" className="border p-1" />
      <button type="submit" className="border px-2 py-1">Send reset link</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
