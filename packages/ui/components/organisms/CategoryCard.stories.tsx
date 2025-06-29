import { type Meta, type StoryObj } from "@storybook/react";
import { CategoryCard } from "./CategoryCard";

const meta: Meta<typeof CategoryCard> = {
  component: CategoryCard,
  args: {
    category: {
      id: "1",
      title: "Shoes",
      image: "https://placehold.co/300x300",
      description: "Shop our latest shoes",
    },
  },
};
export default meta;

export const Default: StoryObj<typeof CategoryCard> = {};
