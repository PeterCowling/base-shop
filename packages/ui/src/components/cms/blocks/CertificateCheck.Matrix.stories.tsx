// packages/ui/src/components/cms/blocks/CertificateCheck.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CertificateCheck from './CertificateCheck';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CertificateCheck.fixtures.json';
import { z } from 'zod';

const meta = {
  title: 'CMS Blocks/CertificateCheck/Matrix',
  component: CertificateCheck,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
} satisfies Meta<typeof CertificateCheck>;
export default meta;

type Story = StoryObj<typeof meta>;


const baseArgs = meta.args!;

try { z.object({ placeholder: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid CertificateCheck fixture:', e); }

const okAdapter = async () => ({ ok: true, message: 'Validated' });
const failAdapter = async () => ({ ok: false, message: 'Invalid' });

export const Default = makeStateStory(baseArgs, { adapter: okAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;
export const ErrorState = makeStateStory(baseArgs, { adapter: failAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] }) satisfies Story;

