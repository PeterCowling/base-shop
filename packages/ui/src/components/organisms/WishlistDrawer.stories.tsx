import { type Meta, type StoryObj } from "@storybook/react";
import { Button } from "../atoms/shadcn";
import { WishlistDrawer } from "./WishlistDrawer";

const items = [
  {
    id: "1",
    title: "Item One",
    media: [{ url: "https://placehold.co/64", type: "image" }],
    price: 10,
  },
];

const meta: Meta<typeof WishlistDrawer> = {
  component: WishlistDrawer,
  args: {
    trigger: <Button>Open wishlist</Button>,
    items,
  },
};
export default meta;

export const Default: StoryObj<typeof WishlistDrawer> = {};
