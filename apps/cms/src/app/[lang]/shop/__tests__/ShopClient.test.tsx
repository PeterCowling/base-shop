import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { SKU } from "@acme/types";

import ShopClient from "../ShopClient.client";

// Mock next/navigation hooks used by ShopClient
const mockPush = jest.fn();
let search = "";

jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(search),
}));

// Lightweight mock components used by ShopClient
function mockFilterBar({ definitions, values, onChange }: any) {
  return (
    <form>
      {definitions.map((def: any) =>
        def.type === "select" ? (
          <label key={def.name}>
            {def.label}:
            <select
              aria-label={def.label}
              value={values[def.name] ?? ""}
              onChange={(e) =>
                onChange({ ...values, [def.name]: e.target.value || undefined })
              }
            >
              <option value="">All</option>
              {def.options.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label key={def.name}>
            {def.label}:
            <input
              aria-label={def.label}
              type="number"
              value={values[def.name] ?? ""}
              onChange={(e) =>
                onChange({
                  ...values,
                  [def.name]:
                    e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
        )
      )}
    </form>
  );
}

function mockProductGrid({ skus }: any) {
  return (
    <ul>
      {skus.map((s: any) => (
        <li key={s.id}>{s.title}</li>
      ))}
    </ul>
  );
}

jest.mock("@acme/platform-core/components/shop/FilterBar", () => ({
  __esModule: true,
  default: mockFilterBar,
}));

jest.mock("@acme/platform-core/components/shop/ProductGrid", () => ({
  __esModule: true,
  ProductGrid: mockProductGrid,
}));

const skus: SKU[] = [
  {
    id: "1",
    slug: "red-shirt",
    title: "Red Shirt",
    price: 1000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
  {
    id: "2",
    slug: "blue-shirt",
    title: "Blue Shirt",
    price: 1000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
  {
    id: "3",
    slug: "red-large-shirt",
    title: "Red Large Shirt",
    price: 1000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["L"],
    description: "",
  },
  {
    id: "4",
    slug: "red-expensive-shirt",
    title: "Red Expensive Shirt",
    price: 2000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
  {
    id: "5",
    slug: "red-pants",
    title: "Red Pants",
    price: 500,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
];

describe("ShopClient filters", () => {
  beforeEach(() => {
    mockPush.mockClear();
    search = "";
  });

  it("filters products based on query, size, color, and max price", () => {
    render(<ShopClient skus={skus} />);

    // Apply size, color and price filters
    fireEvent.change(screen.getByLabelText(/size/i), {
      target: { value: "M" },
    });
    fireEvent.change(screen.getByLabelText(/color/i), {
      target: { value: "red" },
    });
    fireEvent.change(screen.getByLabelText(/max price/i), {
      target: { value: "1500" },
    });

    // Items filtered by size/color/price
    expect(screen.getByText("Red Shirt")).toBeInTheDocument();
    expect(screen.getByText("Red Pants")).toBeInTheDocument();
    expect(screen.queryByText("Blue Shirt")).not.toBeInTheDocument();
    expect(screen.queryByText("Red Large Shirt")).not.toBeInTheDocument();
    expect(screen.queryByText("Red Expensive Shirt")).not.toBeInTheDocument();

    // Title filter
    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: "shirt" },
    });

    expect(screen.getByText("Red Shirt")).toBeInTheDocument();
    expect(screen.queryByText("Red Pants")).not.toBeInTheDocument();
  });

  it("pushes updated query string when filters change", async () => {
    render(<ShopClient skus={skus} />);
    mockPush.mockClear();

    fireEvent.change(screen.getByLabelText(/search products/i), {
      target: { value: "red" },
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/shop?q=red")
    );

    fireEvent.change(screen.getByLabelText(/size/i), {
      target: { value: "M" },
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/shop?q=red&size=M")
    );

    fireEvent.change(screen.getByLabelText(/color/i), {
      target: { value: "red" },
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/shop?q=red&size=M&color=red")
    );

    fireEvent.change(screen.getByLabelText(/max price/i), {
      target: { value: "1500" },
    });

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        "/shop?q=red&size=M&color=red&maxPrice=1500"
      )
    );
  });
});

