import { type Meta, type StoryObj } from "@storybook/nextjs";

import HeaderClient from "./HeaderClient.client";

const meta: Meta<typeof HeaderClient> = {
  title: "Layout/HeaderClient",
  component: HeaderClient,
  tags: ["autodocs"],
  args: { lang: "en", initialQty: 0, height: "h-16", padding: "px-6" },
  argTypes: {
    height: { control: "text" },
    padding: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof HeaderClient> = {};
