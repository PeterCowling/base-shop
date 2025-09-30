"use client";

import * as React from "react";
import { Cover } from "../../atoms/primitives/Cover";
import { Button } from "../../atoms";
import { useTranslations } from "@acme/i18n";

export interface AgeGateSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  minAge?: number;
  message?: string;
  confirmLabel?: string;
  storageKey?: string;
  rememberDays?: number;
}

export default function AgeGateSection({ minAge = 18, message, confirmLabel: _confirmLabel, storageKey = "age-gate", rememberDays = 30, className, ...rest }: AgeGateSectionProps) {
  const t = useTranslations();
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
    // i18n-exempt -- DS-1234 [ttl=2025-11-30] — overlay container class composition
    <div className={["fixed inset-0 z-50 bg-black/70", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <Cover center={
        <div className="mx-auto w-full rounded bg-white p-6 text-center shadow-elevation-4">
          <h2 className="mb-2 text-lg font-semibold">{t("ageGate.title")}</h2>
          <p className="mb-4 text-sm text-neutral-700">{message ?? t("ageGate.message")}</p>
          <Button type="button" onClick={confirm}>
            {t("ageGate.confirm", { age: minAge })}
          </Button>
        </div>
      } />
    </div>
  );
}
