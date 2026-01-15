'use client';

import { useEffect } from 'react';
import { usePreloadOnNavigation } from '@/middleware/i18nPreload';

export function I18nPreloader() {
  useEffect(() => {
    return usePreloadOnNavigation();
  }, []);

  return null;
}
