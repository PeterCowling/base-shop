"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import type { ActionFeedback } from "./catalogConsoleFeedback";

type CurrencyRatesResponse = {
  ok: boolean;
  rates?: {
    EUR: number;
    GBP: number;
    AUD: number;
  } | null;
};

export function CurrencyRatesPanel({
  busy,
  syncReadiness,
  onSync,
}: {
  busy: boolean;
  syncReadiness: {
    checking: boolean;
    ready: boolean;
  };
  onSync: () => void;
}) {
  const { t } = useUploaderI18n();
  const [eurRate, setEurRate] = React.useState("");
  const [gbpRate, setGbpRate] = React.useState("");
  const [audRate, setAudRate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<ActionFeedback | null>(null);

  React.useEffect(() => {
    const abortController = new AbortController();
    let active = true;

    const loadRates = async () => {
      try {
        const response = await fetch("/api/catalog/currency-rates", {
          signal: abortController.signal,
        });
        const data = (await response.json()) as CurrencyRatesResponse;
        if (!response.ok || !data.ok) {
          throw new Error("currency_rates_load_failed");
        }

        if (!active) return;

        setEurRate(typeof data.rates?.EUR === "number" ? data.rates.EUR.toFixed(4) : "");
        setGbpRate(typeof data.rates?.GBP === "number" ? data.rates.GBP.toFixed(4) : "");
        setAudRate(typeof data.rates?.AUD === "number" ? data.rates.AUD.toFixed(4) : "");
      } catch (error) {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFeedback({ kind: "error", message: t("currencyRatesLoadFailed") });
      }
    };

    loadRates().catch(() => null);

    return () => {
      active = false;
      abortController.abort();
    };
  }, [t]);

  const handleSaveAndSync = async () => {
    if (busy || saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/catalog/currency-rates", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          rates: {
            EUR: Number.parseFloat(eurRate),
            GBP: Number.parseFloat(gbpRate),
            AUD: Number.parseFloat(audRate),
          },
        }),
      });

      if (!response.ok) {
        setFeedback({ kind: "error", message: t("currencyRatesSaveFailed") });
        return;
      }

      if (syncReadiness.ready && !syncReadiness.checking) {
        onSync();
        setFeedback({ kind: "success", message: t("currencyRatesSyncedRebuildNote") });
        return;
      }

      setFeedback({ kind: "success", message: t("currencyRatesSavedSyncNotReady") });
    } catch {
      setFeedback({ kind: "error", message: t("currencyRatesSaveFailed") });
    } finally {
      setSaving(false);
    }
  };

  const saveDisabled = busy || saving;

  return (
    <section className="rounded-xl border border-border-2 bg-surface p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-label-lg text-gate-muted">
            {t("currencyRatesTitle")}
          </div>
          <div className="text-sm text-gate-muted">{t("currencyRatesSubtitle")}</div>
        </div>
        <button
          type="button"
          onClick={() => void handleSaveAndSync()}
          disabled={saveDisabled}
          // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
          className="rounded-md border border-gate-ink bg-gate-ink px-4 py-2 text-xs font-semibold uppercase tracking-label text-primary-fg disabled:opacity-60"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="currency-rates-save"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-cy="currency-rates-save"
        >
          {saving ? t("currencyRatesSaving") : t("currencyRatesSaveAndSync")}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs uppercase tracking-label text-gate-muted">
          {t("currencyRatesUsdLabel")}
          <input
            type="number"
            value="1.0000"
            disabled
            readOnly
            className="mt-2 w-full rounded-md border border-border-2 bg-muted px-3 py-2 text-sm text-gate-muted"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="currency-rates-usd"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-cy="currency-rates-usd"
          />
        </label>

        <label className="text-xs uppercase tracking-label text-gate-muted">
          {t("currencyRatesEurLabel")}
          <input
            type="number"
            value={eurRate}
            onChange={(event) => setEurRate(event.target.value)}
            step="0.0001"
            min="0.0001"
            placeholder="e.g. 0.9300"
            className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="currency-rates-eur"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-cy="currency-rates-eur"
          />
        </label>

        <label className="text-xs uppercase tracking-label text-gate-muted">
          {t("currencyRatesGbpLabel")}
          <input
            type="number"
            value={gbpRate}
            onChange={(event) => setGbpRate(event.target.value)}
            step="0.0001"
            min="0.0001"
            placeholder="e.g. 0.9300"
            className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="currency-rates-gbp"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-cy="currency-rates-gbp"
          />
        </label>

        <label className="text-xs uppercase tracking-label text-gate-muted">
          {t("currencyRatesAudLabel")}
          <input
            type="number"
            value={audRate}
            onChange={(event) => setAudRate(event.target.value)}
            step="0.0001"
            min="0.0001"
            placeholder="e.g. 0.9300"
            className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="currency-rates-aud"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-cy="currency-rates-aud"
          />
        </label>
      </div>

      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={feedback.kind === "error" ? "mt-4 text-sm text-danger-fg" : "mt-4 text-sm text-success-fg"}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="currency-rates-feedback"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-cy="currency-rates-feedback"
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
