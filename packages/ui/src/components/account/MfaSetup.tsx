"use client";

// packages/ui/src/components/account/MfaSetup.tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function MfaSetup() {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const begin = async () => {
    const csrfToken =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
        : undefined;
    const res = await fetch("/api/mfa/enroll", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken ?? "" },
    });
    if (res.ok) {
      const data = await res.json();
      setSecret(data.secret);
      setOtpauth(data.otpauth);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const csrfToken =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1]
        : undefined;
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setStatus(data.verified ? "MFA enabled" : "Invalid code");
  };

  useEffect(() => {
    if (!otpauth) return;
    QRCode.toDataURL(otpauth).then(setQrCode).catch(console.error);
  }, [otpauth]);

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
          {qrCode && (
            <img src={qrCode} alt="MFA QR Code" className="mb-2" />
          )}
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
