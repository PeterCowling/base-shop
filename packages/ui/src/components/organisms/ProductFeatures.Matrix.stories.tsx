// packages/ui/src/components/organisms/ProductFeatures.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProductFeatures } from './ProductFeatures';
import { makeStateStory } from '../../story-utils/createStories';

const features = [
  { title: 'Waterproof shell', description: 'Sealed seams and DWR coating.' },
  { title: 'Recycled fill', description: '80% recycled insulation for warmth.' },
  { title: 'Packable hood', description: 'Zips into collar for travel.' },
];

const meta: Meta<typeof ProductFeatures> = {
  title: 'Organisms/Product Features/Matrix',
  component: ProductFeatures,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Feature list used on PDPs. Matrix covers loading/empty/error + RTL for launch confidence.',
      },
    },
  },
  args: {
    features,
  },
};
export default meta;

type Story = StoryObj<typeof ProductFeatures>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Empty: Story = makeStateStory(baseArgs, { features: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
