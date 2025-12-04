// packages/ui/src/components/cms/blocks/PromoTilesSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import PromoTilesSection from './PromoTilesSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PromoTilesSection.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof PromoTilesSection> = {
  title: 'CMS Blocks/PromoTilesSection/Matrix',
  component: PromoTilesSection,
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Promotional tiles grid with images, captions and optional badges.' } } },
};
export default meta;

type Story = StoryObj<typeof PromoTilesSection>;
const baseArgs = meta.args!;

const TT = z.string();
const Tile = z.object({ imageSrc: z.string().optional(), imageAlt: TT.optional(), caption: TT.optional(), ctaLabel: TT.optional(), ctaHref: z.string().optional(), badge: z.enum(['rental','buy']).optional() });
try { z.object({ tiles: z.array(Tile), density: z.enum(['editorial','utilitarian']).optional() }).parse(fixture); } catch (e) { console.error('Invalid PromoTilesSection fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
