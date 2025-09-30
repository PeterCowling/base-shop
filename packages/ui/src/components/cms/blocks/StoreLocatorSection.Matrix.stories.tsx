// packages/ui/src/components/cms/blocks/StoreLocatorSection.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import StoreLocatorSection from './StoreLocatorSection';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './StoreLocatorSection.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/StoreLocatorSection/Matrix',
  component: StoreLocatorSection,
  parameters: { docs: { autodocs: false } },
  args: { stores: fixture.stores, enableGeolocation: false, radiusKm: 100, emitLocalBusiness: false },
  parameters: { docs: { description: { component: 'Store locator with optional geolocation filtering and JSON-LD emission for selected store.' } } },
} satisfies Meta<typeof StoreLocatorSection>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

const Store = z.object({ id: z.string(), label: z.string(), lat: z.number(), lng: z.number(), address: z.string().optional(), phone: z.string().optional(), openingHours: z.array(z.string()).optional(), url: z.string().optional(), stockNote: z.string().optional() });
try { z.object({ stores: z.array(Store), enableGeolocation: z.boolean().optional(), radiusKm: z.number().optional(), emitLocalBusiness: z.boolean().optional() }).parse(fixture); } catch (e) { console.error('Invalid StoreLocatorSection fixture:', e); }

export const Default = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const RTL = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] }) satisfies Story;

