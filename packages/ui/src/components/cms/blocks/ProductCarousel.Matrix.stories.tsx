// packages/ui/src/components/cms/blocks/ProductCarousel.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse, delay } from 'msw';
import type { SKU } from '@acme/types';
import { PRODUCTS } from '@acme/platform-core/products/index';
import CmsProductCarousel from './ProductCarousel';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ProductCarousel.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/ProductCarousel/Matrix',
  component: CmsProductCarousel,
  parameters: { docs: { autodocs: false } },
  args: {
    collectionId: 'demo',
    minItems: 1,
    maxItems: 4,
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Carousel of products driven by explicit SKUs or a \`collectionId\` via /api/collections/:id. Stories simulate loading/empty/error and RTL.`,
      },
    },
  },
} satisfies Meta<typeof CmsProductCarousel>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

// Validate fixture shape: skus[] | collectionId + sizing props
const FixtureSchema = z.object({
  collectionId: z.string().optional(),
  skus: z.array(z.object({ id: z.string() })).optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
});
try {
  FixtureSchema.parse(fixture);
} catch (e) {
  console.error('Invalid ProductCarousel fixture:', e);
}

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
}) satisfies Story;

export const Loading = {
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
} satisfies Story;

export const Empty = {
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
} satisfies Story;

export const Error = {
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
} satisfies Story;

export const RTL = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
}) satisfies Story;
