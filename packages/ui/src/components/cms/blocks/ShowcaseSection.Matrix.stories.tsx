// packages/ui/src/components/cms/blocks/ShowcaseSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse, delay } from 'msw';
import ShowcaseSection from './ShowcaseSection';
import { PRODUCTS } from '@acme/platform-core/products/index';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './ShowcaseSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof ShowcaseSection> = {
  title: 'CMS Blocks/ShowcaseSection/Matrix',
  component: ShowcaseSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `Showcase of product recommendations. Supports carousel and grid layouts; stories mock API to demonstrate loading/empty/error and RTL.\n\nUsage:\n\n\`\`\`tsx\nimport ShowcaseSection from './ShowcaseSection';\n\n<ShowcaseSection preset="featured" layout="carousel" />\n<ShowcaseSection preset="bestsellers" layout="grid" gridCols={3} />\n\n// Key args: preset, layout ('carousel'|'grid'), gridCols\n\`\`\``,
      },
    },
  },
  args: { preset: 'featured', layout: 'carousel' },
};
export default meta;

type Story = StoryObj<typeof ShowcaseSection>;
const baseArgs = meta.args!;

// Validate fixture shape (preset/layout/gridCols)
const FixtureSchema = z.object({
  preset: z.enum(['featured', 'new', 'bestsellers', 'clearance', 'limited']).optional(),
  layout: z.enum(['carousel', 'grid']).optional(),
  gridCols: z.number().optional(),
});
try {
  FixtureSchema.parse(fixture);
} catch (e) {
  console.error('Invalid ShowcaseSection fixture:', e);
}

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Carousel layout showing recommendations for the selected preset.',
});

export const Loading: Story = {
  ...makeStateStory(baseArgs, {}, 'loading', {
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Delays API to demonstrate the built-in LoadingState.',
  }),
  parameters: {
    msw: {
      handlers: [
        http.get('/api/recommendations', async () => {
          await delay(1500);
          return HttpResponse.json(PRODUCTS.slice(0, 6), { status: 200 });
        }),
      ],
    },
  },
};

export const Empty: Story = {
  ...makeStateStory(baseArgs, { layout: 'grid', gridCols: 3 }, 'empty', {
    a11y: true,
    viewports: ['mobile1'],
    tags: ['visual'],
    docsDescription: 'Grid layout returning an empty list.',
  }),
  parameters: {
    msw: {
      handlers: [
        http.get('/api/recommendations', async () => {
          await delay(50);
          return HttpResponse.json([], { status: 200 });
        }),
      ],
    },
  },
};

export const Error: Story = {
  ...makeStateStory(baseArgs, {}, 'error', {
    a11y: true,
    critical: true,
    viewports: ['desktop'],
    tags: ['visual', 'ci'],
    docsDescription: 'Forces a 500 to validate error surfaces and a11y.',
  }),
  parameters: {
    msw: {
      handlers: [
        http.get('/api/recommendations', async () => {
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
  docsDescription: 'RTL sample for both carousel and grid layouts.',
});
