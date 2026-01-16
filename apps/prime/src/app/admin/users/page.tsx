'use client';

import { Users } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Container from '@/components/layout/Container';

export default function AdminUsersPage() {
  const { t } = useTranslation('Common');

  return (
    <main className="min-h-svh bg-gray-50 p-4">
      <Container className="max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('placeholders.titles.adminUsers')}
            </h1>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">{t('placeholders.comingSoon')}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            {t('placeholders.returnHome')}
          </Link>
        </div>
      </Container>
    </main>
  );
}
