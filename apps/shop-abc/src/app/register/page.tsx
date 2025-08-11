"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [msg, setMsg] = useState("");
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Account created" : data.error || "Error");
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="customerId" placeholder="User ID" className="border p-1" />
      <input name="email" type="email" placeholder="Email" className="border p-1" />
      <input name="password" type="password" placeholder="Password" className="border p-1" />
      <button type="submit" className="border px-2 py-1">Register</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
