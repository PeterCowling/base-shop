"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "@acme/i18n";
import type { CheckoutSessionResponse } from "@/types/checkout";
import { fetchCheckoutSession } from "@/lib/checkout";
import Price from "@/components/Price";

type PanelState = {
  status: "idle" | "loading" | "error" | "success";
  data?: CheckoutSessionResponse;
  message?: string;
};

const ThankYouPanel = React.memo(function ThankYouPanel() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<PanelState>({ status: "idle" });

  const missingMessage = useMemo(() => t("thankyou.missing") as string, [t]);
  const errorMessage = useMemo(() => t("thankyou.error") as string, [t]);
  const loadingState = useMemo<PanelState>(() => ({ status: "loading" }), []);
  const missingState = useMemo<PanelState>(
    () => ({ status: "error", message: missingMessage }),
    [missingMessage]
  );
  const errorState = useMemo<PanelState>(
    () => ({ status: "error", message: errorMessage }),
    [errorMessage]
  );

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setState(missingState);
      return;
    }

    setState(loadingState);
    try {
      const data = await fetchCheckoutSession(sessionId);
      setState({ status: "success", data });
    } catch {
      setState(errorState);
    }
  }, [errorState, loadingState, missingState, sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const statusLabel = useMemo(() => {
    if (state.status !== "success" || !state.data) return null;
    return state.data.paymentStatus === "paid"
      ? (t("thankyou.paid") as string)
      : (t("thankyou.unpaid") as string);
  }, [state.data, state.status, t]);

  if (state.status === "loading") {
    return (
      <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6 text-center">
        <div className="text-sm text-muted-foreground">{t("thankyou.loading") as string}</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {state.message}
      </div>
    );
  }

  if (!state.data) {
    return null;
  }

  return (
    <div className="surface animate-fade-up rounded-3xl border border-border-1 p-6">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("thankyou.status") as string}
        </div>
        <div className="text-xl font-semibold">{statusLabel}</div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {state.data.items.map((item) => (
          <div key={item.variantId} className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t(item.name) as string}</div>
              <div className="text-muted-foreground">
                {t(`size.${item.size}`) as string} / {t(`color.${item.color}`) as string}
              </div>
            </div>
            <div className="text-end">
              <div className="text-xs text-muted-foreground">{t("thankyou.qty") as string} {item.quantity}</div>
              <div className="font-semibold">
                <Price amount={item.unitPrice * item.quantity} currency={item.currency} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border-1 pt-4 text-base font-semibold">
        <span>{t("thankyou.total") as string}</span>
        <Price amount={state.data.total} currency={state.data.currency} />
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        {t("thankyou.reference") as string}: {state.data.id}
      </div>
    </div>
  );
});

export default ThankYouPanel;
