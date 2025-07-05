import { type Meta, type StoryObj } from "@storybook/react";
import { WishlistTemplate, type WishlistItem } from "./WishlistTemplate";

const items: WishlistItem[] = [
  {
    id: "1",
    title: "Product One",
    image: "https://placehold.co/64",
    price: 29.99,
    quantity: 1,
  },
  {
    id: "2",
    title: "Product Two",
    image: "https://placehold.co/64",
    price: 49.99,
    quantity: 2,
  },
];

const meta: Meta<typeof WishlistTemplate> = {
  component: WishlistTemplate,
  args: { items },
};
export default meta;

export const Default: StoryObj<typeof WishlistTemplate> = {};
