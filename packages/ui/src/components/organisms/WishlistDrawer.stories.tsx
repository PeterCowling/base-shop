"use client";
import { type Meta, type StoryObj } from "@storybook/react";
import { WishlistDrawer } from "./WishlistDrawer";

const items = [
  { id: "1", title: "Trail Shoes", price: 9900 } as any,
  { id: "2", title: "Thermal Jacket", price: 15900 } as any,
];

const meta: Meta<typeof WishlistDrawer> = {
  title: "Organisms/WishlistDrawer",
  component: WishlistDrawer,
};
export default meta;

export const Default: StoryObj<typeof WishlistDrawer> = {
  render: () => (
    <div className="p-8">
      <WishlistDrawer trigger={<button className="rounded border px-3 py-1">Open wishlist</button>} items={items} />
    </div>
  ),
};

