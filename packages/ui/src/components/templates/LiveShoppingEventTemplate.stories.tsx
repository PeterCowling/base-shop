import { type Meta, type StoryObj } from "@storybook/nextjs";
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

const meta: Meta<typeof LiveShoppingEventTemplate> = {
  title: "Templates/LiveShoppingEventTemplate",
  component: LiveShoppingEventTemplate,
  args: {
    streamUrl: "video.mp4",
    products,
    chatMessages,
  },
};
export default meta;

type Story = StoryObj<typeof LiveShoppingEventTemplate>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { streamUrl: "", products: [], chatMessages: [] },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
