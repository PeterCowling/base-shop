import type { StorybookConfig } from '@storybook/nextjs';
import en from "../packages/i18n/src/en.json";

const t = (key: string) => (en as Record<string, string>)[key] ?? key;

const config: StorybookConfig = {
  framework: '@storybook/nextjs', // i18n-exempt -- ABC-123 framework id (non-UI)
  refs: {
    ui: {
      title: t('storybook.refs.ui'),
      // i18n-exempt -- ABC-123 dev-only storybook URL
      url: 'http://localhost:6006',
    },
    cms: {
      title: t('storybook.refs.cms'),
      // i18n-exempt -- ABC-123 dev-only storybook URL
      url: 'http://localhost:6008',
    },
    shop: {
      title: t('storybook.refs.shop'),
      // i18n-exempt -- ABC-123 dev-only storybook URL
      url: 'http://localhost:6010',
    },
  },
  stories: [],
  addons: [],
};
export default config;
