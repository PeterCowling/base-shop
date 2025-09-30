import { type Meta, type StoryObj } from "@storybook/react";
import { Footer } from "./Footer";

const meta = {
  component: Footer,
  args: {
    children: "Footer content",
    shopName: "My Shop",
  },
} satisfies Meta<typeof Footer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
