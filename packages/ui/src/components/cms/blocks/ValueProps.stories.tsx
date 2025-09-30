import type { Meta, StoryObj } from "@storybook/react";
import ValueProps from "./ValueProps";

const meta = {
  title: "CMS/Blocks/ValueProps",
  component: ValueProps,
  tags: ["autodocs"],
} satisfies Meta<typeof ValueProps>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
