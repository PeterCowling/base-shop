'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertTriangle, LifeBuoy } from 'lucide-react';

import { buildSupportMailto } from '../../../config/supportContact';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';

export default function OvernightIssuesPage() {
  const { t } = useTranslation('PreArrival');
  const { occupantData, isLoading, error } = useUnifiedBookingData();

  const reportEmailHref = useMemo(() => {
    const bookingRef = occupantData?.reservationCode;
    const subject = bookingRef
      ? t('overnightIssues.email.subjectWithBooking', { bookingRef })
      : t('overnightIssues.email.subjectDefault');
    const body = t('overnightIssues.email.bodyTemplate', {
      bookingRef: bookingRef ?? t('overnightIssues.email.unknownBookingRef'),
    });

    return buildSupportMailto({ subject, body });
  }, [occupantData?.reservationCode, t]);

  if (isLoading) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <div className="flex items-center justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error || !occupantData) {
    return (
      <main className="bg-muted px-4 py-6 pb-24">
        <section className="rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            {t('overnightIssues.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('overnightIssues.loadError')}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            {t('overnightIssues.returnHome')}
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
            <AlertTriangle className="h-6 w-6 text-warning-foreground" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {t('overnightIssues.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('overnightIssues.subtitle')}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
            {t('overnightIssues.priorityNotice')}
          </div>

          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('overnightIssues.whatToIncludeTitle')}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t('overnightIssues.whatToInclude.item1')}</li>
            <li>{t('overnightIssues.whatToInclude.item2')}</li>
            <li>{t('overnightIssues.whatToInclude.item3')}</li>
          </ol>
        </section>

        <section className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('overnightIssues.actionsTitle')}
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={reportEmailHref}
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('overnightIssues.emailCta')}
            </a>
            <Link
              href="/digital-assistant"
              className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t('overnightIssues.assistantCta')}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t('overnightIssues.followUpNote')}
          </p>
        </section>

        <section className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {t('overnightIssues.safetyNote')}
            </p>
          </div>
        </section>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            {t('overnightIssues.returnHome')}
          </Link>
        </div>
      </div>
    </main>
  );
}
