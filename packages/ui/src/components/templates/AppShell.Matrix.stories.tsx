// packages/ui/components/templates/AppShell.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { AppShell } from './AppShell';
import type { Locale } from '@acme/i18n/locales';
import { Header } from '../organisms/Header';
import { SideNav } from '../organisms/SideNav';
import { Footer } from '../organisms/Footer';
import { Content } from '../organisms/Content';
import { makeStateStory } from '../../story-utils/createStories';

const meta = {
  title: 'Templates/AppShell/Matrix',
  component: AppShell,
  parameters: { docs: { autodocs: false } },
  parameters: {
    docs: {
      description: {
        component: `High-level application shell. Wraps header/side navigation/footer and content, providing Theme/Layout providers.\n\nUsage:\n\n\`\`\`tsx\nimport { AppShell } from './AppShell';\nimport { Header } from '../organisms/Header';\nimport { SideNav } from '../organisms/SideNav';\nimport { Footer } from '../organisms/Footer';\nimport { Content } from '../organisms/Content';\n\n<AppShell\n  header={<Header locale={"en" as any} shopName="Demo" nav={[]} />}\n  sideNav={<SideNav>Nav</SideNav>}\n  footer={<Footer shopName="Demo">Footer</Footer>}\n>\n  <Content>Content</Content>\n</AppShell>\n\n// Key args: header, sideNav, footer, children\n\`\`\``,
      },
    },
  },
  args: {
    header: <Header locale={"en" as Locale} shopName="Demo" nav={[]} />,
    sideNav: <SideNav>Nav</SideNav>,
    footer: <Footer shopName="Demo">Footer</Footer>,
    children: <Content>Content</Content>,
  },
} satisfies Meta<typeof AppShell>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Shell with header, side navigation and footer around page content.',
}) satisfies Story;

export const Loading = makeStateStory(baseArgs, { sideNav: null }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading: side navigation hidden to mimic minimal shell.',
}) satisfies Story;

export const Empty = makeStateStory(baseArgs, { children: null }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'No children content; demonstrates shell-only state.',
}) satisfies Story;

export const Error = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Matrix completeness state; no network behavior.',
}) satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL sample for shell chrome and content region.',
}) satisfies Story;
