// packages/ui/components/templates/AppShell.stories.tsx

import type { Meta, StoryObj } from "@storybook/nextjs";

import { AppShell } from "./AppShell";
import { buildAppShellArgs } from "./AppShell.story-helpers";

const baseArgs = buildAppShellArgs();

const meta = {
  title: "Layout/AppShell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "High-level layout wrapper that provides theme and navigation context. Supply header, side navigation and footer slots to compose full page chrome.",
      },
    },
  },
  args: baseArgs,
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCustomBackground: Story = {
  args: {
    ...baseArgs,
    className: "bg-bg",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pass Tailwind classes through `className` to match application-specific backgrounds or spacing requirements.",
      },
    },
  },
};
