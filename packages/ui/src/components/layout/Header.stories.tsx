import { type Meta, type StoryObj } from "@storybook/nextjs";

import HeaderClient from "./HeaderClient.client";

const meta: Meta<typeof HeaderClient> = {
  title: "Layout/Header",
  component: HeaderClient,
  args: {
    lang: "en",
    height: "h-16",
    padding: "px-6",
    initialQty: 2,
    nav: [
      { label: "Home", url: "/" },
      { label: "Products", url: "/products" },
      { label: "About", url: "/about" },
    ],
  },
  argTypes: {
    lang: { control: "text" },
    height: { control: "text" },
    padding: { control: "text" },
    initialQty: { control: "number" },
  },
  parameters: {
    providers: {
      cart: true,
    },
  },
};
export default meta;

export const Default: StoryObj<typeof HeaderClient> = {};
