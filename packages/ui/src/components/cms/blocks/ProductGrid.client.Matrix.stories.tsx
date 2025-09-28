// packages/ui/src/components/cms/blocks/ProductGrid.client.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse, delay } from 'msw';
import type { SKU } from '@acme/types';
import { PRODUCTS } from '@acme/platform-core/products/index';
import ProductGrid from './ProductGrid.client';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ProductGrid.client.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ProductGrid> = {
  title: 'CMS Blocks/ProductGrid/Matrix',
  component: ProductGrid,
  tags: ['autodocs'],
  args: {
    collectionId: 'demo',
    columns: 3,
    minItems: 3,
    maxItems: 9,
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Responsive product grid driven by explicit SKUs or \`collectionId\`. Stories showcase loading/empty/error and RTL.`,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ProductGrid>;
const baseArgs = meta.args!;

// Validate fixture shape
const FixtureSchema = z.object({
  collectionId: z.string().optional(),
  skus: z.array(z.object({ id: z.string() })).optional(),
  columns: z.number().optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
});
try {
  FixtureSchema.parse(fixture);
} catch (e) {
  console.error('Invalid ProductGrid fixture:', e);
}

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
});

export const Loading: Story = {
  ...makeStateStory(baseArgs, {}, 'loading', { viewports: ['mobile1'], tags: ['visual'] }),
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/collections\/.+/, async () => {
          await delay(1500);
          return HttpResponse.json({ items: PRODUCTS as SKU[] }, { status: 200 });
        }),
      ],
    },
  },
};

export const Empty: Story = {
  ...makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] }),
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/collections\/.+/, async () => {
          await delay(50);
          return HttpResponse.json({ items: [] }, { status: 200 });
        }),
      ],
    },
  },
};

export const Error: Story = {
  ...makeStateStory(baseArgs, {}, 'error', { a11y: true, critical: true, viewports: ['desktop'], tags: ['visual', 'ci'] }),
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/collections\/.+/, async () => {
          await delay(50);
          return HttpResponse.json({ error: 'mock-error' }, { status: 500 });
        }),
      ],
    },
  },
};

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
});
