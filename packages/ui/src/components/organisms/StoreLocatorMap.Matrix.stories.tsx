// packages/ui/src/components/organisms/StoreLocatorMap.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { StoreLocatorMap } from './StoreLocatorMap';
import { makeStateStory } from '../../story-utils/createStories';

const stores = [
  { name: 'San Francisco', address: '123 Market St, SF, CA', lat: 37.7749, lng: -122.4194 },
  { name: 'New York', address: '456 Broadway, NY, NY', lat: 40.7128, lng: -74.006 },
];

const meta: Meta<typeof StoreLocatorMap> = {
  title: 'Organisms/Store Locator Map/Matrix',
  component: StoreLocatorMap,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Map/list combo for store locations. Matrix covers loading/empty/error + RTL.',
      },
    },
  },
  args: {
    stores,
  },
};
export default meta;

type Story = StoryObj<typeof StoreLocatorMap>;
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

export const Empty: Story = makeStateStory(baseArgs, { stores: [] }, 'empty', {
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
