"use client";

// packages/ui/src/components/account/MfaSetup.tsx
import { useState } from "react";

export default function MfaSetup() {
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const enroll = async () => {
    const res = await fetch("/api/mfa/enroll", { method: "POST" });
    if (!res.ok) {
      setStatus("Failed to enroll");
      return;
    }
    const data = await res.json();
    setSecret(data.secret);
    setStatus(null);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      setStatus("MFA enabled");
    } else {
      setStatus("Verification failed");
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={enroll} className="rounded bg-primary px-4 py-2 text-primary-fg">
        Generate Secret
      </button>
      {secret && (
        <div className="space-y-2">
          <p className="break-all">Secret: {secret}</p>
          <form onSubmit={verify} className="space-y-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter code"
              className="rounded border p-2"
            />
            <button type="submit" className="rounded bg-primary px-4 py-2 text-primary-fg">
              Verify
            </button>
          </form>
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}
