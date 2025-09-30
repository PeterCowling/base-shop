import { type Meta, type StoryObj } from "@storybook/react";
import ValueProps from "./ValueProps";

const meta = {
  component: ValueProps,
  args: {},
} satisfies Meta<typeof ValueProps>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
