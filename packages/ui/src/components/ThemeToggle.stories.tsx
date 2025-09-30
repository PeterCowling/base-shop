import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '@platform-core/contexts/ThemeContext';

const meta = {
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Theme toggle with a minimal Storybook-only ThemeContext stub. Click to cycle between light, dark, and system.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider initial="base">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

