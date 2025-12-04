import { type Meta, type StoryObj } from "@storybook/nextjs";
import { CategoryCollectionTemplate } from "./CategoryCollectionTemplate";

const meta: Meta<typeof CategoryCollectionTemplate> = {
  title: "Templates/CategoryCollectionTemplate",
  component: CategoryCollectionTemplate,
  args: {
    categories: [
      { id: "1", title: "Category 1", image: "/placeholder.svg" },
      { id: "2", title: "Category 2", image: "/placeholder.svg" },
      { id: "3", title: "Category 3", image: "/placeholder.svg" },
    ],
    columns: 3,
  },
  argTypes: {
    categories: { control: "object" },
    columns: { control: { type: "number" } },
  },
};
export default meta;

export const Default: StoryObj<typeof CategoryCollectionTemplate> = {};
