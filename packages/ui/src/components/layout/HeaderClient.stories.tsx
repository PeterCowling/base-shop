import { type Meta, type StoryObj } from "@storybook/react";
import HeaderClient from "./HeaderClient.client";

const meta = {
  title: "Layout/HeaderClient",
  component: HeaderClient,
  tags: ["autodocs"],
  args: { lang: "en", initialQty: 0, height: "h-16", padding: "px-6" },
  argTypes: {
    height: { control: "text" },
    padding: { control: "text" },
  },
} satisfies Meta<typeof HeaderClient>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
