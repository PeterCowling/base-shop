'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Check, Globe } from 'lucide-react';

const SUPPORTED_LOCALES = ['en', 'it'] as const;
type UiLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeUiLocale(language: string | undefined): UiLocale {
  const base = language?.split('-')[0]?.toLowerCase();
  return base === 'it' ? 'it' : 'en';
}

export default function LanguageSelectorPage() {
  const { t, i18n } = useTranslation('Settings');
  const [isUpdating, setIsUpdating] = useState(false);

  const activeLocale = useMemo(
    () => normalizeUiLocale(i18n?.language),
    [i18n?.language],
  );

  async function handleLanguageSelect(locale: UiLocale) {
    if (!i18n?.changeLanguage || locale === activeLocale) {
      return;
    }

    setIsUpdating(true);
    try {
      await i18n.changeLanguage(locale);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="bg-muted px-4 py-6 pb-24">
      <section className="rounded-xl bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('language.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('language.subtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {SUPPORTED_LOCALES.map((locale) => {
            const isActive = locale === activeLocale;
            const localeLabel = t(`language.options.${locale}`);

            return (
              <button
                key={locale}
                type="button"
                aria-pressed={isActive}
                disabled={isUpdating}
                onClick={() => {
                  void handleLanguageSelect(locale);
                }}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-start transition-colors ${
                  isActive
                    ? 'border-primary bg-info-soft text-info-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <span className="font-medium">{localeLabel}</span>
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </section>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('language.current', {
          language: t(`language.options.${activeLocale}`),
        })}
      </p>

      <div className="mt-3 text-center">
        <Link href="/" className="text-sm text-primary hover:underline">
          {t('language.returnHome')}
        </Link>
      </div>
    </main>
  );
}
