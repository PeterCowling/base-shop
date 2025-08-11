"use client";

import { useState } from "react";
import type { LoginRequest } from "./route";

export default function LoginPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body: LoginRequest = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };
    let csrfToken =
      typeof document !== "undefined"
        ? document.cookie
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
    const res = await fetch("/login", {
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
      <button type="submit" className="border px-2 py-1">Login</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
