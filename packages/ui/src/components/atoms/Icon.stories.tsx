import { type Meta, type StoryObj } from "@storybook/nextjs";
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
