'use client';

import { useEffect } from 'react';

import { setupPreloadOnNavigation } from '@/middleware/i18nPreload';

export function I18nPreloader() {
  useEffect(() => {
    return setupPreloadOnNavigation();
  }, []);

  return null;
}
