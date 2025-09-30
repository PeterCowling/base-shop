import { type Meta, type StoryObj } from "@storybook/react";
import type { SKU } from "@acme/types";
import type { ChatMessage } from "./LiveShoppingEventTemplate";
import { LiveShoppingEventTemplate } from "./LiveShoppingEventTemplate";

const products: SKU[] = [
  {
    id: "1",
    slug: "product-1",
    title: "Product 1",
    price: 1000,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "product-2",
    title: "Product 2",
    price: 1500,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "https://placehold.co/300", type: "image" }],
    sizes: [],
    description: "",
  },
];

const chatMessages: ChatMessage[] = [
  { id: "1", user: "Alice", message: "Hello" },
  { id: "2", user: "Bob", message: "Great deal!" },
];

const meta = {
  component: LiveShoppingEventTemplate,
  args: {
    streamUrl: "video.mp4",
    products,
    chatMessages,
  },
} satisfies Meta<typeof LiveShoppingEventTemplate>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
