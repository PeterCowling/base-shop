import { getCustomerSession } from "@auth";
import { redirect } from "next/navigation";
import { useState } from "react";
import { getCsrfToken } from "@shared-utils";

export default async function ChangePasswordPage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/account/change-password")}`);
  }
  return <ChangePasswordForm />;
}

function ChangePasswordForm() {
  "use client";
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget.elements as any;
    const currentPassword = (form.namedItem("currentPassword") as HTMLInputElement).value;
    const newPassword = (form.namedItem("newPassword") as HTMLInputElement).value;
    const csrfToken = getCsrfToken();
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await res.json().catch(() => ({}));
    setMsg(res.ok ? "Password updated" : "Error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        name="currentPassword"
        type="password"
        placeholder="Current password"
        className="border p-1"
      />
      <input
        name="newPassword"
        type="password"
        placeholder="New password"
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"
        title="Password must be at least 8 characters and include uppercase, lowercase, and number"
        className="border p-1"
      />
      <button type="submit" className="border px-2 py-1">
        Change password
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
