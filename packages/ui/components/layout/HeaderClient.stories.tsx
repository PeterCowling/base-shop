import { type Meta, type StoryObj } from "@storybook/react";
import HeaderClient from "./HeaderClient.client";

const meta: Meta<typeof HeaderClient> = {
  title: "Layout/HeaderClient",
  component: HeaderClient,
  tags: ["autodocs"],
  args: { lang: "en", initialQty: 0 },
};
export default meta;

export const Default: StoryObj<typeof HeaderClient> = {};
