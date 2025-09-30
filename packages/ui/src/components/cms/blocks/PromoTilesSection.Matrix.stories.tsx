// packages/ui/src/components/cms/blocks/PromoTilesSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import PromoTilesSection from './PromoTilesSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './PromoTilesSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/PromoTilesSection/Matrix',
  component: PromoTilesSection,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
  parameters: { docs: { description: { component: 'Promotional tiles grid with images, captions and optional badges.' } } },
} satisfies Meta<typeof PromoTilesSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const TT = z.string();
const Tile = z.object({ imageSrc: z.string().optional(), imageAlt: TT.optional(), caption: TT.optional(), ctaLabel: TT.optional(), ctaHref: z.string().optional(), badge: z.enum(['rental','buy']).optional() });
try { z.object({ tiles: z.array(Tile), density: z.enum(['editorial','utilitarian']).optional() }).parse(fixture); } catch (e) { console.error('Invalid PromoTilesSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

