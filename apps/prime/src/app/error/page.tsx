'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

import { Container } from '@/components/layout/Container';

export default function ErrorPage() {
  const { t } = useTranslation('Homepage');
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-4">
      <Container className="max-w-md text-center">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-danger" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t('errorPage.title')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('errorPage.message')}
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
        >
          {t('errorPage.returnHome')}
        </Link>
      </Container>
    </main>
  );
}
