"use client";

// packages/ui/src/components/account/MfaSetup.tsx
import { useState } from "react";

export default function MfaSetup() {
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const begin = async () => {
    const res = await fetch("/api/mfa/enroll", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSecret(data.secret);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setStatus(data.verified ? "MFA enabled" : "Invalid code");
  };

  return (
    <div className="space-y-4">
      {!secret && (
        <button
          type="button"
          onClick={begin}
          className="rounded bg-primary px-4 py-2 text-primary-fg"
        >
          Generate Secret
        </button>
      )}
      {secret && (
        <div>
          <p className="mb-2">Secret: {secret}</p>
          <form onSubmit={verify} className="space-y-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="rounded border p-2"
              placeholder="Enter code"
            />
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-primary-fg"
            >
              Verify
            </button>
          </form>
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}
