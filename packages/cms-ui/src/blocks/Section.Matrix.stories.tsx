// packages/ui/src/components/cms/blocks/Section.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/nextjs';
import { z } from 'zod';

import { makeStateStory } from '../../../story-utils/createStories';

import Section from './Section';
import fixture from './Section.fixtures.json';

const meta: Meta<typeof Section> = {
  title: 'CMS Blocks/Section/Matrix',
  component: Section,
  args: { ...fixture, children: <div className="p-6 text-center">Section Content</div> },
};
export default meta;

type Story = StoryObj<typeof Section>;
const baseArgs = meta.args!;

try { z.object({ padding: z.string().optional(), backgroundColor: z.string().optional(), contentWidth: z.union([z.string(), z.enum(['full','wide','normal','narrow'])]).optional(), density: z.enum(['compact','spacious']).optional(), contentAlign: z.enum(['left','center','right']).optional(), topShapePreset: z.enum(['wave','tilt','curve','mountain','triangle']).optional(), topShapeColor: z.string().optional(), topShapeHeight: z.number().optional() }).parse(fixture); } catch (e) { console.error('Invalid Section fixture:', e); }

export const Default: Story = makeStateStory(baseArgs, {}, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });


export const Loading: Story = makeStateStory(baseArgs, {}, 'loading', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Empty: Story = makeStateStory(baseArgs, {}, 'empty', { a11y: true, viewports: ['mobile1'], tags: ['visual'] });
export const Error: Story = makeStateStory(baseArgs, {}, 'error', { critical: true, viewports: ['desktop'], tags: ['visual'] });
export const RTL: Story = makeStateStory(baseArgs, {}, 'default', { rtl: true, viewports: ['mobile1'], tags: ['visual'] });
