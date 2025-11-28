// packages/ui/src/components/cms/blocks/SocialLinks.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import SocialLinks from './SocialLinks';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './SocialLinks.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof SocialLinks> = {
  title: 'CMS Blocks/SocialLinks/Matrix',
  component: SocialLinks,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof SocialLinks>;
const baseArgs = meta.args!;

try { z.object({ facebook: z.string().url().optional(), instagram: z.string().url().optional(), x: z.string().url().optional(), youtube: z.string().url().optional(), linkedin: z.string().url().optional() }).parse(fixture); } catch (e) { console.error('Invalid SocialLinks fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });

