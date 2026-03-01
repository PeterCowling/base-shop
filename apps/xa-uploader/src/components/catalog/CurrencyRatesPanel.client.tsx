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

type EditableCurrencyCode = "EUR" | "GBP" | "AUD";
type EditableCurrencyRates = Record<EditableCurrencyCode, string>;

const EMPTY_RATES: EditableCurrencyRates = {
  EUR: "",
  GBP: "",
  AUD: "",
};

const RATE_FIELD_CLASSNAME =
  "mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted focus:border-gate-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-ink/20";

function formatLoadedRates(rates: CurrencyRatesResponse["rates"]): EditableCurrencyRates {
  return {
    EUR: typeof rates?.EUR === "number" ? rates.EUR.toFixed(4) : "",
    GBP: typeof rates?.GBP === "number" ? rates.GBP.toFixed(4) : "",
    AUD: typeof rates?.AUD === "number" ? rates.AUD.toFixed(4) : "",
  };
}

function toRatesPayload(rates: EditableCurrencyRates): Record<EditableCurrencyCode, number> {
  return {
    EUR: Number.parseFloat(rates.EUR),
    GBP: Number.parseFloat(rates.GBP),
    AUD: Number.parseFloat(rates.AUD),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function EditableRateField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  testId: string;
}) {
  return (
    <label className="text-xs uppercase tracking-label text-gate-muted">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        step="0.0001"
        min="0.0001"
        placeholder="e.g. 0.9300"
        className={RATE_FIELD_CLASSNAME}
        data-testid={testId}
        data-cy={testId}
      />
    </label>
  );
}

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
  const [rates, setRates] = React.useState<EditableCurrencyRates>(EMPTY_RATES);
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
        setRates(formatLoadedRates(data.rates));
      } catch (error) {
        if (!active) return;
        if (isAbortError(error)) return;
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
          rates: toRatesPayload(rates),
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
  const setRate = React.useCallback((code: EditableCurrencyCode, nextValue: string) => {
    setRates((prev) => ({
      ...prev,
      [code]: nextValue,
    }));
  }, []);

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

        <EditableRateField
          label={t("currencyRatesEurLabel")}
          value={rates.EUR}
          onChange={(nextValue) => setRate("EUR", nextValue)}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="currency-rates-eur"
        />

        <EditableRateField
          label={t("currencyRatesGbpLabel")}
          value={rates.GBP}
          onChange={(nextValue) => setRate("GBP", nextValue)}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="currency-rates-gbp"
        />

        <EditableRateField
          label={t("currencyRatesAudLabel")}
          value={rates.AUD}
          onChange={(nextValue) => setRate("AUD", nextValue)}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          testId="currency-rates-aud"
        />
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
