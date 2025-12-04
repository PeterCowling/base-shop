// packages/ui/src/components/cms/blocks/PopupModal.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from '@storybook/test';
import PopupModal from './PopupModal';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PopupModal.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof PopupModal> = {
  title: 'CMS Blocks/PopupModal/Matrix',
  component: PopupModal,
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof PopupModal>;
const baseArgs = meta.args!;

try { z.object({ trigger: z.enum(['delay','exit','load']).optional(), delay: z.number().optional(), content: z.string().optional(), frequencyKey: z.string().optional(), maxShows: z.number().optional(), coolOffDays: z.number().optional(), consentCookieName: z.string().optional(), consentRequiredValue: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid PopupModal fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

export const KeyboardClose: Story = {
  args: { ...baseArgs, trigger: 'load' },
  parameters: { a11y: true, viewports: ['desktop'], tags: ['visual', 'ci'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const close = await canvas.findByRole('button', { name: /close/i });
    await userEvent.keyboard('{Escape}');
    expect(close).not.toBeInTheDocument();
  },
};
