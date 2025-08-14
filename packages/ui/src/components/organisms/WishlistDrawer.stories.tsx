import { type Meta, type StoryObj } from "@storybook/react";
import { Button } from "../atoms/shadcn";
import { WishlistDrawer } from "./WishlistDrawer";
import type { SKU } from "@acme/types";

// Sample SKU items used to populate the wishlist drawer story.
// Each item requires a media gallery to satisfy the SKU type.
const wishlistItems: SKU[] = [
  {
    id: "1",
    slug: "item-one",
    title: "Item One",
    price: 10,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [
      {
        url: "https://placehold.co/64",
        type: "image",
        altText: "Item One image",
      },
    ],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "item-two",
    title: "Item Two",
    price: 20,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [
      {
        url: "https://placehold.co/64",
        type: "image",
        altText: "Item Two image",
      },
    ],
    sizes: [],
    description: "",
  },
];

const meta: Meta<typeof WishlistDrawer> = {
  component: WishlistDrawer,
  args: {
    trigger: <Button>Open wishlist</Button>,
    items: wishlistItems,
  },
};
export default meta;

export const Default: StoryObj<typeof WishlistDrawer> = {};
