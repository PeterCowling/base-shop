// packages/ui/src/components/cms/blocks/GuidedSellingSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import GuidedSellingSection from './GuidedSellingSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta: Meta<typeof GuidedSellingSection> = {
  title: 'CMS Blocks/GuidedSellingSection/Matrix',
  component: GuidedSellingSection,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof GuidedSellingSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

