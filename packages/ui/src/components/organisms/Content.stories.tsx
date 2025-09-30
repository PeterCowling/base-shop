import { type Meta, type StoryObj } from "@storybook/react";
import { Content } from "./Content";

const meta = {
  component: Content,
  args: {
    children: "Main content",
  },
} satisfies Meta<typeof Content>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
