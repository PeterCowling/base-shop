"use client";

import { useState } from "react";
import type { RegisterInput } from "./route";

export default function RegisterPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setMsg(
        "Password must be at least 8 characters and include uppercase, lowercase, and number",
      );
      return;
    }
    const body: RegisterInput = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password,
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
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Account created" : data.error || "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="customerId" placeholder="User ID" className="border p-1" />
      <input name="email" type="email" placeholder="Email" className="border p-1" />
      <input
        name="password"
        type="password"
        placeholder="Password"
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
        title="Password must be at least 8 characters and include uppercase, lowercase, and number"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">Register</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
