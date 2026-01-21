import type { SKU } from "@acme/types";

export const XA_PRODUCTS: readonly SKU[] = [
  {
    id: "green-sneaker",
    slug: "green-sneaker",
    title: "Green Runner Sneaker",
    price: 129,
    deposit: 0,
    stock: 48,
    forSale: true,
    forRental: false,
    media: [
      { type: "image", url: "/shop/green.jpg", altText: "Green runner sneaker" },
      { type: "image", url: "/shop/sand.jpg", altText: "Green runner sneaker side view" },
    ],
    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"],
    description:
      "Lightweight everyday runner with breathable upper and grippy outsole.",
  },
  {
    id: "sand-sneaker",
    slug: "sand-sneaker",
    title: "Sand Runner Sneaker",
    price: 119,
    deposit: 0,
    stock: 32,
    forSale: true,
    forRental: false,
    media: [
      { type: "image", url: "/shop/sand.jpg", altText: "Sand runner sneaker" },
      { type: "image", url: "/shop/black.jpg", altText: "Sand runner sneaker alternate view" },
    ],
    sizes: ["US 6", "US 7", "US 8", "US 9", "US 10"],
    description:
      "Neutral sand tone runner built for daily comfort and clean styling.",
  },
  {
    id: "black-sneaker",
    slug: "black-sneaker",
    title: "Black Runner Sneaker",
    price: 139,
    deposit: 0,
    stock: 18,
    forSale: true,
    forRental: false,
    media: [
      { type: "image", url: "/shop/black.jpg", altText: "Black runner sneaker" },
      { type: "image", url: "/shop/green.jpg", altText: "Black runner sneaker alternate view" },
    ],
    sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"],
    description:
      "All-black runner with premium finish and versatile wear-anywhere look.",
  },
] as const;