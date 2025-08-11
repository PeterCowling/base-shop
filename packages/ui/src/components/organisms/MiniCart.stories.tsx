import { CartProvider, useCart } from "@platform-core/src/contexts/CartContext";
import { type Meta, type StoryObj } from "@storybook/react";
import type { CartState } from "@/lib/cartCookie";
import { cartKey } from "@/lib/cartCookie";
import type { SKU } from "@types";
import * as React from "react";
import { Button } from "../atoms/shadcn";
import { MiniCart } from "./MiniCart.client";

const sku1: SKU = {
  id: "1",
  slug: "item-one",
  title: "Item One",
  price: 20,
  deposit: 0,
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

interface WrapperProps {
  items: CartState;
}

function CartInitializer({ items }: WrapperProps) {
  const [, dispatch] = useCart();
  React.useEffect(() => {
    Object.values(items).forEach((line) => {
      dispatch({ type: "add", sku: line.sku, size: line.size });
      if (line.qty > 1) {
        dispatch({
          type: "setQty",
          id: cartKey(line.sku.id, line.size),
          qty: line.qty,
        });
      }
    });
  }, [items, dispatch]);
  return null;
}

function MiniCartWrapper({ items }: WrapperProps) {
  return (
    <CartProvider>
      <CartInitializer items={items} />
      <MiniCart trigger={<Button>Open cart</Button>} />
    </CartProvider>
  );
}

const meta: Meta<typeof MiniCartWrapper> = {
  component: MiniCartWrapper,
  args: {
    items: {},
  },
};
export default meta;

export const Empty: StoryObj<typeof MiniCartWrapper> = {};

export const Filled: StoryObj<typeof MiniCartWrapper> = {
  args: {
    items: {
      [sku1.id]: { sku: sku1, qty: 2 },
      [sku2.id]: { sku: sku2, qty: 1 },
    },
  },
};
