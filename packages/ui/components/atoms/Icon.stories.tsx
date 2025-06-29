import { type Meta, type StoryObj } from "@storybook/react";
import { Icon } from "./Icon";

type IconStoryProps = { size: number };

const meta: Meta<typeof Icon & IconStoryProps> = {
  title: "Atoms/Icon",
  component: Icon,
  argTypes: {
    name: { control: "radio", options: ["star", "heart", "user"] },
    size: { control: { type: "number", min: 12, max: 64 } },
  },
  args: { name: "heart", size: 24 },
};
export default meta;

export const Primary: StoryObj<typeof Icon & IconStoryProps> = {
  render: (args) => (
    <Icon name={args.name as any} width={args.size} height={args.size} />
  ),
};
