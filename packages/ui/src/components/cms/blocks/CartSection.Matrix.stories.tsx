// packages/ui/src/components/cms/blocks/CartSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CartSection from './CartSection';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/CartSection/Matrix',
  component: CartSection,
  parameters: { docs: { autodocs: false } },
} satisfies Meta<typeof CartSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = makeStateStory({}, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

