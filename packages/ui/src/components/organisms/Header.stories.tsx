import { type Meta, type StoryObj } from "@storybook/react";
import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  component: Header,
  parameters: {
    docs: {
      description: {
        component: 'Responsive site header with logo, navigation, language switcher and optional search field.',
      },
    },
  },
  args: {
    locale: "en",
    nav: [
      { title: "Home", href: "#" },
      { title: "Shop", href: "#" },
    ],
    searchSuggestions: ["Shoes", "Shirts"],
    shopName: "My Shop",
  },
};
export default meta;

export const Default: StoryObj<typeof Header> = {};
