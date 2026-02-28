/* eslint-disable ds/container-widths-only-at -- BRIK-3 prime DS rules deferred */
'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { getStaffOwnerGateMessage } from '../../lib/security/staffOwnerGate';

export default function StaffOwnerDisabledNotice() {
  const { t } = useTranslation('Homepage');
  return (
    <main className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('accessRestricted.title')}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{getStaffOwnerGateMessage()}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
        >
          {t('accessRestricted.returnHome')}
        </Link>
      </div>
    </main>
  );
}
