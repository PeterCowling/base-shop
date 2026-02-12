'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sync the <html lang> attribute with the current i18n language.
 *
 * Server-side renders with lang="en" (default). This component updates
 * it client-side when the occupant's language is detected and changed
 * via i18n.changeLanguage().
 */
export function HtmlLangSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}
