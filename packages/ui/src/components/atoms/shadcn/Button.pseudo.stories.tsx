// packages/ui/src/components/atoms/shadcn/Button.pseudo.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
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
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;



export const Default = {} satisfies Story;
export const Disabled = { args: { disabled: true } } satisfies Story;
export const Icon = { args: { size: 'icon', children: '★' } } satisfies Story;
