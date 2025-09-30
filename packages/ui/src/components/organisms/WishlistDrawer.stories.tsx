"use client";
/* i18n-exempt file -- Storybook demo content uses literal strings */
import { type Meta, type StoryObj } from "@storybook/react";
import { WishlistDrawer } from "./WishlistDrawer";
import type { SKU } from "@acme/types";

const items: SKU[] = [
  { id: "1", title: "Trail Shoes", price: 9900, slug: "trail-shoes", deposit: 0, stock: 0, forSale: true, forRental: false, media: [], sizes: [], description: "" },
  { id: "2", title: "Thermal Jacket", price: 15900, slug: "thermal-jacket", deposit: 0, stock: 0, forSale: true, forRental: false, media: [], sizes: [], description: "" },
];

const meta: Meta<typeof WishlistDrawer> = {
  title: "Organisms/WishlistDrawer",
  component: WishlistDrawer,
  decorators: [
    (Story) => (
      <div className="p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof WishlistDrawer> = {
  render: () => (
    <WishlistDrawer
      trigger={<button className="rounded border px-3 min-h-10 min-w-10">Open wishlist</button>}
      items={items}
    />
  ),
};
