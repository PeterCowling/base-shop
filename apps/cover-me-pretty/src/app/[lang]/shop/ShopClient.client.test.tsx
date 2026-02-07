import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SKU } from "@acme/types";

import ShopClient from "./ShopClient.client";

// Mock ProductGrid to render simple titles for assertions
jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  ProductGrid: ({ skus }: { skus: SKU[] }) => (
    <div data-testid="product-grid">
      {skus.map((s) => (
        <div key={s.id}>{s.title}</div>
      ))}
    </div>
  ),
}));

const push = jest.fn();
let searchParams: URLSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  useRouter: () => ({ push }),
  usePathname: () => "/shop",
}));

const skus: SKU[] = [
  {
    id: "1",
    slug: "red-shirt",
    title: "Red Shirt",
    price: 1000,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["S", "M"],
    description: "",
  },
  {
    id: "2",
    slug: "blue-pants",
    title: "Blue Pants",
    price: 2000,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
  {
    id: "3",
    slug: "red-hat",
    title: "Red Hat",
    price: 1500,
    deposit: 0,
    stock: 1,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["L"],
    description: "",
  },
];

describe("ShopClient", () => {
  beforeEach(() => {
    push.mockClear();
    searchParams = new URLSearchParams();
  });

  it("filters SKUs and updates router query", async () => {
    render(<ShopClient skus={skus} />);

    const input = screen.getByLabelText(/search products/i);
    await userEvent.type(input, "red");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/shop?q=red"));
    expect(screen.queryByText("Blue Pants")).not.toBeInTheDocument();
    expect(screen.getByText("Red Shirt")).toBeInTheDocument();
    expect(screen.getByText("Red Hat")).toBeInTheDocument();

    const sizeSelect = screen.getByLabelText("Size:");
    await userEvent.selectOptions(sizeSelect, "L");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/shop?q=red&size=L"));
    expect(screen.queryByText("Red Shirt")).not.toBeInTheDocument();
    expect(screen.getByText("Red Hat")).toBeInTheDocument();
  });

  it("initializes state from existing search params", () => {
    searchParams = new URLSearchParams("q=hat&color=red");
    render(<ShopClient skus={skus} />);

    expect(push).not.toHaveBeenCalled();
    const input = screen.getByLabelText(/search products/i) as HTMLInputElement;
    expect(input.value).toBe("hat");
    const colorSelect = screen.getByLabelText("Color:") as HTMLSelectElement;
    expect(colorSelect.value).toBe("red");
    expect(screen.getByText("Red Hat")).toBeInTheDocument();
    expect(screen.queryByText("Red Shirt")).not.toBeInTheDocument();
    expect(screen.queryByText("Blue Pants")).not.toBeInTheDocument();
  });
});

