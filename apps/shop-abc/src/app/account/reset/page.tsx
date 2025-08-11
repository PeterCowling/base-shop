"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCsrfToken } from "@shared-utils";
import type { ResetCompleteInput } from "../../api/account/reset/complete/route";

export default function ResetPasswordPage() {
  const [msg, setMsg] = useState("");
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.elements as any;
    const token = (form.namedItem("token") as HTMLInputElement).value;
    const password = (form.namedItem("password") as HTMLInputElement).value;
    const csrfToken = getCsrfToken();
    const body: ResetCompleteInput = { token, password };
    const res = await fetch("/api/account/reset/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input type="hidden" name="token" value={tokenParam} />
      <input
        name="password"
        type="password"
        placeholder="New password"
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
        title="Password must be at least 8 characters and include uppercase, lowercase, and number"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">
        Reset password
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
