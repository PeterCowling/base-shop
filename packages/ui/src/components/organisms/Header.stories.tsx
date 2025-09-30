import { type Meta, type StoryObj } from "@storybook/react";
import { Header } from "./Header";

const meta = {
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
} satisfies Meta<typeof Header>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
