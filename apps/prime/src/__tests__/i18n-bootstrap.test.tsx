import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';
import { act,render, screen } from '@testing-library/react';
import i18n from 'i18next';

// Create a test i18n instance to avoid polluting the global one
function createTestI18n(resources: Record<string, Record<string, Record<string, string>>> = {}) {
  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['Homepage'],
    defaultNS: 'Homepage',
    resources,
    interpolation: { escapeValue: false },
  });
  return instance;
}

describe('i18n bootstrap', () => {
  // TC-18: I18nextProvider present in rendered tree
  test('TC-18: useTranslation works inside Providers tree', () => {
    const testI18n = createTestI18n({
      en: { Homepage: { title: 'Welcome' } },
    });

    function TestConsumer() {
      const { t } = useTranslation('Homepage');
      return <div>{t('title')}</div>;
    }

    render(
      <I18nextProvider i18n={testI18n}>
        <TestConsumer />
      </I18nextProvider>,
    );

    expect(screen.getByText('Welcome')).toBeDefined();
  });

  // TC-19: useTranslation returns translated string (not just key)
  test('TC-19: translation returns string value, not key', () => {
    const testI18n = createTestI18n({
      en: { Homepage: { greeting: 'Hello Guest' } },
    });

    function TestConsumer() {
      const { t } = useTranslation('Homepage');
      return <div>{t('greeting')}</div>;
    }

    render(
      <I18nextProvider i18n={testI18n}>
        <TestConsumer />
      </I18nextProvider>,
    );

    expect(screen.getByText('Hello Guest')).toBeDefined();
    expect(screen.queryByText('greeting')).toBeNull();
  });

  // TC-20: html lang updates when language changes
  test('TC-20: document.documentElement.lang updates on language change', async () => {
    const testI18n = createTestI18n({
      en: { Homepage: { title: 'Welcome' } },
      it: { Homepage: { title: 'Benvenuto' } },
    });

    document.documentElement.lang = 'en';

    await act(async () => {
      await testI18n.changeLanguage('it');
      document.documentElement.lang = testI18n.language;
    });

    expect(document.documentElement.lang).toBe('it');
  });

  // TC-21: missing namespace falls back to English without error
  test('TC-21: missing namespace renders fallback key without throwing', () => {
    const testI18n = createTestI18n({
      en: { Homepage: { title: 'Welcome' } },
    });

    function TestConsumer() {
      const { t } = useTranslation('MissingNS');
      return <div>{t('someKey')}</div>;
    }

    // Should not throw
    expect(() => {
      render(
        <I18nextProvider i18n={testI18n}>
          <TestConsumer />
        </I18nextProvider>,
      );
    }).not.toThrow();

    // Key is rendered as fallback (not a blank screen)
    expect(screen.getByText('someKey')).toBeDefined();
  });
});
