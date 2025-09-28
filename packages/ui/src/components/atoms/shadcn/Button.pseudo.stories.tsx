// packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button/Pseudo States',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button' },
  parameters: {
    pseudo: { hover: true, focus: true, active: true, disabled: true },
    design: {
      type: 'image',
      name: 'Button spec (placeholder)',
      url: '/themes/brandx.svg',
    },
    docs: {
      description: {
        component: `Interactive button demonstrating pseudo states (hover, focus, active, disabled).\n\nUsage:\n\n\`\`\`tsx\nimport { Button } from '../atoms/shadcn';\n\n<Button>Click me</Button>\n<Button variant="secondary">Secondary</Button>\n<Button variant="destructive">Delete</Button>\n\n// Key args: variant, size ('icon'|'sm'), disabled\n\`\`\``,
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Icon: Story = { args: { size: 'icon', children: '★' } };
