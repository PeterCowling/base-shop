"use client";

// packages/ui/src/components/account/MfaChallenge.tsx
import { useState } from "react";

export default function MfaChallenge() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      setStatus("Success");
    } else {
      setStatus("Invalid code");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Authentication code"
        className="rounded border p-2"
      />
      <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-fg">
        Verify
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}
