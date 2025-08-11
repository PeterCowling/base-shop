"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCsrfToken } from "@shared-utils";
import type { LoginInput } from "./route";

export default function LoginPage() {
  const [msg, setMsg] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body: LoginInput = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement)
        .value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };
    const csrfToken = getCsrfToken();
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = callbackUrl ?? "/account";
      return;
    }
    setMsg(data.error || "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="customerId" placeholder="User ID" className="border p-1" />
      <input
        name="password"
        type="password"
        placeholder="Password"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">
        Login
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
