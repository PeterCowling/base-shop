import { type Meta, type StoryObj } from "@storybook/react";
import { CategoryCard } from "./CategoryCard";

const meta = {
  component: CategoryCard,
  args: {
    category: {
      id: "1",
      title: "Shoes",
      image: "https://placehold.co/300x300",
      description: "Shop our latest shoes",
    },
  },
} satisfies Meta<typeof CategoryCard>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
