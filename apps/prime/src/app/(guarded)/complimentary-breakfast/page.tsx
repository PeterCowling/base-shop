'use client';

import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layout/Container';

export default function ComplimentaryBreakfastPage() {
  const { t } = useTranslation('Common');

  return (
    <main className="min-h-svh bg-gray-50 p-4">
      <Container className="max-w-md text-center">
        <UtensilsCrossed className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {t('placeholders.titles.complimentaryBreakfast')}
        </h1>
        <p className="mb-8 text-gray-600">{t('placeholders.comingSoon')}</p>
        <Link href="/" className="text-blue-600 hover:underline">
          {t('placeholders.returnHome')}
        </Link>
      </Container>
    </main>
  );
}
