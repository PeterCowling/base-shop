"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "@acme/i18n";
import type { GrowthLedger } from "@acme/lib";

import { GrowthLedgerCard } from "./GrowthLedgerCard";

interface GrowthLedgerCardContainerProps {
  businessCode: string;
}

type LoadingState = "loading" | "ready" | "empty" | "error";

interface GrowthLedgerApiSuccess {
  business: string;
  ledger: GrowthLedger;
}

interface GrowthLedgerApiError {
  error: string;
}

function isApiSuccess(payload: unknown): payload is GrowthLedgerApiSuccess {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "ledger" in payload &&
    "business" in payload
  );
}

function isApiError(payload: unknown): payload is GrowthLedgerApiError {
  return typeof payload === "object" && payload !== null && "error" in payload;
}

export function GrowthLedgerCardContainer({
  businessCode,
}: GrowthLedgerCardContainerProps) {
  const t = useTranslations();
  const [state, setState] = useState<LoadingState>("loading");
  const [ledger, setLedger] = useState<GrowthLedger | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLedger(): Promise<void> {
      try {
        const response = await fetch(
          `/api/business/${encodeURIComponent(businessCode)}/growth-ledger`,
          { cache: "no-store" },
        );
        const payload: unknown = await response.json();

        if (cancelled) {
          return;
        }

        if (response.status === 404 && isApiError(payload) && payload.error === "ledger_not_initialized") {
          setLedger(null);
          setState("empty");
          return;
        }

        if (!response.ok) {
          setState("error");
          return;
        }

        if (isApiSuccess(payload)) {
          setLedger(payload.ledger);
          setState("ready");
          return;
        }

        setState("error");
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    void loadLedger();

    return () => {
      cancelled = true;
    };
  }, [businessCode]);

  if (state === "loading") {
    return (
      <section className="rounded-lg border border-border-2 bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          {t("businessOs.growthLedger.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("businessOs.growthLedger.loading")}
        </p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="rounded-lg border border-border-2 bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          {t("businessOs.growthLedger.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("businessOs.growthLedger.unavailable")}
        </p>
      </section>
    );
  }

  if (state === "empty") {
    return <GrowthLedgerCard businessCode={businessCode} ledger={null} />;
  }

  return <GrowthLedgerCard businessCode={businessCode} ledger={ledger} />;
}
