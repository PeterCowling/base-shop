import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState, SKU } from "@types";
import OrderSummary from "./OrderSummary";

const sku1: SKU = {
  id: "1",
  slug: "item-one",
  title: "Item One",
  price: 20,
  deposit: 5,
  forSale: true,
  forRental: false,
  image: "https://placehold.co/64",
  sizes: [],
  description: "",
};
const sku2: SKU = {
  id: "2",
  slug: "item-two",
  title: "Item Two",
  price: 15,
  deposit: 0,
  forSale: true,
  forRental: false,
  image: "https://placehold.co/64",
  sizes: [],
  description: "",
};

const cart: CartState = {
  [sku1.id]: { sku: sku1, qty: 2 },
  [sku2.id]: { sku: sku2, qty: 1 },
};

const meta: Meta<typeof OrderSummary> = {
  component: OrderSummary,
  args: { cart },
};
export default meta;

export const Default: StoryObj<typeof OrderSummary> = {
  render: (args) => (
    <div className="space-y-2">
      <OrderSummary {...args} />
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td />
            <td className="py-2">Shipping</td>
            <td className="text-right">€5</td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Tax</td>
            <td className="text-right">€3</td>
          </tr>
          <tr>
            <td />
            <td className="py-2">Discount</td>
            <td className="text-right">-€2</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
