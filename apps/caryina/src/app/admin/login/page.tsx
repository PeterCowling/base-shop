"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/admin/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        const redirect = searchParams.get("redirect") ?? "/admin/products";
        router.push(redirect);
      } else {
        const data = (await res.json()) as { error?: string };
        if (data.error === "unauthorized") {
          setError("Incorrect admin key.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="admin-key" className="block text-sm font-medium">
          Admin key
        </label>
        <input
          id="admin-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
          autoComplete="current-password"
          className="block w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary min-h-[44px] w-full rounded-full px-6 py-2.5 text-sm disabled:opacity-50"
      >
        {pending ? "Verifying…" : "Log in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-6 text-2xl font-display">Admin login</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
