// packages/ui/src/components/templates/StoreLocatorTemplate.Matrix.stories.tsx

import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { expect, userEvent, within } from '@storybook/test';

import { makeStateStory } from '../../story-utils/createStories';

import type { Store } from './StoreLocatorTemplate';
import { StoreLocatorTemplate } from './StoreLocatorTemplate';

const stores: Store[] = [
  { id: 'sf', name: 'San Francisco', address: '123 Market St, SF, CA', lat: 37.7749, lng: -122.4194 },
  { id: 'nyc', name: 'New York', address: '456 Broadway, NY, NY', lat: 40.7128, lng: -74.006 },
  { id: 'la', name: 'Los Angeles', address: '789 Sunset Blvd, LA, CA', lat: 34.0522, lng: -118.2437 },
];

const meta: Meta<typeof StoreLocatorTemplate> = {
  title: 'Templates/Store Locator/Matrix',
  component: StoreLocatorTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Store locator grid with optional map slot. Matrix ensures we render correctly when stores are empty, loading, or failing, plus RTL.',
      },
    },
  },
  args: {
    stores,
    map: <div className="h-full w-full rounded-md bg-muted">Map placeholder</div>,
  },
};
export default meta;

type Story = StoryObj<typeof StoreLocatorTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Three-store list with map placeholder.',
});

export const Loading: Story = makeStateStory(baseArgs, { stores: stores.slice(0, 1) }, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Partial list to mimic a loading state from the locator API.',
});

export const Empty: Story = makeStateStory(baseArgs, { stores: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty locator when no stores are configured.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error state for store API failure.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL list alignment and map region.',
});

export const GeoDenied: Story = makeStateStory(
  { ...baseArgs, stores: [] },
  {
    map: (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed border-danger bg-danger-soft text-sm text-danger-foreground">
        <p className="font-medium text-danger-foreground">Location blocked</p>
        <p className="text-center text-muted-foreground">
          Enable location or search manually to find a pickup location.
        </p>
      </div>
    ),
    stores: [],
  },
  'error',
  {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Geolocation denied guardrail with manual search guidance.',
  }
);

const SelectStoreInteractionRender = () => {
  const [selected, setSelected] = React.useState<string | undefined>();
  return (
    <StoreLocatorTemplate
      stores={stores}
      selectedStoreId={selected}
      onSelectStore={(store) => setSelected(store.id)}
      map={
        <div className="flex h-full w-full flex-col justify-center rounded-md bg-accent-soft p-3 text-sm text-foreground">
          <p className="font-medium text-accent-foreground">Selected store</p>
          <p className="text-muted-foreground">
            {selected ? stores.find((s) => s.id === selected)?.name : 'None selected'}
          </p>
        </div>
      }
    />
  );
};

export const SelectStoreInteraction: Story = {
  render: SelectStoreInteractionRender,
  parameters: {
    a11y: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docs: { description: { story: 'Selectable store list updates the map detail panel.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const la = await canvas.findByText(/Los Angeles/i);
    await userEvent.click(la);
    const selectedLabel = canvas.getByText(/Selected store/i);
    const selectedValue = selectedLabel.nextElementSibling?.textContent ?? '';
    expect(selectedValue).toContain('Los Angeles');
  },
};
