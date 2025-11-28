import { useCart } from "@acme/platform-core/contexts/CartContext";
import { type Meta, type StoryObj } from "@storybook/nextjs";
import type { CartLine, CartState } from "@acme/platform-core/cart";
import type { SKU } from "@acme/types";
import * as React from "react";
import { Button } from "../atoms/shadcn";
import { MiniCart } from "./MiniCart.client";

const sku1: SKU = {
  id: "1",
  slug: "item-one",
  title: "Item One",
  price: 20,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/64", type: "image" }],
  sizes: [],
  description: "",
};
const sku2: SKU = {
  id: "2",
  slug: "item-two",
  title: "Item Two",
  price: 15,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "https://placehold.co/64", type: "image" }],
  sizes: [],
  description: "",
};

interface WrapperProps {
  items: CartState;
}

function CartInitializer({ items }: WrapperProps) {
  const [, dispatch] = useCart();
  React.useEffect(() => {
    Object.entries<CartLine>(items).forEach(([id, line]) => {
      dispatch({ type: "add", sku: line.sku, size: line.size });
      if (line.qty > 1) {
        dispatch({ type: "setQty", id, qty: line.qty });
      }
    });
  }, [items, dispatch]);
  return null;
}

function MiniCartWrapper({ items }: WrapperProps) {
  return (
    <>
      <CartInitializer items={items} />
      <MiniCart trigger={<Button>Open cart</Button>} />
    </>
  );
}

const meta: Meta<typeof MiniCartWrapper> = {
  component: MiniCartWrapper,
  parameters: {
    providers: {
      cart: true,
    },
  },
  args: {
    items: {},
  },
};
export default meta;

export const Empty: StoryObj<typeof MiniCartWrapper> = {};

export const Filled: StoryObj<typeof MiniCartWrapper> = {
  args: {
    items: {
      [sku1.id as string]: { sku: sku1, qty: 2 },
      [sku2.id as string]: { sku: sku2, qty: 1 },
    } as CartState,
  },
};
