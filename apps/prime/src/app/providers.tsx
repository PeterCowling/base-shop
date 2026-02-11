'use client';

import { type ReactNode,Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';

import { HtmlLangSync } from '../components/i18n/HtmlLangSync';
import { I18nPreloader } from '../components/i18n/I18nPreloader';
import { PinAuthProvider } from '../contexts/messaging/PinAuthProvider';
import i18n from '../i18n.optimized';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <PinAuthProvider>
        <HtmlLangSync />
        <I18nPreloader />
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </PinAuthProvider>
    </I18nextProvider>
  );
}
