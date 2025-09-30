// packages/ui/src/components/cms/blocks/CartSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CartSection from './CartSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta: Meta<typeof CartSection> = {
  title: 'CMS Blocks/CartSection/Matrix',
  component: CartSection,
  parameters: { docs: { autodocs: false } },
};
export default meta;

type Story = StoryObj<typeof CartSection>;
export const Default: Story = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

