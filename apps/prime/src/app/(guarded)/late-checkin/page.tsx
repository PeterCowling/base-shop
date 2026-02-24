'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Clock3 } from 'lucide-react';

import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';

export default function LateCheckInPage() {
  const { t } = useTranslation('PreArrival');
  const { occupantData, isLoading, error } = useUnifiedBookingData();

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
            {t('lateCheckin.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('lateCheckin.loadError')}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            {t('lateCheckin.returnHome')}
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
            <Clock3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {t('lateCheckin.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('lateCheckin.subtitle')}
              </p>
            </div>
          </div>

          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('lateCheckin.stepsTitle')}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>{t('lateCheckin.steps.step1')}</li>
            <li>{t('lateCheckin.steps.step2')}</li>
            <li>{t('lateCheckin.steps.step3')}</li>
            <li>{t('lateCheckin.steps.step4')}</li>
            <li>{t('lateCheckin.steps.step5')}</li>
          </ol>
        </section>

        <section className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {t('lateCheckin.nextActionsTitle')}
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/main-door-access"
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {t('lateCheckin.mainDoorCta')}
            </Link>
            <Link
              href="/overnight-issues"
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {t('lateCheckin.issuesCta')}
            </Link>
            <Link href="/" className="text-sm text-primary hover:underline">
              {t('lateCheckin.returnHome')}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
