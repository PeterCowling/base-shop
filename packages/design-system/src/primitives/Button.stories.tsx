import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Primitives/Button",
  component: Button,
  args: {
    children: "Click me",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Button {...args}>Default</Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} tone="soft" color="accent">
        Soft Accent
      </Button>
      <Button {...args} tone="ghost">
        Ghost
      </Button>
      <Button {...args} tone="quiet">
        Quiet
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="md" iconOnly aria-label="Icon button">
        🔍
      </Button>
    </div>
  ),
};
