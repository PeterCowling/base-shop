// packages/ui/src/components/cms/blocks/PopupModal.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import PopupModal from './PopupModal';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PopupModal.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof PopupModal> = {
  title: 'CMS Blocks/PopupModal/Matrix',
  component: PopupModal,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof PopupModal>;
const baseArgs = meta.args!;

try { z.object({ trigger: z.enum(['delay','exit','load']).optional(), delay: z.number().optional(), content: z.string().optional(), frequencyKey: z.string().optional(), maxShows: z.number().optional(), coolOffDays: z.number().optional(), consentCookieName: z.string().optional(), consentRequiredValue: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid PopupModal fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

