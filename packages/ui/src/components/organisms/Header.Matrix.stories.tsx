// packages/ui/src/components/organisms/Header.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import type { Locale } from '@acme/i18n/locales';
import { makeStateStory } from '../../story-utils/createStories';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header/Matrix',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `Primary responsive header with logo, navigation, language switcher and optional search. Matrix covers empty/minimal and RTL.\n\nUsage:\n\n\`\`\`tsx\nimport { Header } from './Header';\n\n<Header\n  locale="en"\n  shopName="Demo"\n  nav={[{ title: 'Home', href: '#' }, { title: 'Shop', href: '#' }]}\n  searchSuggestions={['Shoes', 'Shirts']}\n/>\n\n// Key args: locale, shopName, nav, searchSuggestions, showSearch\n\`\`\``,
      },
    },
  },
  args: {
    locale: 'en' as Locale,
    shopName: 'Demo Shop',
    nav: [
      { title: 'Men', href: '/men', items: [{ title: 'Shoes', href: '/men/shoes' }, { title: 'Jackets', href: '/men/jackets' }] },
      { title: 'Women', href: '/women', items: [{ title: 'Dresses', href: '/women/dresses' }, { title: 'Tops', href: '/women/tops' }] },
      { title: 'Sale', href: '/sale' },
    ],
    searchSuggestions: ['running shoes', 'jackets', 'sneakers'],
    showSearch: true,
  },
};
export default meta;

type Story = StoryObj<typeof Header>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Primary header with logo, nav and search.',
});

// Simulated loading: hide search and reduce nav to mimic minimal header
export const Loading: Story = makeStateStory(baseArgs, { showSearch: false }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading variant with minimal elements displayed.',
});

export const Empty: Story = makeStateStory(baseArgs, { nav: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No navigation items; demonstrates compact layout behavior.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Non-networked component; included for matrix completeness.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Header mirrored for RTL locales; hover menus adjust accordingly.',
});
