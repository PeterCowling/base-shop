import type { Meta, StoryObj } from "@storybook/react";
import HeaderClient from "./HeaderClient.client";

const meta: Meta<typeof HeaderClient> = {
  title: "Layout/HeaderClient (Client)",
  component: HeaderClient,
  args: {
    links: [
      { href: "/", label: "Home" },
      { href: "/shop", label: "Shop" },
      { href: "/about", label: "About" },
    ],
    cta: { href: "/cart", label: "Cart" },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderClient>;

export const Default: Story = {};
