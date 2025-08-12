import { type Meta, type StoryObj } from "@storybook/react";
import type { Product } from "../organisms/ProductCard";
import type { ChatMessage } from "./LiveShoppingEventTemplate";
import { LiveShoppingEventTemplate } from "./LiveShoppingEventTemplate";

const products: Product[] = [
  {
    id: "1",
    title: "Product 1",
    media: [{ url: "https://placehold.co/300", type: "image" }],
    price: 1000,
  },
  {
    id: "2",
    title: "Product 2",
    media: [{ url: "https://placehold.co/300", type: "image" }],
    price: 1500,
  },
];

const chatMessages: ChatMessage[] = [
  { id: "1", user: "Alice", message: "Hello" },
  { id: "2", user: "Bob", message: "Great deal!" },
];

const meta: Meta<typeof LiveShoppingEventTemplate> = {
  component: LiveShoppingEventTemplate,
  args: {
    streamUrl: "video.mp4",
    products,
    chatMessages,
  },
};
export default meta;

export const Default: StoryObj<typeof LiveShoppingEventTemplate> = {};
