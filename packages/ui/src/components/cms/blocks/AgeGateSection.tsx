"use client";

import * as React from "react";

export interface AgeGateSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  minAge?: number;
  message?: string;
  confirmLabel?: string;
  storageKey?: string;
  rememberDays?: number;
}

export default function AgeGateSection({ minAge = 18, message = "You must confirm you are of legal age to enter this site.", confirmLabel = "I am over 18", storageKey = "age-gate", rememberDays = 30, className, ...rest }: AgeGateSectionProps) {
  const [allowed, setAllowed] = React.useState<boolean>(false);
  const [shown, setShown] = React.useState<boolean>(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { expiresAt } = JSON.parse(raw) as { expiresAt?: number };
        if (expiresAt && Date.now() < expiresAt) {
          setAllowed(true);
          return;
        }
      }
    } catch {}
    setShown(true);
  }, [storageKey]);

  const confirm = () => {
    setAllowed(true);
    setShown(false);
    try {
      const expiresAt = Date.now() + Math.max(1, rememberDays) * 864e5;
      localStorage.setItem(storageKey, JSON.stringify({ expiresAt }));
    } catch {}
  };

  if (!shown || allowed) return null;

  return (
    <div className={["fixed inset-0 z-50 flex items-center justify-center bg-black/70", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="w-full max-w-md rounded bg-white p-6 text-center shadow-elevation-4">
        <h2 className="mb-2 text-lg font-semibold">Age confirmation</h2>
        <p className="mb-4 text-sm text-neutral-700">{message}</p>
        <button type="button" className="rounded bg-black px-4 py-2 text-white" onClick={confirm}>
          {confirmLabel.replace("18", String(minAge))}
        </button>
      </div>
    </div>
  );
}
