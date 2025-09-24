import React, { useState } from 'react';
import SeoLanguageTabs from './SeoLanguageTabs';
import type { Locale } from '@acme/types';

type SeoRecord = {
  title: string;
  description: string;
  image: string;
  brand: string;
  offers: string;
  aggregateRating: string;
};

function Wrapper() {
  const languages: Locale[] = ['en'] as any;
  const [locale, setLocale] = useState<Locale>('en' as any);
  const [seo, setSeo] = useState<Record<string, SeoRecord>>({
    en: { title: '', description: '', image: '', brand: '', offers: '', aggregateRating: '' },
  });
  const onFieldChange = (field: keyof SeoRecord, value: string) => {
    setSeo((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));
  };
  return (
    <SeoLanguageTabs
      languages={languages}
      locale={locale}
      onLocaleChange={setLocale}
      seo={seo}
      onFieldChange={onFieldChange}
      titleLimit={70}
      descLimit={160}
      baseLocale={'en' as any}
    />
  );
}

describe('SeoLanguageTabs (CT)', { tags: ['forms'] }, () => {
  it('updates counters for EN (no language switching)', () => {
    cy.mount(<Wrapper />);
    cy.findByText(/Title/).parent().find('input').type('Hello');
    cy.findByText(/\d+\/70/).should('contain.text', '5/70');
  });
});
