import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopClient from "../../apps/cms/src/app/[lang]/shop/ShopClient.client";
import type { SKU } from "@acme/types";

// Mock next/navigation hooks used by ShopClient
const mockPush = jest.fn((url: string) => {
  window.history.pushState({}, "", url);
});

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
    sizes: ["S", "M"],
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
    sizes: ["M", "L"],
    description: "",
  },
];

describe("ShopClient URL state", () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.history.replaceState({}, "", "/shop");
  });

  it("persists search query and filter selections across reloads", async () => {
    const { unmount } = render(<ShopClient skus={skus} />);

    const search = screen.getByLabelText(/search products/i);
    await userEvent.type(search, "red");

    const color = screen.getByLabelText(/color/i);
    await userEvent.selectOptions(color, "red");

    await waitFor(() => {
      expect(window.location.search).toContain("q=red");
      expect(window.location.search).toContain("color=red");
    });

    unmount();

    render(<ShopClient skus={skus} />);
    expect(
      (screen.getByLabelText(/search products/i) as HTMLInputElement).value
    ).toBe("red");
    expect(
      (screen.getByLabelText(/color/i) as HTMLSelectElement).value
    ).toBe("red");
  });
});

