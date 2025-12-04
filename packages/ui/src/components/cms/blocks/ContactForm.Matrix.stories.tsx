// packages/ui/src/components/cms/blocks/ContactForm.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import ContactForm from './ContactForm';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ContactForm.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ContactForm> = {
  title: 'CMS Blocks/ContactForm/Matrix',
  component: ContactForm,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Basic contact form with name/email/message fields.' } } },
};
export default meta;

type Story = StoryObj<typeof ContactForm>;
const baseArgs = meta.args!;

try { z.object({ action: z.string().optional(), method: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid ContactForm fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
