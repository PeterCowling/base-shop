import { type Meta, type StoryObj } from "@storybook/nextjs";
import { expect, within } from "@storybook/test";

import { Icon, type IconProps } from "./Icon";

type IconStoryProps = IconProps & { size: number };

const meta: Meta<IconStoryProps> = {
  title: "Atoms/Icon",
  component: Icon,
  argTypes: {
    name: { control: "radio", options: ["star", "heart", "user"] },
    size: { control: { type: "number", min: 12, max: 64 } },
  },
  args: { name: "heart", size: 24 },
};
export default meta;

export const Primary: StoryObj<IconStoryProps> = {
  render: (args) => {
    const { size, ...rest } = args;
    return <Icon {...rest} width={size} height={size} />;
  },
};

export const Default: StoryObj = {};

export const MissingIconFallback: StoryObj<IconStoryProps> = {
  render: (args) => {
    const { size, ...rest } = args;
    return <Icon {...rest} width={size} height={size} />;
  },
  args: {
    name: "nonexistent-icon-name",
    size: 24,
  },
  parameters: { a11y: true, tags: ["visual", "ci"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const img = canvas.getByRole("img", { hidden: true });
    expect(img).toBeInTheDocument();
  },
};
