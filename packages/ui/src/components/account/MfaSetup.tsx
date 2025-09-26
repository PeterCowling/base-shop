"use client";

// packages/ui/src/components/account/MfaSetup.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { getCsrfToken } from "@acme/shared-utils";
// Minimal local translator (no runtime change)
const t = (s: string) => s;

export default function MfaSetup() {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const begin = async () => {
    const csrfToken = getCsrfToken();
    // i18n-exempt
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
    const csrfToken = getCsrfToken();
    // i18n-exempt
    const res = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken ?? "",
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setStatus(data.verified ? t("MFA enabled") : t("Invalid code"));
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
          className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
          data-token="--color-primary"
        >
          <span className="text-primary-fg" data-token="--color-primary-fg">
            {t("Generate Secret")}
          </span>
        </button>
      )}
      {secret && (
        <div>
          {qrCode && (
            <Image
              src={qrCode}
              alt={t("MFA QR Code")}
              className="mb-2"
              width={256}
              height={256}
              unoptimized
            />
          )}
          <p className="mb-2">{t("Secret:")} {secret}</p>
          <form onSubmit={verify} className="space-y-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="rounded border p-2"
              placeholder={t("Enter code")}
            />
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 min-h-10 min-w-10"
              data-token="--color-primary"
            >
              <span className="text-primary-fg" data-token="--color-primary-fg">
                {t("Verify")}
              </span>
            </button>
          </form>
        </div>
      )}
      {status && <p>{status}</p>}
    </div>
  );
}
