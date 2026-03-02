"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createBrikClickId, fireRecoveryLeadCapture } from "@/utils/ga4-events";
import {
  buildRecoveryResumeLink,
  persistRecoveryCapture,
  RECOVERY_CAPTURE_RETENTION_DAYS,
  RECOVERY_CONSENT_VERSION,
  type RecoveryQuoteContext,
} from "@/utils/recoveryQuote";

type Props = {
  isValidSearch: boolean;
  context: RecoveryQuoteContext;
  resumePathname: string;
  title?: string;
};

type SendResponse =
  | { status: "accepted" | "duplicate"; idempotencyKey: string }
  | { error: string };

export function RecoveryQuoteCapture({
  isValidSearch,
  context,
  resumePathname,
  title,
}: Props): JSX.Element | null {
  const { t } = useTranslation("bookPage");
  const [guestEmail, setGuestEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !isValidSearch || loading;

  const retentionExpiresAt = useMemo(
    () => new Date(Date.now() + RECOVERY_CAPTURE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    [],
  );

  if (!isValidSearch) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = guestEmail.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError(t("recovery.errors.invalidEmail") as string);
      return;
    }
    if (!consent) {
      setError(t("recovery.errors.consentRequired") as string);
      return;
    }

    const leadCaptureId = createBrikClickId();
    const { resumeLink, resumeExpiresAt } = buildRecoveryResumeLink(context, {
      pathname: resumePathname,
    });

    persistRecoveryCapture({
      lead_capture_id: leadCaptureId,
      checkin: context.checkin,
      checkout: context.checkout,
      pax: context.pax,
      source_route: context.source_route,
      room_id: context.room_id,
      rate_plan: context.rate_plan,
      resume_link: resumeLink,
      resume_expires_at: resumeExpiresAt,
      recovery_channel: "email",
      consent_version: RECOVERY_CONSENT_VERSION,
      consent_granted_at: new Date().toISOString(),
      retention_expires_at: retentionExpiresAt,
    });

    fireRecoveryLeadCapture({
      source_route: context.source_route,
      room_id: context.room_id,
      rate_plan: context.rate_plan,
      recovery_channel: "email",
      consent_version: RECOVERY_CONSENT_VERSION,
      resume_ttl_days: 7,
    });

    setLoading(true);
    try {
      const response = await fetch("/api/recovery/quote/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          guestEmail: normalizedEmail,
          consentVersion: RECOVERY_CONSENT_VERSION,
          leadCaptureId,
          resumeLink,
        }),
      });

      const data = (await response.json()) as SendResponse;

      if ("status" in data && (data.status === "accepted" || data.status === "duplicate")) {
        setSubmitted(true);
      } else {
        setError(t("recovery.errors.sendFailed") as string);
      }
    } catch {
      setError(t("recovery.errors.sendFailed") as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-brand-outline/40 bg-brand-bg px-4 py-4">
      <h3 className="text-base font-semibold text-brand-heading">
        {title ?? (t("recovery.title") as string)}
      </h3>
      <p className="mt-1 text-sm text-brand-text/90">
        {t("recovery.privacyNotice") as string}
      </p>
      <form className="mt-3 space-y-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
          {t("recovery.emailLabel") as string}
          <input
            type="email"
            required={true}
            value={guestEmail}
            onChange={(event) => setGuestEmail(event.target.value)}
            className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-surface px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            placeholder={t("recovery.emailPlaceholder") as string}
            disabled={disabled}
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-brand-text/90">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1"
            disabled={disabled}
          />
          {t("recovery.consent") as string}
        </label>
        {error ? <p className="text-sm text-brand-text">{error}</p> : null}
        {submitted ? (
          <p className="text-sm text-brand-text/90">{t("recovery.submitted") as string}</p>
        ) : null}
        <button
          type="submit"
          disabled={disabled}
          className="min-h-11 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary disabled:opacity-50"
        >
          {loading
            ? (t("recovery.sending") as string)
            : (t("recovery.submitCta") as string)}
        </button>
      </form>
    </section>
  );
}

export default RecoveryQuoteCapture;
