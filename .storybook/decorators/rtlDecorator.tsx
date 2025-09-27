import React, { useEffect } from 'react';
import type { Decorator } from '@storybook/react';

const RTL_LOCALES = new Set<string>(['ar']);

export const withRTL: Decorator = (Story, context) => {
  const locale = (context.globals?.locale ?? 'en') as string;
  const forceRtl = context.parameters?.rtl === true;

  useEffect(() => {
    const el = document.documentElement;
    const isRTL = forceRtl || RTL_LOCALES.has(locale);
    el.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    el.classList.toggle('rtl', isRTL);
  }, [locale, forceRtl]);

  return <Story />;
};

