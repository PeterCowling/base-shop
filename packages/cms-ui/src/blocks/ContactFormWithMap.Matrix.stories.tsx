// packages/ui/src/components/cms/blocks/ContactFormWithMap.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '@acme/ui/story-utils/createStories';

import ContactFormWithMap from './ContactFormWithMap';
import fixture from './ContactFormWithMap.fixtures.json';

const meta: Meta<typeof ContactFormWithMap> = {
  title: 'CMS Blocks/ContactFormWithMap/Matrix',
  component: ContactFormWithMap,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Contact form with an embedded map iframe.' } } },
};
export default meta;

type Story = StoryObj<typeof ContactFormWithMap>;
const baseArgs = meta.args!;

try { z.object({ mapSrc: z.string().url().optional() }).parse(fixture); } catch (e) { console.error('Invalid ContactFormWithMap fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
