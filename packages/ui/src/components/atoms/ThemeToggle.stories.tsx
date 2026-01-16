import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ThemeToggle, type ThemeOption } from "./ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "Atoms/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    theme: {
      control: "select",
      options: ["base", "dark", "system"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    showLabels: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

function ThemeToggleDemo(props: Omit<React.ComponentProps<typeof ThemeToggle>, "theme" | "onThemeChange">) {
  const [theme, setTheme] = useState<ThemeOption>("system");
  return <ThemeToggle {...props} theme={theme} onThemeChange={setTheme} />;
}

export const Default: Story = {
  render: (args) => <ThemeToggleDemo {...args} />,
  args: {
    size: "sm",
    showLabels: false,
  },
};

export const WithLabels: Story = {
  render: (args) => <ThemeToggleDemo {...args} />,
  args: {
    size: "sm",
    showLabels: true,
  },
};

export const Medium: Story = {
  render: (args) => <ThemeToggleDemo {...args} />,
  args: {
    size: "md",
    showLabels: false,
  },
};

export const MediumWithLabels: Story = {
  render: (args) => <ThemeToggleDemo {...args} />,
  args: {
    size: "md",
    showLabels: true,
  },
};

export const LightSelected: Story = {
  args: {
    theme: "base",
    onThemeChange: () => {},
    size: "sm",
  },
};

export const DarkSelected: Story = {
  args: {
    theme: "dark",
    onThemeChange: () => {},
    size: "sm",
  },
};

export const SystemSelected: Story = {
  args: {
    theme: "system",
    onThemeChange: () => {},
    size: "sm",
  },
};
