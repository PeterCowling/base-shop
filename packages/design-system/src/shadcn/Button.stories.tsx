import { type Meta, type StoryObj } from "@storybook/nextjs";

import { Button } from "./Button";

const variantOptions = ["default", "outline", "ghost", "destructive"] as const;
const colorOptions = [
  "default",
  "primary",
  "accent",
  "success",
  "info",
  "warning",
  "danger",
] as const;
const toneOptions = ["solid", "soft", "outline", "ghost"] as const;
const sizeOptions = ["default", "sm", "icon"] as const;

const meta = {
  title: "Atoms/Shadcn/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
    variant: "default",
    iconOnly: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      options: variantOptions,
      control: { type: "inline-radio" },
      description:
        "Legacy preset that derives color/tone. Leave empty when manually selecting color + tone.",
    },
    color: {
      options: colorOptions,
      control: { type: "select" },
      description: "Semantic color intent applied when tone is provided.",
    },
    tone: {
      options: toneOptions,
      control: { type: "inline-radio" },
      description: "Visual tone that pairs with the selected color.",
    },
    size: {
      options: sizeOptions,
      mapping: {
        default: undefined,
        sm: "sm",
        icon: "icon",
      },
      control: {
        type: "inline-radio",
        labels: {
          default: "Default",
          sm: "Small",
          icon: "Icon",
        },
      },
      description: "Optional size overrides for compact or icon-only buttons.",
    },
    iconOnly: {
      control: { type: "boolean" },
      description: "Hide button text and render icon-only layout (provide aria-label).",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Render the button in a disabled state.",
    },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  parameters: {
    controls: {
      include: ["children", "variant", "color", "tone", "size", "iconOnly", "disabled"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const IconOnly: Story = {
  args: {
    iconOnly: true,
    size: "icon",
    children: "More options",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Set `iconOnly` together with the icon size override to render square icon buttons.",
      },
    },
  },
};
