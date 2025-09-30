import { type Meta, type StoryObj } from "@storybook/react";
import { Icon, type IconProps } from "./Icon";

type IconStoryProps = IconProps & { size: number };

const meta = {
  title: "Atoms/Icon",
  component: Icon,
  argTypes: {
    name: { control: "radio", options: ["star", "heart", "user"] },
    size: { control: { type: "number", min: 12, max: 64 } },
  },
  args: { name: "heart", size: 24 },
} satisfies Meta<IconStoryProps>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Primary = {
  render: (args) => {
    const { size, ...rest } = args;
    return <Icon {...rest} width={size} height={size} />;
  },
} satisfies Story;
