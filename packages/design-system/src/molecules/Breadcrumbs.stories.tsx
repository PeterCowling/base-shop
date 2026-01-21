import type { Meta, StoryObj } from "@storybook/nextjs";

import Breadcrumbs from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Molecules/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Home", href: "/" },
      { label: "Category", href: "/category" },
      { label: "Item" },
    ],
  },
};
export default meta;

export const Default: StoryObj<typeof Breadcrumbs> = {};
