"use client";

import { useState } from "react";
import { getCsrfToken } from "@shared-utils";
import type { LoginInput } from "../api/login/route";

export default function LoginPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body: LoginInput = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement)
        .value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      remember: (form.elements.namedItem("remember") as HTMLInputElement)?.checked ?? false,
    };
    const csrfToken = getCsrfToken();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Logged in" : data.error || "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="customerId" placeholder="User ID" className="border p-1" />
      <input name="password" type="password" placeholder="Password" className="border p-1" />
      <label className="flex items-center gap-1">
        <input name="remember" type="checkbox" />
        <span>Remember me</span>
      </label>
      <button
        type="submit"
        className="inline-flex min-h-11 min-w-11 items-center justify-center border px-4"
      >
        Login
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
