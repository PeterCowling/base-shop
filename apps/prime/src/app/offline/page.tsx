'use client';

import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layout/Container';

export default function OfflinePage() {
  const { t } = useTranslation('Common');

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gray-50 p-4">
      <Container className="max-w-md text-center">
        <WifiOff className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {t('offline.indicator')}
        </h1>
        <p className="mb-8 text-gray-600">
          {t('offline.message')}
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          {t('retry', 'Try again')}
        </Link>
      </Container>
    </main>
  );
}
