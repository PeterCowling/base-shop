import { type Meta, type StoryObj } from "@storybook/react";
import Footer from "./Footer";

const meta = {
  title: "Layout/FooterComponent",
  component: Footer,
  tags: ["autodocs"],
  args: {
    height: "h-16",
  },
  argTypes: {
    height: { control: "text" },
    padding: { control: "text" },
  },
} satisfies Meta<typeof Footer>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
