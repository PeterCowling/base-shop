import { type Meta, type StoryObj } from "@storybook/react";
import { WishlistTemplate, type WishlistItem } from "./WishlistTemplate";

const items: WishlistItem[] = [
  {
    id: "1",
    slug: "product-one",
    title: "Product One",
    price: 29.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/64", type: "image" }],
    sizes: [],
    description: "",
    quantity: 1,
  },
  {
    id: "2",
    slug: "product-two",
    title: "Product Two",
    price: 49.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/64", type: "image" }],
    sizes: [],
    description: "",
    quantity: 2,
  },
];

const meta = {
  component: WishlistTemplate,
  args: { items },
} satisfies Meta<typeof WishlistTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
