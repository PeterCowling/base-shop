// packages/ui/src/components/templates/WishlistTemplate.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';

import { makeStateStory } from '../../story-utils/createStories';

import type { WishlistItem } from './WishlistTemplate';
import { WishlistTemplate } from './WishlistTemplate';

const items: WishlistItem[] = [
  {
    id: 'wl-boot',
    slug: 'alpine-boot',
    title: 'Alpine Boot',
    price: 28900,
    deposit: 0,
    stock: 4,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/200/png', type: 'image' }],
    sizes: ['8', '9', '10', '11'],
    description: 'Waterproof leather boot for winter drops.',
    quantity: 1,
  },
  {
    id: 'wl-coat',
    slug: 'storm-coat',
    title: 'Storm Coat',
    price: 34900,
    deposit: 0,
    stock: 2,
    forSale: true,
    forRental: false,
    media: [{ url: 'https://placehold.co/200/jpg', type: 'image' }],
    sizes: ['S', 'M', 'L'],
    description: 'Insulated parka with taped seams.',
    quantity: 1,
  },
];

const meta: Meta<typeof WishlistTemplate> = {
  title: 'Templates/Wishlist/Matrix',
  component: WishlistTemplate,
  parameters: {
    docs: {
      autodocs: false,
      description: {
        component:
          'Wishlist page shell with add-to-cart/remove actions. Matrix covers loading/empty/error/RTL to keep high-intent flows safe.',
      },
    },
  },
  args: {
    items,
    onAddToCart: () => {},
    onRemove: () => {},
    ctaAddToCartLabel: 'Add to cart',
    ctaRemoveLabel: 'Remove',
  },
};
export default meta;

type Story = StoryObj<typeof WishlistTemplate>;
const baseArgs = meta.args!;

export const Default: Story = makeStateStory(baseArgs, {}, 'default', {
  a11y: true,
  viewports: ['desktop'],
  tags: ['visual'],
  docsDescription: 'Two saved items with add-to-cart and remove actions.',
});

export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', {
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Simulated loading while wishlist fetches.',
});

export const Empty: Story = makeStateStory(baseArgs, { items: [] }, 'empty', {
  a11y: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'Empty wishlist copy for new shoppers.',
});

export const Error: Story = makeStateStory(baseArgs, {}, 'error', {
  a11y: true,
  critical: true,
  viewports: ['desktop'],
  tags: ['visual', 'ci'],
  docsDescription: 'Error surface for wishlist service failures.',
});

export const RTL: Story = makeStateStory(baseArgs, {}, 'default', {
  rtl: true,
  viewports: ['mobile1'],
  tags: ['visual'],
  docsDescription: 'RTL rendering of wishlist rows and actions.',
});
