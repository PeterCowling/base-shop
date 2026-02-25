'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Clock3 } from 'lucide-react';

import GuardedInfoPageShell from '../../../components/pre-arrival/GuardedInfoPageShell';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';

export default function LateCheckInPage() {
  const { t } = useTranslation('PreArrival');
  const { occupantData, isLoading, error } = useUnifiedBookingData();

  return (
    <GuardedInfoPageShell
      title={t('lateCheckin.title')}
      loadErrorMessage={t('lateCheckin.loadError')}
      returnHomeLabel={t('lateCheckin.returnHome')}
      isLoading={isLoading}
      hasError={Boolean(error) || !occupantData}
    >
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
          <p className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-foreground">
            {t('lateCheckin.priorityNotice')}
          </p>
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
    </GuardedInfoPageShell>
  );
}
