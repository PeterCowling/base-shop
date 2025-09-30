import type { Meta, StoryObj } from '@storybook/react';
import ThemeToggle from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Theme toggle backed by the platform ThemeContext; Storybook config seeds the provider so toggling works out of the box.',
      },
    },
    providers: {
      theme: { initial: 'base' },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof ThemeToggle> = {};

