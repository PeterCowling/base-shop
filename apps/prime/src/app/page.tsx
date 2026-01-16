'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layout/Container';

export default function HomePage() {
  const { t } = useTranslation('Homepage');

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gray-50 p-4">
      <Container className="max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          {t('landing.title', 'Prime Guest Portal')}
        </h1>
        <p className="mb-8 text-gray-600">
          {t('landing.subtitle', 'Welcome to the guest services portal')}
        </p>
        <div className="space-y-4">
          <Link
            href="/find-my-stay"
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            {t('landing.findMyStay', 'Find My Stay')}
          </Link>
          <Link
            href="/staff-lookup"
            className="block w-full rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
          >
            {t('landing.staffLookup', 'Staff Lookup')}
          </Link>
        </div>
      </Container>
    </main>
  );
}
