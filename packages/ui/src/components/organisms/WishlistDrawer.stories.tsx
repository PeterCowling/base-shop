import { type Meta, type StoryObj } from "@storybook/react";
import { Button } from "../atoms/shadcn";
import { WishlistDrawer } from "./WishlistDrawer";
import type { SKU } from "@acme/types";

const items: SKU[] = [
  {
    id: "1",
    slug: "item-one",
    title: "Item One",
    price: 10,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/64", type: "image" }],
    sizes: [],
    description: "",
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
