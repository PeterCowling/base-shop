import { type Meta, type StoryObj } from "@storybook/react";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  component: Header,
  args: {
    locale: "en",
    nav: [
      { title: "Home", href: "#" },
      { title: "Shop", href: "#" },
    ],
    searchSuggestions: ["Shoes", "Shirts"],
  },
};
export default meta;

export const Default: StoryObj<typeof Header> = {};
