import { render, screen } from "@testing-library/react";
import ShopClient from "../ShopClient.client";
import type { SKU } from "@acme/types";

// Mock next/navigation hooks used by ShopClient
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/shop",
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
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
                <option key={opt}>{opt}</option>
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

jest.mock("@platform-core/components/shop/FilterBar", () => ({
  __esModule: true,
  default: mockFilterBar,
}));

jest.mock("@platform-core/components/shop/ProductGrid", () => ({
  __esModule: true,
  ProductGrid: mockProductGrid,
}));

const skus: SKU[] = [
  {
    id: "1",
    slug: "cheap-shirt",
    title: "Cheap Shirt",
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
    slug: "expensive-shirt",
    title: "Expensive Shirt",
    price: 2000,
    deposit: 0,
    stock: 10,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "",
  },
];

describe("ShopClient maxPrice filter", () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.history.replaceState({}, "", "/shop?maxPrice=1500");
  });

  it("initializes maxPrice filter and filters products", () => {
    render(<ShopClient skus={skus} />);
    const input = screen.getByLabelText(/max price/i) as HTMLInputElement;
    expect(input.value).toBe("1500");
    expect(screen.getByText("Cheap Shirt")).toBeInTheDocument();
    expect(screen.queryByText("Expensive Shirt")).not.toBeInTheDocument();
  });
});
