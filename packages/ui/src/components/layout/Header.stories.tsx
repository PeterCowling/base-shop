import { type Meta, type StoryObj } from "@storybook/react";
import HeaderClient from "./HeaderClient.client";
import { CartProvider } from "@acme/platform-core/contexts/CartContext";

const meta = {
  component: HeaderClient,
  args: {
    lang: "en",
    height: "h-16",
    padding: "px-6",
    initialQty: 2,
    nav: [
      { label: "Home", url: "/" },
      { label: "Products", url: "/products" },
      { label: "About", url: "/about" },
    ],
  },
  argTypes: {
    lang: { control: "text" },
    height: { control: "text" },
    padding: { control: "text" },
    initialQty: { control: "number" },
  },
  decorators: [
    (Story) => (
      <CartProvider>
        <Story />
      </CartProvider>
    ),
  ],
} satisfies Meta<typeof HeaderClient>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
