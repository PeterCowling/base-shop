"use client";

import { useState, useEffect } from "react";
import { getCsrfToken } from "@auth";

export default function LoginPage() {
  const [msg, setMsg] = useState("");
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    setCsrf(getCsrfToken());
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = {
      customerId: (form.elements.namedItem("customerId") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };
    const csrfToken = (form.elements.namedItem("csrfToken") as HTMLInputElement).value;
    const res = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
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
      <input type="hidden" name="csrfToken" value={csrf} />
      <button type="submit" className="border px-2 py-1">Login</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
