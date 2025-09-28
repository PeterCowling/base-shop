// packages/ui/src/components/cms/blocks/ContactForm.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import ContactForm from './ContactForm';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ContactForm.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ContactForm> = {
  title: 'CMS Blocks/ContactForm/Matrix',
  component: ContactForm,
  tags: ['autodocs'],
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Basic contact form with name/email/message fields.' } } },
};
export default meta;

type Story = StoryObj<typeof ContactForm>;
const baseArgs = meta.args!;

try { z.object({ action: z.string().optional(), method: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid ContactForm fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

