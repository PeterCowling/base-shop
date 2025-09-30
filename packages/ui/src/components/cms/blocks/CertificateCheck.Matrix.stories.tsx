// packages/ui/src/components/cms/blocks/CertificateCheck.Matrix.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import CertificateCheck from './CertificateCheck';
import { makeStateStory } from '../../../story-utils/createStories';
import fixture from './CertificateCheck.fixtures.json';
import { z } from 'zod';

const meta: Meta<typeof CertificateCheck> = {
  title: 'CMS Blocks/CertificateCheck/Matrix',
  component: CertificateCheck,
  parameters: { docs: { autodocs: false } },
  args: { ...fixture },
};
export default meta;

type Story = StoryObj<typeof CertificateCheck>;
const baseArgs = meta.args!;

try { z.object({ placeholder: z.string().optional() }).parse(fixture); } catch (e) { console.error('Invalid CertificateCheck fixture:', e); }

const okAdapter = async () => ({ ok: true, message: 'Validated' });
const failAdapter = async () => ({ ok: false, message: 'Invalid' });

export const Default: Story = makeStateStory(baseArgs, { adapter: okAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });
export const ErrorState: Story = makeStateStory(baseArgs, { adapter: failAdapter }, 'default', { a11y: true, viewports: ['desktop'], tags: ['visual'] });

