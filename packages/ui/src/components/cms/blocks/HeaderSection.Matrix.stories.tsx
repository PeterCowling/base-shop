// packages/ui/src/components/cms/blocks/HeaderSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import HeaderSection from './HeaderSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './HeaderSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof HeaderSection> = {
  title: 'CMS Blocks/HeaderSection/Matrix',
  component: HeaderSection,
  tags: ['autodocs'],
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof HeaderSection>;
const baseArgs = meta.args!;

try { z.object({ locale: z.string(), shopName: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid HeaderSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

