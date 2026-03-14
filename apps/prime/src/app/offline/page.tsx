'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

import { Container } from '@/components/layout/Container';

export default function OfflinePage() {
  const { t } = useTranslation('Homepage');
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-4">
      <Container className="max-w-md text-center">
        <WifiOff className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('offline.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('offline.message')}
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          {t('offline.tryAgain')}
        </Link>
      </Container>
    </main>
  );
}
