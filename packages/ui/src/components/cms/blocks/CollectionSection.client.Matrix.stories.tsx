// packages/ui/src/components/cms/blocks/CollectionSection.client.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse, delay } from 'msw';
import type { SKU } from '@acme/types';
import { PRODUCTS } from '@acme/platform-core/products/index';
import CollectionSectionClient from './CollectionSection.client';
import fixture from './CollectionSection.client.fixtures.json';
import { z } from 'zod';
import { makeStateStory } from '../../../story-utils/createStories';

const meta = {
  title: 'CMS Blocks/CollectionSection/Matrix',
  component: CollectionSectionClient,
  parameters: { docs: { autodocs: false } },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Client-side collection grid with sorting, client filters and load more/SSR pagination. Uses /api/collections/:slug; stories simulate delay/empty/error.\n\nUsage:\n\n\`\`\`tsx\nimport CollectionSectionClient from './CollectionSection.client';\nimport { PRODUCTS } from '@acme/platform-core/products';\n\n<CollectionSectionClient\n  initial={PRODUCTS}\n  params={{ slug: 'demo' }}\n  paginationMode="loadMore"\n  pageSize={12}\n/>\n\n// Key args: initial, params.slug, paginationMode, pageSize\n\`\`\``,
      },
    },
  },
  args: {
    initial: PRODUCTS as SKU[],
    params: { slug: 'demo' },
    paginationMode: 'loadMore',
  },
} satisfies Meta<typeof CollectionSectionClient>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

// Validate fixture shape at story init (errors render in Canvas console)
const FixtureSchema = z.object({
  initial: z.array(z.object({ id: z.string(), slug: z.string(), title: z.string().optional(), price: z.number().optional() })).optional(),
  params: z.object({ slug: z.string() }),
  paginationMode: z.enum(['loadMore', 'ssr']).optional(),
  pageSize: z.number().optional(),
});
try {
  FixtureSchema.parse(fixture);
} catch (e) {
  console.error('Invalid CollectionSection fixture:', e);
}

export const Default = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Client-side collection with initial items and load-more UX.',
}) satisfies Story;

export const Loading = {
  ...makeStateStory(baseArgs, {}, 'loading', {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Simulates a slow network response to show the loading hint.',
  }),
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/collections\/.+/, async () => {
          await delay(1500);
          return HttpResponse.json({ items: PRODUCTS }, { status: 200 });
        }),
      ],
    },
  },
} satisfies Story;

export const Empty = {
  ...makeStateStory(baseArgs, {}, 'empty', {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Returns an empty list to exercise empty state rendering.',
  }),
  parameters: {
    msw: {
      handlers: [
        http.get(/\/api\/collections\/.+/, async () => {
          await delay(100);
          return HttpResponse.json({ items: [] }, { status: 200 });
        }),
      ],
    },
  },
} satisfies Story;

export const Error = {
  ...makeStateStory(baseArgs, {}, 'error', {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Forces a 500 to verify error surfaces and a11y.',
  }),
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
  docsDescription: 'RTL rendering of grid and controls.',
}) satisfies Story;
