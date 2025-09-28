import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '@platform-core/contexts/ThemeContext';

const meta: Meta<typeof ThemeToggle> = {
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
};
export default meta;

export const Default: StoryObj<typeof ThemeToggle> = {};

