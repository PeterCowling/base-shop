'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Copy, DoorOpen } from 'lucide-react';

import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import useCheckInCode from '../../../hooks/useCheckInCode';

export default function MainDoorAccessPage() {
  const { t } = useTranslation('PreArrival');
  const {
    occupantData,
    isLoading: isBookingLoading,
    error: bookingError,
  } = useUnifiedBookingData();
  const [isCopied, setIsCopied] = useState(false);

  const checkOutDate = occupantData?.checkOutDate;
  const {
    code,
    isLoading: isCodeLoading,
    isError: isCodeError,
    errorMessage,
    isStale,
    isOffline,
    refetch,
  } = useCheckInCode({
    checkOutDate,
    enabled: Boolean(checkOutDate),
  });

  const hasBookingError = useMemo(
    () => Boolean(bookingError) || !occupantData,
    [bookingError, occupantData],
  );

  const handleCopyCode = useCallback(async () => {
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, 1800);
    } catch {
      setIsCopied(false);
    }
  }, [code]);

  if (isBookingLoading) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <div className="flex items-center justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (hasBookingError) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <section className="rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {t('mainDoor.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('mainDoor.loadError')}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            {t('mainDoor.returnHome')}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-muted px-4 py-6 pb-24">
      <div className="space-y-4">
        <section className="rounded-xl bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <DoorOpen className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {t('mainDoor.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('mainDoor.subtitle')}
              </p>
            </div>
          </div>

          {isStale && code && (
            <div className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('mainDoor.staleWarning')}
              </span>
            </div>
          )}

          {isOffline && !code && !isCodeLoading && (
            <div className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-foreground">
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('mainDoor.offlineNoCode')}
              </span>
            </div>
          )}

          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('mainDoor.codeLabel')}
          </p>

          <button
            type="button"
            onClick={() => {
              void handleCopyCode();
            }}
            disabled={!code}
            className="mt-2 flex min-h-12 min-w-12 w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-start"
          >
            <span className="font-mono text-2xl font-bold tracking-wider text-foreground">
              {code || t('mainDoor.codeUnavailable')}
            </span>
            {code && (
              isCopied
                ? <CheckCircle2 className="h-5 w-5 text-success" />
                : <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {code && (
            <p className="mt-2 text-xs text-muted-foreground">
              {isCopied ? t('mainDoor.codeCopied') : t('mainDoor.copyHint')}
            </p>
          )}

          {isCodeError && !code && (
            <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-foreground">
              {errorMessage || t('mainDoor.codeError')}
            </p>
          )}

          {!isOffline && (isStale || (!code && !isCodeLoading)) && (
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-3 min-h-12 min-w-12 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('mainDoor.refreshCode')}
            </button>
          )}
        </section>

        <section className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('mainDoor.instructionsTitle')}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t('mainDoor.instructions.step1')}</li>
            <li>{t('mainDoor.instructions.step2')}</li>
            <li>{t('mainDoor.instructions.step3')}</li>
            <li>{t('mainDoor.instructions.step4')}</li>
          </ol>
          <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-sm text-info-foreground">
            {t('mainDoor.roomKeycardNote')}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('mainDoor.safetyNote')}
          </p>
        </section>

        <div className="flex flex-col gap-2 text-center">
          <Link href="/late-checkin" className="text-sm text-primary hover:underline">
            {t('mainDoor.lateCheckinLink')}
          </Link>
          <Link href="/" className="text-sm text-primary hover:underline">
            {t('mainDoor.returnHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
